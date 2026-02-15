import Fastify from 'fastify';
import cors from '@fastify/cors';
import fjwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import { ZodError } from 'zod';
import { getConfig } from './config';
import { logger } from './utils/logger';

// Route imports
import { authRoutes } from './routes/auth';
import { portalRoutes } from './routes/portal';
import { orgsRoutes } from './routes/orgs';
import { instancesRoutes } from './routes/instances';
import { licensesRoutes } from './routes/licenses';
import { heartbeatRoutes } from './routes/heartbeat';
import { subscriptionsRoutes } from './routes/subscriptions';
import { paymentsRoutes } from './routes/payments';
import { telemetryRoutes } from './routes/telemetry';
import { dashboardRoutes } from './routes/dashboard';
import { settingsRoutes } from './routes/settings';

// Worker imports
import { startBillingCron } from './workers/billingCron';
import { startAlertCron } from './workers/alertCron';
import { startCleanupCron } from './workers/cleanupCron';

async function main() {
  const config = getConfig();

  const app = Fastify({
    logger: {
      level: config.NODE_ENV === 'production' ? 'info' : 'debug',
      transport: config.NODE_ENV !== 'production'
        ? { target: 'pino-pretty', options: { colorize: true } }
        : undefined,
    },
  });

  // Register CORS
  const corsOrigins = config.CORS_ORIGINS
    ? config.CORS_ORIGINS.split(',').map((s: string) => s.trim())
    : undefined;
  await app.register(cors, {
    origin: corsOrigins || (config.NODE_ENV === 'production'
      ? ['https://manage.asvo.tech', 'https://my.asvo.tech']
      : true),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Register JWT
  await app.register(fjwt, {
    secret: config.JWT_SECRET,
  });

  // Register rate limiting (100 requests per minute)
  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
    keyGenerator: (request) => request.ip,
  });

  // Zod validation error handler
  app.setErrorHandler((error, request, reply) => {
    if (error instanceof ZodError) {
      return reply.status(400).send({
        error: 'Validation error',
        details: error.errors.map((e) => ({
          path: e.path.join('.'),
          message: e.message,
        })),
      });
    }

    // Fastify rate limit error
    if (error.statusCode === 429) {
      return reply.status(429).send({
        error: 'Too many requests',
        message: 'Rate limit exceeded. Try again later.',
      });
    }

    // Generic error handler
    logger.error({ err: error, url: request.url, method: request.method }, 'Unhandled error');
    return reply.status(error.statusCode || 500).send({
      error: error.message || 'Internal Server Error',
    });
  });

  // Register routes
  await app.register(authRoutes);
  await app.register(portalRoutes);
  await app.register(orgsRoutes);
  await app.register(instancesRoutes);
  await app.register(licensesRoutes);
  await app.register(heartbeatRoutes);
  await app.register(subscriptionsRoutes);
  await app.register(paymentsRoutes);
  await app.register(telemetryRoutes);
  await app.register(dashboardRoutes);
  await app.register(settingsRoutes);

  // Health check
  app.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // Start cron workers
  startBillingCron();
  startAlertCron();
  startCleanupCron();

  // Start server
  try {
    const address = await app.listen({ port: config.PORT, host: '0.0.0.0' });
    logger.info(`ASVO License Service started on ${address}`);
    logger.info(`Environment: ${config.NODE_ENV}`);
  } catch (err) {
    logger.fatal({ err }, 'Failed to start server');
    process.exit(1);
  }
}

main();
