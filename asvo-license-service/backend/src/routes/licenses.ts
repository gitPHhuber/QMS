import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { bearerAuth } from '../middleware/auth';
import { createAuditLog } from '../middleware/audit';
import { LicenseGenerator } from '../services/LicenseGenerator';
import { TierName } from '../config';
import { z } from 'zod';

const prisma = new PrismaClient();

const createLicenseSchema = z.object({
  organizationId: z.string().uuid(),
  instanceId: z.string().uuid().optional(),
  tier: z.enum(['start', 'standard', 'pro', 'industry', 'corp']),
  modules: z.array(z.string()).optional(),
  maxUsers: z.number().int().positive().optional(),
  maxStorageGb: z.number().int().positive().optional(),
  durationDays: z.number().int().positive(),
  fingerprint: z.string().optional(),
  graceDays: z.number().int().positive().optional(),
});

export async function licensesRoutes(app: FastifyInstance) {
  app.addHook('onRequest', bearerAuth);

  // POST /api/v1/licenses
  app.post('/api/v1/licenses', async (request, reply) => {
    const body = createLicenseSchema.parse(request.body);

    const { license, licenseKey } = await LicenseGenerator.create({
      organizationId: body.organizationId,
      instanceId: body.instanceId,
      tier: body.tier as TierName,
      modules: body.modules,
      maxUsers: body.maxUsers,
      maxStorageGb: body.maxStorageGb,
      durationDays: body.durationDays,
      fingerprint: body.fingerprint,
      graceDays: body.graceDays,
    });

    await createAuditLog({
      actor: (request as any).actor,
      action: 'create',
      entityType: 'license',
      entityId: license.id,
      organizationId: body.organizationId,
      ipAddress: request.ip,
    });

    return reply.status(201).send({ license, licenseKey });
  });

  // GET /api/v1/licenses/:id
  app.get('/api/v1/licenses/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const license = await prisma.license.findUnique({
      where: { id },
      include: { organization: true, instance: true },
    });
    if (!license) return reply.status(404).send({ error: 'License not found' });
    return license;
  });

  // POST /api/v1/licenses/:id/revoke
  app.post('/api/v1/licenses/:id/revoke', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { reason } = (request.body as any) || {};

    const license = await LicenseGenerator.revoke(id, reason || 'Revoked by admin');

    await createAuditLog({
      actor: (request as any).actor,
      action: 'revoke',
      entityType: 'license',
      entityId: id,
      organizationId: license.organizationId,
      changes: { reason },
      ipAddress: request.ip,
    });

    return license;
  });

  // POST /api/v1/licenses/:id/renew
  app.post('/api/v1/licenses/:id/renew', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { durationDays = 30 } = (request.body as any) || {};

    const license = await LicenseGenerator.renew(id, durationDays);

    await createAuditLog({
      actor: (request as any).actor,
      action: 'renew',
      entityType: 'license',
      entityId: id,
      organizationId: license.organizationId,
      changes: { durationDays },
      ipAddress: request.ip,
    });

    return license;
  });
}
