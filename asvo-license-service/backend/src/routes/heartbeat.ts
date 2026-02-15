import { FastifyInstance } from 'fastify';
import { apiKeyAuth } from '../middleware/auth';
import { HeartbeatService } from '../services/HeartbeatService';
import { z } from 'zod';

const heartbeatSchema = z.object({
  fingerprint: z.string(),
  version: z.string(),
  modules_active: z.array(z.string()),
  users_count: z.number().int().nonnegative(),
  storage_used_gb: z.number().nonnegative(),
  os: z.string(),
  uptime_hours: z.number().nonnegative(),
  errors_24h: z.number().int().nonnegative(),
});

export async function heartbeatRoutes(app: FastifyInstance) {
  // POST /api/v1/heartbeat
  app.post('/api/v1/heartbeat', {
    preHandler: apiKeyAuth,
  }, async (request, reply) => {
    const body = heartbeatSchema.parse(request.body);
    const instance = (request as any).instance;

    const result = await HeartbeatService.process(instance.id, body, request.ip);
    return result;
  });
}
