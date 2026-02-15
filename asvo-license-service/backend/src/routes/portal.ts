import { FastifyInstance } from 'fastify';
import { PrismaClient, Tier, BillingCycle } from '@prisma/client';
import { z } from 'zod';
import { portalAuth } from '../middleware/auth';
import { createAuditLog } from '../middleware/audit';
import { LicenseGenerator } from '../services/LicenseGenerator';
import { getTierPrice, TierName } from '../config';
import { logger } from '../utils/logger';
import { sendEmail, sendTelegramAlert } from '../utils/email';

const prisma = new PrismaClient();

const updateSubscriptionSchema = z.object({
  tier: z.enum(['start', 'standard', 'pro', 'industry', 'corp']).optional(),
  billingCycle: z.enum(['monthly', 'quarterly', 'annual']).optional(),
  cancelAtPeriodEnd: z.boolean().optional(),
});

const reissueLicenseSchema = z.object({
  licenseId: z.string().uuid(),
  newFingerprint: z.string().min(1),
  reason: z.string().min(1).optional(),
});

const supportRequestSchema = z.object({
  subject: z.string().min(1).max(200),
  message: z.string().min(1).max(5000),
});

export async function portalRoutes(app: FastifyInstance) {
  app.addHook('onRequest', portalAuth);

  // GET /api/v1/portal/subscription — get org's current subscription
  app.get('/api/v1/portal/subscription', async (request, reply) => {
    const orgId = (request as any).orgId;

    const subscription = await prisma.subscription.findUnique({
      where: { organizationId: orgId },
      include: {
        organization: {
          select: { name: true, tier: true, status: true, trialEndsAt: true },
        },
      },
    });

    if (!subscription) {
      return reply.status(404).send({ error: 'Subscription not found' });
    }

    return subscription;
  });

  // PATCH /api/v1/portal/subscription — change tier or cancel auto-renewal
  app.patch('/api/v1/portal/subscription', async (request, reply) => {
    const orgId = (request as any).orgId;
    const body = updateSubscriptionSchema.parse(request.body);

    const subscription = await prisma.subscription.findUnique({
      where: { organizationId: orgId },
    });

    if (!subscription) {
      return reply.status(404).send({ error: 'Subscription not found' });
    }

    const data: any = {};

    if (body.cancelAtPeriodEnd !== undefined) {
      data.cancelAtPeriodEnd = body.cancelAtPeriodEnd;
    }

    if (body.tier) {
      data.tier = body.tier as Tier;
      const cycle = body.billingCycle || subscription.billingCycle;
      data.priceRub = getTierPrice(body.tier as TierName, cycle as 'monthly' | 'quarterly' | 'annual');
    }

    if (body.billingCycle) {
      data.billingCycle = body.billingCycle as BillingCycle;
      const tier = body.tier || subscription.tier;
      data.priceRub = getTierPrice(tier as TierName, body.billingCycle as 'monthly' | 'quarterly' | 'annual');
    }

    const updated = await prisma.subscription.update({
      where: { organizationId: orgId },
      data,
    });

    // If tier changed, also update the organization tier
    if (body.tier) {
      await prisma.organization.update({
        where: { id: orgId },
        data: { tier: body.tier as Tier },
      });
    }

    await createAuditLog({
      actor: (request as any).actor,
      action: 'update',
      entityType: 'subscription',
      entityId: updated.id,
      organizationId: orgId,
      changes: body,
      ipAddress: request.ip,
    });

    logger.info({ orgId, changes: body }, 'Portal subscription updated');

    return updated;
  });

  // GET /api/v1/portal/payments — payment history for org
  app.get('/api/v1/portal/payments', async (request, reply) => {
    const orgId = (request as any).orgId;
    const { page = '1', limit = '20' } = request.query as any;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where: { organizationId: orgId },
        orderBy: { createdAt: 'desc' },
        take: limitNum,
        skip,
        include: {
          subscription: {
            select: { tier: true, billingCycle: true },
          },
        },
      }),
      prisma.payment.count({ where: { organizationId: orgId } }),
    ]);

    return {
      data: payments,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    };
  });

  // GET /api/v1/portal/instances — org's instances
  app.get('/api/v1/portal/instances', async (request, reply) => {
    const orgId = (request as any).orgId;

    const instances = await prisma.instance.findMany({
      where: { organizationId: orgId },
      orderBy: { lastHeartbeatAt: 'desc' },
      select: {
        id: true,
        name: true,
        version: true,
        status: true,
        lastHeartbeatAt: true,
        lastIp: true,
        modulesActive: true,
        createdAt: true,
      },
    });

    return { data: instances };
  });

  // GET /api/v1/portal/licenses — org's licenses
  app.get('/api/v1/portal/licenses', async (request, reply) => {
    const orgId = (request as any).orgId;

    const licenses = await prisma.license.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        tier: true,
        modules: true,
        maxUsers: true,
        maxStorageGb: true,
        validFrom: true,
        validUntil: true,
        isRevoked: true,
        revokedAt: true,
        revokeReason: true,
        createdAt: true,
        instance: {
          select: { id: true, name: true },
        },
      },
    });

    return { data: licenses };
  });

  // POST /api/v1/portal/licenses/reissue — reissue license for hardware change
  app.post('/api/v1/portal/licenses/reissue', async (request, reply) => {
    const orgId = (request as any).orgId;
    const body = reissueLicenseSchema.parse(request.body);

    // Verify the license belongs to this org
    const existingLicense = await prisma.license.findFirst({
      where: {
        id: body.licenseId,
        organizationId: orgId,
        isRevoked: false,
      },
      include: { organization: true },
    });

    if (!existingLicense) {
      return reply.status(404).send({ error: 'Active license not found for this organization' });
    }

    // Calculate remaining days
    const now = new Date();
    const remainingMs = existingLicense.validUntil.getTime() - now.getTime();
    const remainingDays = Math.max(1, Math.ceil(remainingMs / 86400000));

    // Revoke old license
    await LicenseGenerator.revoke(
      existingLicense.id,
      body.reason || 'Reissued for hardware change',
    );

    // Create new license with the same parameters and remaining duration
    const { license: newLicense, licenseKey } = await LicenseGenerator.create({
      organizationId: orgId,
      instanceId: existingLicense.instanceId || undefined,
      tier: existingLicense.tier as TierName,
      modules: existingLicense.modules,
      maxUsers: existingLicense.maxUsers,
      maxStorageGb: existingLicense.maxStorageGb,
      durationDays: remainingDays,
      fingerprint: body.newFingerprint,
    });

    await createAuditLog({
      actor: (request as any).actor,
      action: 'reissue',
      entityType: 'license',
      entityId: newLicense.id,
      organizationId: orgId,
      changes: {
        oldLicenseId: existingLicense.id,
        newFingerprint: body.newFingerprint,
        reason: body.reason || 'Hardware change',
      },
      ipAddress: request.ip,
    });

    logger.info(
      { orgId, oldLicenseId: existingLicense.id, newLicenseId: newLicense.id },
      'License reissued via portal',
    );

    return reply.status(201).send({
      license: newLicense,
      licenseKey,
      revokedLicenseId: existingLicense.id,
    });
  });

  // POST /api/v1/portal/support — create a support request
  app.post('/api/v1/portal/support', async (request, reply) => {
    const orgId = (request as any).orgId;
    const actor = (request as any).actor;
    const body = supportRequestSchema.parse(request.body);

    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { name: true, contactEmail: true },
    });

    const orgName = org?.name || 'Unknown';
    const contactEmail = org?.contactEmail || 'unknown';

    // Notify admin team via email
    await sendEmail(
      'admin@asvo.tech',
      `Обращение в поддержку: ${body.subject}`,
      'support-request',
      {
        orgName,
        contactEmail,
        subject: body.subject,
        message: body.message,
      },
    );

    // Telegram alert
    await sendTelegramAlert(
      `📩 Обращение в поддержку\nОрганизация: ${orgName}\nТема: ${body.subject}`,
    );

    // Audit log
    await createAuditLog({
      actor,
      action: 'create',
      entityType: 'support_request',
      entityId: 'support',
      organizationId: orgId,
      changes: { subject: body.subject },
      ipAddress: request.ip,
    });

    logger.info({ orgId, subject: body.subject }, 'Support request submitted via portal');

    return { success: true, message: 'Обращение создано. Мы ответим в течение 24 часов.' };
  });
}
