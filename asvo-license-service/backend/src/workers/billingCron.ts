import cron from 'node-cron';
import { BillingService } from '../services/BillingService';
import { logger } from '../utils/logger';

export function startBillingCron() {
  // Run daily at 06:00 UTC
  cron.schedule('0 6 * * *', async () => {
    const startTime = Date.now();
    logger.info('Billing cron started: processing subscriptions');

    try {
      await BillingService.processSubscriptions();
      const duration = Date.now() - startTime;
      logger.info({ durationMs: duration }, 'Billing cron completed successfully');
    } catch (err) {
      const duration = Date.now() - startTime;
      logger.error({ err, durationMs: duration }, 'Billing cron failed');
    }
  }, {
    timezone: 'UTC',
  });

  logger.info('Billing cron scheduled: daily at 06:00 UTC');
}
