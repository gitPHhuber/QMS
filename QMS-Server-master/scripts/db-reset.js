#!/usr/bin/env node

/**
 * scripts/db-reset.js — Full database reset for ASVO-QMS
 *
 * 1. Drops all tables (DROP SCHEMA public CASCADE; CREATE SCHEMA public)
 * 2. Runs all migrations via sequelize-cli
 * 3. Syncs any remaining models not covered by migrations
 * 4. Seeds initial data (roles, abilities, role-ability assignments)
 * 5. Prints summary report
 *
 * Usage: npm run db:reset
 */

require("dotenv").config();
const { execSync } = require("child_process");
const path = require("path");

async function main() {
  console.log("╔══════════════════════════════════════╗");
  console.log("║       ASVO-QMS Database Reset        ║");
  console.log("╚══════════════════════════════════════╝");
  console.log();

  // --- 1. Connect to DB ---
  const sequelize = require("../db");
  try {
    await sequelize.authenticate();
    console.log("✅ Database connection OK");
  } catch (e) {
    console.error("❌ Cannot connect to database:", e.message);
    process.exit(1);
  }

  // --- 2. Drop everything ---
  console.log("\n>>> Dropping all tables...");
  try {
    await sequelize.query("DROP SCHEMA public CASCADE;");
    await sequelize.query("CREATE SCHEMA public;");
    await sequelize.query("GRANT ALL ON SCHEMA public TO public;");
    console.log("✅ Schema dropped and recreated");
  } catch (e) {
    console.error("❌ Error dropping schema:", e.message);
    process.exit(1);
  }

  // --- 3. Run migrations ---
  console.log("\n>>> Running migrations...");
  try {
    const migrationsDir = path.resolve(__dirname, "..");
    const output = execSync("npx sequelize-cli db:migrate", {
      cwd: migrationsDir,
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
      env: { ...process.env },
    });
    console.log(output);
    console.log("✅ All migrations applied");
  } catch (e) {
    console.error("❌ Migration failed:");
    if (e.stdout) console.error(e.stdout);
    if (e.stderr) console.error(e.stderr);
    process.exit(1);
  }

  // --- 4. Sync remaining models not covered by migrations ---
  console.log("\n>>> Syncing remaining models (alter: true for safety)...");
  try {
    // Re-require models (they register with sequelize instance)
    require("../models/index");
    await sequelize.sync({ alter: true });
    console.log("✅ Model sync complete");
  } catch (e) {
    console.error("⚠️  Model sync warning:", e.message);
    // Non-fatal: migrations should have created everything
  }

  // --- 5. Initialize roles and abilities ---
  console.log("\n>>> Initializing RBAC (roles, abilities)...");
  try {
    const models = require("../models/index");

    // Permissions
    const permissions = [
      { code: "rbac.manage", description: "Управление ролями и матрицей прав" },
      { code: "users.manage", description: "Назначение ролей пользователям" },
      { code: "warehouse.view", description: "Просмотр остатков" },
      { code: "warehouse.manage", description: "Приемка, создание коробок, перемещение" },
      { code: "labels.print", description: "Печать этикеток" },
      { code: "dms.view", description: "Просмотр реестра документов" },
      { code: "dms.create", description: "Создание документов" },
      { code: "dms.approve", description: "Согласование документов" },
      { code: "dms.manage", description: "Введение в действие, рассылка" },
      { code: "qms.audit.view", description: "Расширенный аудит-лог" },
      { code: "qms.audit.verify", description: "Верификация hash-chain" },
      { code: "qms.audit.report", description: "Отчёты для инспекции" },
      { code: "nc.view", description: "Просмотр несоответствий" },
      { code: "nc.create", description: "Регистрация NC" },
      { code: "nc.manage", description: "Управление NC" },
      { code: "capa.view", description: "Просмотр CAPA" },
      { code: "capa.create", description: "Создание CAPA" },
      { code: "capa.manage", description: "Управление CAPA" },
      { code: "capa.verify", description: "Проверка эффективности CAPA" },
      { code: "risk.read", description: "Просмотр реестра рисков" },
      { code: "risk.create", description: "Идентификация рисков" },
      { code: "risk.update", description: "Обновление оценки рисков" },
      { code: "risk.assess", description: "Проведение оценки рисков" },
      { code: "risk.accept", description: "Принятие остаточного риска" },
      { code: "supplier.read", description: "Просмотр поставщиков" },
      { code: "supplier.manage", description: "Управление поставщиками" },
      { code: "training.read", description: "Просмотр записей обучения" },
      { code: "training.manage", description: "Управление обучением" },
      { code: "equipment.read", description: "Просмотр оборудования" },
      { code: "equipment.calibrate", description: "Калибровка/поверка" },
      { code: "review.read", description: "Просмотр анализа руководства" },
      { code: "review.manage", description: "Проведение анализа руководства" },
      { code: "analytics.view", description: "Просмотр дашбордов и KPI" },
      { code: "audit.log.view", description: "Просмотр журнала аудита" },
    ];

    for (const p of permissions) {
      await models.Ability.findOrCreate({ where: { code: p.code }, defaults: p });
    }
    console.log(`  ✅ ${permissions.length} abilities ensured`);

    // Roles
    const rolesData = [
      { code: "SUPER_ADMIN", name: "SUPER_ADMIN", description: "Полный доступ" },
      { code: "QMS_DIRECTOR", name: "QMS_DIRECTOR", description: "Директор по качеству" },
      { code: "QMS_ENGINEER", name: "QMS_ENGINEER", description: "Инженер по качеству" },
      { code: "QMS_AUDITOR", name: "QMS_AUDITOR", description: "Внутренний аудитор" },
      { code: "DOC_CONTROLLER", name: "DOC_CONTROLLER", description: "Управление документацией" },
      { code: "QC_ENGINEER", name: "QC_ENGINEER", description: "Инженер ОТК" },
      { code: "WAREHOUSE_MASTER", name: "WAREHOUSE_MASTER", description: "Кладовщик" },
      { code: "VIEWER", name: "VIEWER", description: "Наблюдатель — только просмотр" },
    ];

    for (const roleData of rolesData) {
      await models.Role.findOrCreate({
        where: { code: roleData.code },
        defaults: roleData,
      });
    }
    console.log(`  ✅ ${rolesData.length} roles ensured`);

    // Role-Ability assignments
    const assign = async (roleName, slugs) => {
      const role = await models.Role.findOne({ where: { name: roleName } });
      if (!role) return;
      let abilities;
      if (slugs === "*") {
        abilities = await models.Ability.findAll();
      } else {
        abilities = await models.Ability.findAll({ where: { code: slugs } });
      }
      if (abilities.length) {
        await role.setAbilities(abilities);
      }
    };

    await assign("SUPER_ADMIN", "*");
    await assign("QMS_DIRECTOR", [
      "dms.view", "dms.create", "dms.approve", "dms.manage",
      "nc.view", "nc.create", "nc.manage",
      "capa.view", "capa.create", "capa.manage", "capa.verify",
      "risk.read", "risk.create", "risk.update", "risk.assess", "risk.accept",
      "supplier.read", "supplier.manage",
      "training.read", "training.manage",
      "equipment.read", "equipment.calibrate",
      "review.read", "review.manage",
      "qms.audit.view", "qms.audit.verify", "qms.audit.report",
      "analytics.view", "audit.log.view",
      "warehouse.view", "rbac.manage", "users.manage",
    ]);
    await assign("QMS_ENGINEER", [
      "dms.view", "dms.create",
      "nc.view", "nc.create", "nc.manage",
      "capa.view", "capa.create",
      "risk.read", "risk.create", "risk.update", "risk.assess",
      "supplier.read",
      "training.read", "training.manage",
      "equipment.read", "equipment.calibrate",
      "review.read",
      "qms.audit.view",
      "analytics.view", "audit.log.view",
    ]);
    await assign("QMS_AUDITOR", [
      "dms.view", "nc.view", "capa.view", "risk.read",
      "supplier.read", "training.read", "equipment.read", "review.read",
      "qms.audit.view", "qms.audit.verify", "qms.audit.report",
      "analytics.view", "audit.log.view",
    ]);
    await assign("DOC_CONTROLLER", [
      "dms.view", "dms.create", "dms.approve", "dms.manage",
      "training.read", "analytics.view",
    ]);
    await assign("QC_ENGINEER", [
      "warehouse.view",
      "nc.view", "nc.create", "nc.manage",
      "capa.view", "capa.create", "capa.manage", "capa.verify",
      "qms.audit.view", "risk.read", "equipment.read",
    ]);
    await assign("WAREHOUSE_MASTER", [
      "warehouse.view", "warehouse.manage", "labels.print",
      "supplier.read", "nc.view", "nc.create", "dms.view",
    ]);
    await assign("VIEWER", [
      "dms.view", "nc.view", "capa.view", "risk.read",
      "supplier.read", "training.read", "equipment.read",
      "review.read", "analytics.view",
    ]);

    console.log("  ✅ Role-ability assignments complete");

    // --- 6. Summary ---
    const tableCount = await sequelize.query(
      "SELECT COUNT(*) AS cnt FROM pg_tables WHERE schemaname = 'public'",
      { type: sequelize.constructor.QueryTypes.SELECT }
    );
    const roleCount = await models.Role.count();
    const abilityCount = await models.Ability.count();

    console.log("\n╔══════════════════════════════════════╗");
    console.log("║         DB Reset — Summary           ║");
    console.log("╠══════════════════════════════════════╣");
    console.log(`║  Tables:     ${String(tableCount[0].cnt).padEnd(24)}║`);
    console.log(`║  Roles:      ${String(roleCount).padEnd(24)}║`);
    console.log(`║  Abilities:  ${String(abilityCount).padEnd(24)}║`);
    console.log("╚══════════════════════════════════════╝");
    console.log("\n✅ Database reset complete!");
  } catch (e) {
    console.error("❌ RBAC initialization failed:", e);
    process.exit(1);
  }

  process.exit(0);
}

main();
