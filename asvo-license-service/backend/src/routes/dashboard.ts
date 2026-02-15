import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { bearerAuth } from '../middleware/auth';
import { AlertService } from '../services/AlertService';

const prisma = new PrismaClient();

export async function dashboardRoutes(app: FastifyInstance) {
  app.addHook('onRequest', bearerAuth);

  // GET /api/v1/dashboard/stats
  app.get('/api/v1/dashboard/stats', async () => {
    const [
      totalOrgs,
      activeOrgs,
      totalInstances,
      onlineInstances,
      totalLicenses,
      activeSubs,
      tierCounts,
      recentPayments,
    ] = await Promise.all([
      prisma.organization.count(),
      prisma.organization.count({ where: { status: { in: ['active', 'trial'] } } }),
      prisma.instance.count(),
      prisma.instance.count({ where: { status: 'online' } }),
      prisma.license.count({ where: { isRevoked: false } }),
      prisma.subscription.count({ where: { status: { in: ['active', 'trialing'] } } }),
      prisma.subscription.groupBy({
        by: ['tier'],
        _count: true,
        where: { status: { in: ['active', 'trialing'] } },
      }),
      prisma.payment.findMany({
        where: { status: 'succeeded' },
        orderBy: { createdAt: 'desc' },
        take: 30,
      }),
    ]);

    // Calculate MRR from active subscriptions
    const activeSources = await prisma.subscription.findMany({
      where: { status: { in: ['active', 'trialing'] } },
      select: { priceRub: true, billingCycle: true },
    });

    const mrr = activeSources.reduce((sum, sub) => {
      if (sub.billingCycle === 'monthly') return sum + sub.priceRub;
      if (sub.billingCycle === 'quarterly') return sum + Math.round(sub.priceRub / 3);
      return sum + Math.round(sub.priceRub / 12);
    }, 0);

    const arr = mrr * 12;

    // Get alerts
    const alerts = await AlertService.getActiveAlerts();

    return {
      mrr,
      arr,
      totalOrgs,
      activeOrgs,
      totalInstances,
      onlineInstances,
      totalLicenses,
      activeSubs,
      tierDistribution: tierCounts.map((t) => ({ tier: t.tier, count: t._count })),
      recentPayments: recentPayments.slice(0, 10),
      alerts: alerts.slice(0, 20),
    };
  });
}
