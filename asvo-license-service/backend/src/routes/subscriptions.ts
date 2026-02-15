import { FastifyInstance } from 'fastify';
import { PrismaClient, Tier, BillingCycle, SubscriptionStatus } from '@prisma/client';
import { bearerAuth } from '../middleware/auth';
import { createAuditLog } from '../middleware/audit';
import { getTierPrice, TierName } from '../config';
import { z } from 'zod';

const prisma = new PrismaClient();

const createSubSchema = z.object({
  organizationId: z.string().uuid(),
  tier: z.enum(['start', 'standard', 'pro', 'industry', 'corp']),
  billingCycle: z.enum(['monthly', 'quarterly', 'annual']).default('monthly'),
});

const updateSubSchema = z.object({
  tier: z.enum(['start', 'standard', 'pro', 'industry', 'corp']).optional(),
  billingCycle: z.enum(['monthly', 'quarterly', 'annual']).optional(),
  cancelAtPeriodEnd: z.boolean().optional(),
});

export async function subscriptionsRoutes(app: FastifyInstance) {
  app.addHook('onRequest', bearerAuth);

  // POST /api/v1/subscriptions
  app.post('/api/v1/subscriptions', async (request, reply) => {
    const body = createSubSchema.parse(request.body);
    const price = getTierPrice(body.tier as TierName, body.billingCycle as 'monthly' | 'quarterly' | 'annual');

    const now = new Date();
    const cycleDays = body.billingCycle === 'monthly' ? 30
      : body.billingCycle === 'quarterly' ? 90 : 365;

    const sub = await prisma.subscription.create({
      data: {
        organizationId: body.organizationId,
        tier: body.tier as Tier,
        billingCycle: body.billingCycle as BillingCycle,
        priceRub: price,
        status: SubscriptionStatus.active,
        currentPeriodStart: now,
        currentPeriodEnd: new Date(now.getTime() + cycleDays * 86400000),
      },
    });

    await createAuditLog({
      actor: (request as any).actor,
      action: 'create',
      entityType: 'subscription',
      entityId: sub.id,
      organizationId: body.organizationId,
      ipAddress: request.ip,
    });

    return reply.status(201).send(sub);
  });

  // PATCH /api/v1/subscriptions/:id
  app.patch('/api/v1/subscriptions/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = updateSubSchema.parse(request.body);

    const data: any = {};
    if (body.cancelAtPeriodEnd !== undefined) data.cancelAtPeriodEnd = body.cancelAtPeriodEnd;
    if (body.tier) {
      data.tier = body.tier as Tier;
      const cycle = body.billingCycle || 'monthly';
      data.priceRub = getTierPrice(body.tier as TierName, cycle as any);
    }
    if (body.billingCycle) {
      data.billingCycle = body.billingCycle as BillingCycle;
      const sub = await prisma.subscription.findUnique({ where: { id } });
      if (sub) {
        data.priceRub = getTierPrice((body.tier || sub.tier) as TierName, body.billingCycle as any);
      }
    }

    const sub = await prisma.subscription.update({ where: { id }, data });

    await createAuditLog({
      actor: (request as any).actor,
      action: 'update',
      entityType: 'subscription',
      entityId: id,
      organizationId: sub.organizationId,
      changes: body,
      ipAddress: request.ip,
    });

    return sub;
  });
}
