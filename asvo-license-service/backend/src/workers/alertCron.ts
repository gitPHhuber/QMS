import cron from 'node-cron';
import { AlertService } from '../services/AlertService';
import { logger } from '../utils/logger';

export function startAlertCron() {
  // Run every hour at minute 0
  cron.schedule('0 * * * *', async () => {
    const startTime = Date.now();
    logger.info('Alert cron started: checking for active alerts');

    try {
      const alerts = await AlertService.getActiveAlerts();
      logger.info({ alertCount: alerts.length }, 'Active alerts collected');

      if (alerts.length > 0) {
        await AlertService.sendAdminAlerts(alerts);
        logger.info({ alertCount: alerts.length }, 'Admin alerts sent');
      }

      const duration = Date.now() - startTime;
      logger.info({ durationMs: duration, alertCount: alerts.length }, 'Alert cron completed successfully');
    } catch (err) {
      const duration = Date.now() - startTime;
      logger.error({ err, durationMs: duration }, 'Alert cron failed');
    }
  }, {
    timezone: 'UTC',
  });

  logger.info('Alert cron scheduled: every hour');
}
