import { FastifyInstance } from 'fastify';
import { PrismaClient, Tier, OrgStatus } from '@prisma/client';
import { bearerAuth } from '../middleware/auth';
import { createAuditLog } from '../middleware/audit';
import { z } from 'zod';

const prisma = new PrismaClient();

const createOrgSchema = z.object({
  name: z.string().min(1),
  inn: z.string().min(10).max(12),
  contactEmail: z.string().email(),
  contactPhone: z.string().optional(),
  contactName: z.string().min(1),
  address: z.string().optional(),
  tier: z.enum(['start', 'standard', 'pro', 'industry', 'corp']).default('start'),
  notes: z.string().optional(),
});

const updateOrgSchema = z.object({
  name: z.string().min(1).optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  contactName: z.string().min(1).optional(),
  address: z.string().optional(),
  tier: z.enum(['start', 'standard', 'pro', 'industry', 'corp']).optional(),
  status: z.enum(['active', 'suspended', 'trial', 'churned']).optional(),
  notes: z.string().optional(),
});

export async function orgsRoutes(app: FastifyInstance) {
  app.addHook('onRequest', bearerAuth);

  // GET /api/v1/orgs
  app.get('/api/v1/orgs', async (request, reply) => {
    const { search, tier, status, page = '1', limit = '20' } = request.query as any;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { inn: { contains: search } },
      ];
    }
    if (tier) where.tier = tier;
    if (status) where.status = status;

    const [orgs, total] = await Promise.all([
      prisma.organization.findMany({
        where,
        include: {
          _count: { select: { instances: true } },
          subscription: true,
        },
        orderBy: { createdAt: 'desc' },
        take: limitNum,
        skip,
      }),
      prisma.organization.count({ where }),
    ]);

    return {
      data: orgs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    };
  });

  // POST /api/v1/orgs
  app.post('/api/v1/orgs', async (request, reply) => {
    const body = createOrgSchema.parse(request.body);

    const org = await prisma.organization.create({
      data: {
        name: body.name,
        inn: body.inn,
        contactEmail: body.contactEmail,
        contactPhone: body.contactPhone,
        contactName: body.contactName,
        address: body.address,
        tier: body.tier as Tier,
        notes: body.notes,
      },
    });

    await createAuditLog({
      actor: (request as any).actor,
      action: 'create',
      entityType: 'organization',
      entityId: org.id,
      organizationId: org.id,
      ipAddress: request.ip,
    });

    return reply.status(201).send(org);
  });

  // GET /api/v1/orgs/:id
  app.get('/api/v1/orgs/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const org = await prisma.organization.findUnique({
      where: { id },
      include: {
        instances: true,
        licenses: { orderBy: { createdAt: 'desc' } },
        subscription: { include: { payments: { orderBy: { createdAt: 'desc' }, take: 20 } } },
        auditLogs: { orderBy: { createdAt: 'desc' }, take: 50 },
      },
    });

    if (!org) return reply.status(404).send({ error: 'Organization not found' });
    return org;
  });

  // PATCH /api/v1/orgs/:id
  app.patch('/api/v1/orgs/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = updateOrgSchema.parse(request.body);

    const org = await prisma.organization.update({
      where: { id },
      data: {
        ...body,
        tier: body.tier as Tier | undefined,
        status: body.status as OrgStatus | undefined,
      },
    });

    await createAuditLog({
      actor: (request as any).actor,
      action: 'update',
      entityType: 'organization',
      entityId: org.id,
      organizationId: org.id,
      changes: body,
      ipAddress: request.ip,
    });

    return org;
  });
}
