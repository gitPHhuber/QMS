import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { bearerAuth } from '../middleware/auth';
import { createAuditLog } from '../middleware/audit';
import { z } from 'zod';

const prisma = new PrismaClient();

const updateSettingsSchema = z.record(z.string(), z.string());

export async function settingsRoutes(app: FastifyInstance) {
  app.addHook('onRequest', bearerAuth);

  // GET /api/v1/settings — all settings
  app.get('/api/v1/settings', async () => {
    const settings = await prisma.setting.findMany();
    const grouped: Record<string, Record<string, string>> = {};

    for (const s of settings) {
      const [section, ...rest] = s.key.split('.');
      const fieldKey = rest.join('.');
      if (!grouped[section]) grouped[section] = {};
      grouped[section][fieldKey] = s.value;
    }

    return grouped;
  });

  // PUT /api/v1/settings — upsert settings
  app.put('/api/v1/settings', async (request, reply) => {
    const body = updateSettingsSchema.parse(request.body);

    const results: Array<{ key: string; value: string }> = [];
    for (const [key, value] of Object.entries(body)) {
      const setting = await prisma.setting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      });
      results.push({ key: setting.key, value: setting.value });
    }

    await createAuditLog({
      actor: (request as any).actor,
      action: 'update',
      entityType: 'settings',
      entityId: 'bulk',
      ipAddress: request.ip,
      changes: body,
    });

    return { updated: results.length, settings: results };
  });
}
