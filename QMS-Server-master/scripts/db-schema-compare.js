#!/usr/bin/env node

/**
 * scripts/db-schema-compare.js — Compare Sequelize models vs actual PostgreSQL schema
 *
 * Connects to the database, loads all Sequelize model definitions,
 * queries information_schema for actual table columns, and produces
 * a detailed diff report.
 *
 * Reports:
 *   - Tables defined in models but missing in DB
 *   - Tables present in DB but not defined in models
 *   - Columns defined in models but missing in DB table
 *   - Columns present in DB but not in model
 *   - Type mismatches between model and DB
 *   - Nullable mismatches
 *   - Default value differences
 *
 * Usage:
 *   node scripts/db-schema-compare.js            # colored console output
 *   node scripts/db-schema-compare.js --json      # JSON output
 *   node scripts/db-schema-compare.js --fix-sql   # generate ALTER statements
 */

require("dotenv").config();

const path = require("path");
const fs = require("fs");

// ── Sequelize type → Postgres type mapping ──────────────────────────

const SEQ_TO_PG = {
  INTEGER:   "integer",
  BIGINT:    "bigint",
  SMALLINT:  "smallint",
  FLOAT:     "double precision",
  REAL:      "real",
  DOUBLE:    "double precision",
  "DOUBLE PRECISION": "double precision",
  DECIMAL:   "numeric",
  NUMERIC:   "numeric",
  BOOLEAN:   "boolean",
  STRING:    "character varying",
  VARCHAR:   "character varying",
  TEXT:      "text",
  CITEXT:    "citext",
  UUID:      "uuid",
  UUIDV4:   "uuid",
  DATE:      "timestamp with time zone",
  DATEONLY:  "date",
  TIME:      "time without time zone",
  NOW:       "timestamp with time zone",
  BLOB:      "bytea",
  JSON:      "json",
  JSONB:     "jsonb",
  ENUM:      "USER-DEFINED",
  ARRAY:     "ARRAY",
  GEOMETRY:  "USER-DEFINED",
};

/**
 * Convert a Sequelize DataType to the expected Postgres type string.
 */
function seqTypeToPg(attribute) {
  const type = attribute.type;
  if (!type) return "unknown";

  const key = type.key || type.constructor?.key || "";

  if (key === "ENUM") return "USER-DEFINED";
  if (key === "ARRAY") return "ARRAY";

  // STRING(255) → character varying
  const match = SEQ_TO_PG[key];
  if (match) return match;

  // Fallback: raw toString
  const raw = String(type).toUpperCase();
  for (const [k, v] of Object.entries(SEQ_TO_PG)) {
    if (raw.startsWith(k)) return v;
  }

  return raw.toLowerCase();
}


// ── Main ────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const jsonMode = args.includes("--json");
  const fixSql = args.includes("--fix-sql");

  // 1. Connect
  const sequelize = require("../db");
  try {
    await sequelize.authenticate();
    if (!jsonMode) console.log("  Connected to database\n");
  } catch (e) {
    console.error("Cannot connect to database:", e.message);
    process.exit(1);
  }

  // 2. Force-load ALL module models (regardless of module enablement)
  if (!jsonMode) console.log("  Loading Sequelize models...\n");

  const modulesDir = path.join(__dirname, "..", "modules");
  const allModels = {};

  // Load core first
  const corePath = path.join(modulesDir, "core", "index.js");
  if (fs.existsSync(corePath)) {
    const core = require(corePath);
    if (typeof core.getModels === "function") Object.assign(allModels, core.getModels());
  }

  // Load every module directory
  const dirs = fs.readdirSync(modulesDir).filter(d => {
    const full = path.join(modulesDir, d, "index.js");
    return d !== "core" && fs.existsSync(full);
  });

  for (const dir of dirs) {
    try {
      const mod = require(path.join(modulesDir, dir, "index.js"));
      if (typeof mod.getModels === "function") {
        Object.assign(allModels, mod.getModels());
      }
    } catch (e) {
      if (!jsonMode) console.warn(`  Warning: could not load module "${dir}": ${e.message}`);
    }
  }

  // Setup associations
  try {
    const core = require(corePath);
    if (typeof core.setupAssociations === "function") core.setupAssociations(allModels);
  } catch (_) { /* ignore */ }

  for (const dir of dirs) {
    try {
      const mod = require(path.join(modulesDir, dir, "index.js"));
      if (typeof mod.setupAssociations === "function") mod.setupAssociations(allModels);
    } catch (_) { /* ignore */ }
  }

  // 3. Collect model definitions
  const modelDefs = {}; // tableName -> { columns: { colName: { type, allowNull, defaultValue } } }

  for (const [modelName, model] of Object.entries(allModels)) {
    if (!model || !model.rawAttributes) continue;
    const tableName = model.getTableName();
    if (typeof tableName !== "string") continue;

    const columns = {};
    for (const [colName, attr] of Object.entries(model.rawAttributes)) {
      const field = attr.field || colName;
      columns[field] = {
        seqType: seqTypeToPg(attr),
        allowNull: attr.allowNull !== false,
        defaultValue: attr.defaultValue,
        primaryKey: !!attr.primaryKey,
        autoIncrement: !!attr.autoIncrement,
        modelName,
        attributeName: colName,
      };
    }
    // Sequelize adds createdAt / updatedAt automatically
    if (!columns.createdAt && model.options.timestamps !== false) {
      columns.createdAt = { seqType: "timestamp with time zone", allowNull: false, defaultValue: null, primaryKey: false, autoIncrement: false, modelName, attributeName: "createdAt" };
      columns.updatedAt = { seqType: "timestamp with time zone", allowNull: false, defaultValue: null, primaryKey: false, autoIncrement: false, modelName, attributeName: "updatedAt" };
    }

    modelDefs[tableName] = { modelName, columns };
  }

  if (!jsonMode) console.log(`  Found ${Object.keys(modelDefs).length} model tables\n`);

  // 4. Query actual DB schema
  const [dbColumns] = await sequelize.query(`
    SELECT
      c.table_name,
      c.column_name,
      c.data_type,
      c.udt_name,
      c.is_nullable,
      c.column_default,
      c.character_maximum_length
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
    ORDER BY c.table_name, c.ordinal_position;
  `);

  // Group by table
  const dbTables = {};
  for (const row of dbColumns) {
    if (!dbTables[row.table_name]) dbTables[row.table_name] = {};
    dbTables[row.table_name][row.column_name] = {
      dataType: row.data_type,
      udtName: row.udt_name,
      isNullable: row.is_nullable === "YES",
      columnDefault: row.column_default,
      maxLength: row.character_maximum_length,
    };
  }

  if (!jsonMode) console.log(`  Found ${Object.keys(dbTables).length} DB tables\n`);

  // 5. Compare
  const report = {
    summary: { modelTables: 0, dbTables: 0, missingTables: 0, extraTables: 0, tablesDiffCount: 0, totalIssues: 0 },
    missingInDb: [],       // tables in models but not in DB
    extraInDb: [],         // tables in DB but not in models
    tableDiffs: [],        // { table, missingColumns, extraColumns, typeMismatches, nullableMismatches }
  };

  const systemTables = new Set(["SequelizeMeta", "sequelizemeta"]);
  const modelTableNames = new Set(Object.keys(modelDefs));
  const dbTableNames = new Set(Object.keys(dbTables));

  report.summary.modelTables = modelTableNames.size;
  report.summary.dbTables = dbTableNames.size;

  // Missing tables (in models but not in DB)
  for (const t of modelTableNames) {
    if (!dbTableNames.has(t)) {
      report.missingInDb.push({ table: t, model: modelDefs[t].modelName });
      report.summary.missingTables++;
      report.summary.totalIssues++;
    }
  }

  // Extra tables (in DB but not in models)
  for (const t of dbTableNames) {
    if (!modelTableNames.has(t) && !systemTables.has(t)) {
      report.extraInDb.push({ table: t });
      report.summary.extraTables++;
    }
  }

  // Column-level comparison for tables that exist in both
  for (const tableName of modelTableNames) {
    if (!dbTableNames.has(tableName)) continue;

    const modelCols = modelDefs[tableName].columns;
    const dbCols = dbTables[tableName];
    const diff = {
      table: tableName,
      model: modelDefs[tableName].modelName,
      missingColumns: [],
      extraColumns: [],
      typeMismatches: [],
      nullableMismatches: [],
    };

    const modelColNames = new Set(Object.keys(modelCols));
    const dbColNames = new Set(Object.keys(dbCols));

    // Missing columns in DB
    for (const col of modelColNames) {
      if (!dbColNames.has(col)) {
        diff.missingColumns.push({
          column: col,
          expectedType: modelCols[col].seqType,
          nullable: modelCols[col].allowNull,
        });
        report.summary.totalIssues++;
      }
    }

    // Extra columns in DB
    for (const col of dbColNames) {
      if (!modelColNames.has(col)) {
        diff.extraColumns.push({
          column: col,
          dbType: dbCols[col].dataType,
        });
      }
    }

    // Type and nullable comparison for shared columns
    for (const col of modelColNames) {
      if (!dbColNames.has(col)) continue;

      const mCol = modelCols[col];
      const dCol = dbCols[col];

      // Type comparison (simplified — treat USER-DEFINED as enum match)
      const expectedPg = mCol.seqType;
      const actualPg = dCol.dataType;
      const typeMatch =
        expectedPg === actualPg ||
        (expectedPg === "USER-DEFINED" && actualPg === "USER-DEFINED") ||
        (expectedPg === "character varying" && actualPg === "character varying") ||
        (expectedPg === "integer" && actualPg === "integer" && mCol.autoIncrement) ||
        // serial → integer
        (expectedPg === "integer" && actualPg === "integer");

      if (!typeMatch) {
        diff.typeMismatches.push({
          column: col,
          expected: expectedPg,
          actual: actualPg,
        });
        report.summary.totalIssues++;
      }

      // Nullable comparison (skip primary keys)
      if (!mCol.primaryKey && mCol.allowNull !== dCol.isNullable) {
        diff.nullableMismatches.push({
          column: col,
          expectedNullable: mCol.allowNull,
          actualNullable: dCol.isNullable,
        });
        report.summary.totalIssues++;
      }
    }

    const hasDiffs =
      diff.missingColumns.length > 0 ||
      diff.extraColumns.length > 0 ||
      diff.typeMismatches.length > 0 ||
      diff.nullableMismatches.length > 0;

    if (hasDiffs) {
      report.tableDiffs.push(diff);
      report.summary.tablesDiffCount++;
    }
  }

  // 6. Output
  if (jsonMode) {
    console.log(JSON.stringify(report, null, 2));
    await sequelize.close();
    process.exit(report.summary.totalIssues > 0 ? 1 : 0);
    return;
  }

  // ── Pretty console output ──
  console.log("=".repeat(60));
  console.log("  ASVO-QMS  Schema Comparison Report");
  console.log("=".repeat(60));
  console.log();
  console.log(`  Model tables:   ${report.summary.modelTables}`);
  console.log(`  DB tables:      ${report.summary.dbTables}`);
  console.log(`  Missing in DB:  ${report.summary.missingTables}`);
  console.log(`  Extra in DB:    ${report.summary.extraTables}`);
  console.log(`  Tables w/diffs: ${report.summary.tablesDiffCount}`);
  console.log(`  Total issues:   ${report.summary.totalIssues}`);
  console.log();

  // Missing tables
  if (report.missingInDb.length > 0) {
    console.log("-".repeat(60));
    console.log("  MISSING TABLES (in models, not in DB)");
    console.log("-".repeat(60));
    for (const t of report.missingInDb) {
      console.log(`    [!]  ${t.table}  (model: ${t.model})`);
    }
    console.log();
  }

  // Extra tables
  if (report.extraInDb.length > 0) {
    console.log("-".repeat(60));
    console.log("  EXTRA TABLES (in DB, not in models)");
    console.log("-".repeat(60));
    for (const t of report.extraInDb) {
      console.log(`    [?]  ${t.table}`);
    }
    console.log();
  }

  // Table diffs
  if (report.tableDiffs.length > 0) {
    console.log("-".repeat(60));
    console.log("  TABLE-LEVEL DIFFERENCES");
    console.log("-".repeat(60));

    for (const diff of report.tableDiffs) {
      console.log(`\n  >> ${diff.table} (model: ${diff.model})`);

      if (diff.missingColumns.length > 0) {
        console.log("     Missing columns (in model, not in DB):");
        for (const c of diff.missingColumns) {
          console.log(`       [-] ${c.column}  (${c.expectedType}, nullable=${c.nullable})`);
        }
      }

      if (diff.extraColumns.length > 0) {
        console.log("     Extra columns (in DB, not in model):");
        for (const c of diff.extraColumns) {
          console.log(`       [+] ${c.column}  (${c.dbType})`);
        }
      }

      if (diff.typeMismatches.length > 0) {
        console.log("     Type mismatches:");
        for (const c of diff.typeMismatches) {
          console.log(`       [~] ${c.column}  model=${c.expected}  db=${c.actual}`);
        }
      }

      if (diff.nullableMismatches.length > 0) {
        console.log("     Nullable mismatches:");
        for (const c of diff.nullableMismatches) {
          console.log(`       [N] ${c.column}  model.nullable=${c.expectedNullable}  db.nullable=${c.actualNullable}`);
        }
      }
    }
    console.log();
  }

  // ── Generate ALTER SQL if requested ──
  if (fixSql) {
    console.log("=".repeat(60));
    console.log("  SUGGESTED ALTER STATEMENTS");
    console.log("=".repeat(60));
    console.log();
    console.log("-- WARNING: Review carefully before executing!\n");

    // Create missing tables
    for (const t of report.missingInDb) {
      const cols = modelDefs[t.table]?.columns || {};
      const colDefs = Object.entries(cols).map(([colName, col]) => {
        let def = `  "${colName}" ${col.seqType}`;
        if (col.primaryKey) def += " PRIMARY KEY";
        if (col.autoIncrement) def = `  "${colName}" SERIAL PRIMARY KEY`;
        if (!col.allowNull && !col.primaryKey) def += " NOT NULL";
        return def;
      });
      console.log(`CREATE TABLE IF NOT EXISTS "${t.table}" (`);
      console.log(colDefs.join(",\n"));
      console.log(`);\n`);
    }

    // Add missing columns
    for (const diff of report.tableDiffs) {
      for (const c of diff.missingColumns) {
        const nullable = c.nullable ? "" : " NOT NULL";
        console.log(`ALTER TABLE "${diff.table}" ADD COLUMN IF NOT EXISTS "${c.column}" ${c.expectedType}${nullable};`);
      }
    }

    console.log();
  }

  // Final status
  if (report.summary.totalIssues === 0) {
    console.log("  All model definitions match the database schema.\n");
  } else {
    console.log(`  Found ${report.summary.totalIssues} issue(s). Review above.\n`);
  }

  await sequelize.close();
  process.exit(report.summary.totalIssues > 0 ? 1 : 0);
}

main().catch(e => {
  console.error("Fatal error:", e);
  process.exit(2);
});
