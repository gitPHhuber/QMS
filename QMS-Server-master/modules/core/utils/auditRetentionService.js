const sequelize = require("../../../db");

const DEFAULT_RETENTION_YEARS = 5;
const DEFAULT_PRODUCT_LIFETIME_YEARS = 0;
const DEFAULT_BATCH_SIZE = 1000;
const DEFAULT_INTERVAL_MS = 24 * 60 * 60 * 1000;

function envNumber(name, fallback) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function isEnabled() {
  const raw = (process.env.AUDIT_RETENTION_ENABLED || "true").toLowerCase();
  return raw !== "false" && raw !== "0";
}

function getRetentionCutoffDate() {
  const years =
    envNumber("AUDIT_PRODUCT_LIFETIME_YEARS", DEFAULT_PRODUCT_LIFETIME_YEARS) +
    envNumber("AUDIT_RETENTION_YEARS", DEFAULT_RETENTION_YEARS);

  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - years);
  return cutoff;
}

async function archiveBatch(cutoffDate, batchSize) {
  const transaction = await sequelize.transaction();

  try {
    await sequelize.query(
      `SELECT set_config('audit.allow_mutation', 'on', true);`,
      { transaction }
    );

    const [result] = await sequelize.query(
      `
      WITH moved_rows AS (
        SELECT *
        FROM audit_logs
        WHERE "createdAt" < :cutoffDate
        ORDER BY "createdAt" ASC, id ASC
        LIMIT :batchSize
        FOR UPDATE SKIP LOCKED
      ), inserted AS (
        INSERT INTO audit_logs_archive (
          "sourceAuditId", "userId", action, entity, "entityId", description, metadata,
          "chainIndex", "prevHash", "currentHash", "dataHash", "signedBy", "signedAt",
          severity, "createdAt", "updatedAt", "archivedAt"
        )
        SELECT
          id, "userId", action, entity, "entityId", description, metadata,
          "chainIndex", "prevHash", "currentHash", "dataHash", "signedBy", "signedAt",
          severity::text::enum_audit_logs_archive_severity, "createdAt", "updatedAt", NOW()
        FROM moved_rows
        ON CONFLICT ("sourceAuditId") DO NOTHING
        RETURNING "sourceAuditId"
      )
      DELETE FROM audit_logs a
      USING inserted i
      WHERE a.id = i."sourceAuditId"
      RETURNING a.id;
      `,
      {
        replacements: { cutoffDate, batchSize },
        transaction,
      }
    );

    await transaction.commit();

    return Array.isArray(result) ? result.length : 0;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

async function runAuditRetentionCycle() {
  if (!isEnabled()) {
    return { enabled: false, archivedCount: 0 };
  }

  const cutoffDate = getRetentionCutoffDate();
  const batchSize = envNumber("AUDIT_RETENTION_BATCH_SIZE", DEFAULT_BATCH_SIZE);
  const maxBatches = envNumber("AUDIT_RETENTION_MAX_BATCHES", 10);

  let archivedCount = 0;

  for (let i = 0; i < maxBatches; i += 1) {
    const moved = await archiveBatch(cutoffDate, batchSize);
    archivedCount += moved;

    if (moved < batchSize) {
      break;
    }
  }

  return {
    enabled: true,
    archivedCount,
    cutoffDate: cutoffDate.toISOString(),
  };
}

function startAuditRetentionScheduler() {
  if (!isEnabled()) {
    console.log("[AuditRetention] disabled by AUDIT_RETENTION_ENABLED");
    return null;
  }

  const intervalMs = envNumber("AUDIT_RETENTION_INTERVAL_MS", DEFAULT_INTERVAL_MS);

  const runSafely = async () => {
    try {
      const result = await runAuditRetentionCycle();
      console.log(
        `[AuditRetention] done: archived=${result.archivedCount}, cutoff=${result.cutoffDate}`
      );
    } catch (error) {
      console.error("[AuditRetention] failed:", error.message);
    }
  };

  runSafely();
  const timer = setInterval(runSafely, intervalMs);

  if (typeof timer.unref === "function") {
    timer.unref();
  }

  return timer;
}

module.exports = {
  runAuditRetentionCycle,
  startAuditRetentionScheduler,
  getRetentionCutoffDate,
};
