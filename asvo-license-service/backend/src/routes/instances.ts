import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { bearerAuth } from '../middleware/auth';
import { createAuditLog } from '../middleware/audit';
import { z } from 'zod';

const prisma = new PrismaClient();

const createInstanceSchema = z.object({
  name: z.string().min(1),
  fingerprint: z.string().min(1),
});

export async function instancesRoutes(app: FastifyInstance) {
  app.addHook('onRequest', bearerAuth);

  // GET /api/v1/orgs/:id/instances
  app.get('/api/v1/orgs/:id/instances', async (request) => {
    const { id } = request.params as { id: string };
    return prisma.instance.findMany({
      where: { organizationId: id },
      orderBy: { lastHeartbeatAt: 'desc' },
    });
  });

  // POST /api/v1/orgs/:id/instances
  app.post('/api/v1/orgs/:id/instances', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = createInstanceSchema.parse(request.body);

    const org = await prisma.organization.findUnique({ where: { id } });
    if (!org) return reply.status(404).send({ error: 'Organization not found' });

    const apiKey = `inst_${uuidv4().replace(/-/g, '')}`;

    const instance = await prisma.instance.create({
      data: {
        organizationId: id,
        name: body.name,
        fingerprint: body.fingerprint,
        apiKey,
      },
    });

    await createAuditLog({
      actor: (request as any).actor,
      action: 'create',
      entityType: 'instance',
      entityId: instance.id,
      organizationId: id,
      ipAddress: request.ip,
    });

    return reply.status(201).send({ ...instance, apiKey });
  });

  // DELETE /api/v1/instances/:id
  app.delete('/api/v1/instances/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const instance = await prisma.instance.findUnique({ where: { id } });
    if (!instance) return reply.status(404).send({ error: 'Instance not found' });

    await prisma.instance.update({
      where: { id },
      data: { status: 'offline' },
    });

    await createAuditLog({
      actor: (request as any).actor,
      action: 'deactivate',
      entityType: 'instance',
      entityId: id,
      organizationId: instance.organizationId,
      ipAddress: request.ip,
    });

    return { success: true };
  });

  // GET /api/v1/instances — all instances across orgs
  app.get('/api/v1/instances', async (request) => {
    const { page = '1', limit = '50', status } = request.query as any;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (status) where.status = status;

    const [instances, total] = await Promise.all([
      prisma.instance.findMany({
        where,
        include: { organization: { select: { name: true, tier: true } } },
        orderBy: { lastHeartbeatAt: 'asc' },
        take: limitNum,
        skip,
      }),
      prisma.instance.count({ where }),
    ]);

    return {
      data: instances,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
    };
  });
}
