import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export function startCleanupCron() {
  // Run daily at 03:00 UTC
  cron.schedule('0 3 * * *', async () => {
    const startTime = Date.now();
    logger.info('Cleanup cron started: removing old telemetry and audit logs');

    try {
      // Delete telemetry_events older than 90 days
      const telemetryCutoff = new Date(Date.now() - 90 * 24 * 3600 * 1000);
      const telemetryResult = await prisma.$executeRaw`
        DELETE FROM telemetry_events
        WHERE created_at < ${telemetryCutoff}
      `;
      logger.info({ deletedRows: telemetryResult }, 'Old telemetry events deleted (>90 days)');

      // Delete audit_logs older than 3 years
      const auditCutoff = new Date(Date.now() - 3 * 365 * 24 * 3600 * 1000);
      const auditResult = await prisma.$executeRaw`
        DELETE FROM audit_logs
        WHERE created_at < ${auditCutoff}
      `;
      logger.info({ deletedRows: auditResult }, 'Old audit logs deleted (>3 years)');

      const duration = Date.now() - startTime;
      logger.info(
        { durationMs: duration, telemetryDeleted: telemetryResult, auditDeleted: auditResult },
        'Cleanup cron completed successfully',
      );
    } catch (err) {
      const duration = Date.now() - startTime;
      logger.error({ err, durationMs: duration }, 'Cleanup cron failed');
    }
  }, {
    timezone: 'UTC',
  });

  logger.info('Cleanup cron scheduled: daily at 03:00 UTC');
}
