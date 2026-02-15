import { FastifyInstance } from 'fastify';
import { TelemetryEventType } from '@prisma/client';
import { bearerAuth } from '../middleware/auth';
import { TelemetryService } from '../services/TelemetryService';

export async function telemetryRoutes(app: FastifyInstance) {
  app.addHook('onRequest', bearerAuth);

  // GET /api/v1/telemetry/:instanceId
  app.get('/api/v1/telemetry/:instanceId', async (request) => {
    const { instanceId } = request.params as { instanceId: string };
    const { eventType, from, to, limit = '100', offset = '0' } = request.query as any;

    return TelemetryService.getEvents(instanceId, {
      eventType: eventType as TelemetryEventType | undefined,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
  });

  // GET /api/v1/telemetry/:instanceId/stats
  app.get('/api/v1/telemetry/:instanceId/stats', async (request) => {
    const { instanceId } = request.params as { instanceId: string };
    const { days = '30' } = request.query as any;
    return TelemetryService.getAggregatedStats(instanceId, parseInt(days));
  });
}
