import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { bearerAuth } from '../middleware/auth';
import { YukassaService } from '../services/YukassaService';
import { BillingService } from '../services/BillingService';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export async function paymentsRoutes(app: FastifyInstance) {
  // Webhook — public but signature-verified
  app.post('/api/v1/payments/yukassa-webhook', async (request, reply) => {
    const body = request.body as any;
    const rawBody = JSON.stringify(body);

    if (!YukassaService.verifyWebhookSignature(rawBody, '')) {
      return reply.status(403).send({ error: 'Invalid signature' });
    }

    const event = body.event;
    const paymentData = body.object;

    if (event === 'payment.succeeded') {
      const metadata = paymentData.metadata || {};
      const subscriptionId = metadata.subscription_id;

      if (subscriptionId) {
        const payment = await prisma.payment.findFirst({
          where: { yukassaPaymentId: paymentData.id },
        });

        if (payment) {
          await prisma.payment.update({
            where: { id: payment.id },
            data: { status: 'succeeded', paidAt: new Date() },
          });
        }

        const sub = await prisma.subscription.findUnique({
          where: { id: subscriptionId },
          include: { organization: true },
        });

        if (sub) {
          await BillingService.handlePaymentSuccess(sub);
        }
      }

      // Save payment method if present
      if (paymentData.payment_method?.saved && metadata.subscription_id) {
        await prisma.subscription.update({
          where: { id: metadata.subscription_id },
          data: { paymentMethodId: paymentData.payment_method.id },
        });
      }
    }

    if (event === 'payment.canceled') {
      const payment = await prisma.payment.findFirst({
        where: { yukassaPaymentId: paymentData.id },
      });
      if (payment) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: 'failed' },
        });
      }
    }

    return { status: 'ok' };
  });

  // Admin: view payments
  app.get('/api/v1/payments', {
    preHandler: bearerAuth,
  }, async (request) => {
    const { subscriptionId, organizationId, status, page = '1', limit = '20' } = request.query as any;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    const where: any = {};
    if (subscriptionId) where.subscriptionId = subscriptionId;
    if (organizationId) where.organizationId = organizationId;
    if (status) where.status = status;

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limitNum,
        skip: (pageNum - 1) * limitNum,
        include: { subscription: { include: { organization: { select: { name: true } } } } },
      }),
      prisma.payment.count({ where }),
    ]);

    return { data: payments, pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) } };
  });
}
