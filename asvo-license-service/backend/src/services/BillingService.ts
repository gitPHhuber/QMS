import { PrismaClient, PaymentStatus, SubscriptionStatus } from '@prisma/client';
import { YukassaService } from './YukassaService';
import { LicenseGenerator } from './LicenseGenerator';
import { NotificationService } from './NotificationService';
import { getTierPrice, TierName } from '../config';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export class BillingService {
  static async processSubscriptions() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Subscriptions ending today — attempt payment
    const dueSubs = await prisma.subscription.findMany({
      where: {
        currentPeriodEnd: { lte: today },
        status: { in: ['active', 'past_due'] },
        cancelAtPeriodEnd: false,
      },
      include: { organization: true },
    });

    for (const sub of dueSubs) {
      await this.processPayment(sub);
    }

    // Warn 7 days before
    const sevenDays = new Date(today.getTime() + 7 * 86400000);
    const warningSubs7 = await prisma.subscription.findMany({
      where: {
        currentPeriodEnd: {
          gte: new Date(sevenDays.getTime() - 86400000),
          lte: sevenDays,
        },
        status: 'active',
        cancelAtPeriodEnd: false,
      },
      include: { organization: true },
    });

    for (const sub of warningSubs7) {
      await NotificationService.sendLicenseExpiring(
        sub.organization.contactEmail,
        sub.organization.name,
        sub.currentPeriodEnd.toISOString().split('T')[0],
        7,
      );
    }

    // Warn 3 days before
    const threeDays = new Date(today.getTime() + 3 * 86400000);
    const warningSubs3 = await prisma.subscription.findMany({
      where: {
        currentPeriodEnd: {
          gte: new Date(threeDays.getTime() - 86400000),
          lte: threeDays,
        },
        status: 'active',
        cancelAtPeriodEnd: false,
      },
      include: { organization: true },
    });

    for (const sub of warningSubs3) {
      await NotificationService.sendLicenseExpiring(
        sub.organization.contactEmail,
        sub.organization.name,
        sub.currentPeriodEnd.toISOString().split('T')[0],
        3,
      );
    }
  }

  static async processPayment(sub: any) {
    const amount = getTierPrice(sub.tier as TierName, sub.billingCycle);

    // Count failed attempts for this period
    const failedCount = await prisma.payment.count({
      where: {
        subscriptionId: sub.id,
        status: 'failed',
        createdAt: { gte: sub.currentPeriodStart },
      },
    });

    try {
      const yukassaPayment = await YukassaService.createPayment({
        amount,
        description: `Подписка ${sub.tier} — ${sub.organization.name}`,
        paymentMethodId: sub.paymentMethodId || undefined,
        metadata: {
          subscription_id: sub.id,
          organization_id: sub.organizationId,
        },
      });

      const payment = await prisma.payment.create({
        data: {
          subscriptionId: sub.id,
          organizationId: sub.organizationId,
          amountRub: amount,
          status: yukassaPayment.status === 'succeeded' ? 'succeeded' : 'pending',
          yukassaPaymentId: yukassaPayment.id,
          paidAt: yukassaPayment.status === 'succeeded' ? new Date() : null,
        },
      });

      if (yukassaPayment.status === 'succeeded') {
        await this.handlePaymentSuccess(sub);
      }

      return payment;
    } catch (err) {
      logger.error({ err, subscriptionId: sub.id }, 'Payment failed');

      await prisma.payment.create({
        data: {
          subscriptionId: sub.id,
          organizationId: sub.organizationId,
          amountRub: amount,
          status: 'failed',
        },
      });

      await NotificationService.sendPaymentFailed(
        sub.organization.contactEmail,
        sub.organization.name,
        amount,
      );

      // After 3 failed attempts — grace period / suspension
      if (failedCount + 1 >= 3) {
        await this.suspendSubscription(sub);
      } else {
        // Mark as past_due for retry
        await prisma.subscription.update({
          where: { id: sub.id },
          data: { status: 'past_due' },
        });
      }
    }
  }

  static async handlePaymentSuccess(sub: any) {
    const cycleDays = sub.billingCycle === 'monthly' ? 30
      : sub.billingCycle === 'quarterly' ? 90
      : 365;

    const newPeriodStart = new Date();
    const newPeriodEnd = new Date(newPeriodStart.getTime() + cycleDays * 86400000);

    await prisma.subscription.update({
      where: { id: sub.id },
      data: {
        status: 'active',
        currentPeriodStart: newPeriodStart,
        currentPeriodEnd: newPeriodEnd,
      },
    });

    // Renew or generate new license for org instances
    const instances = await prisma.instance.findMany({
      where: { organizationId: sub.organizationId },
    });

    for (const inst of instances) {
      const existingLicense = await prisma.license.findFirst({
        where: {
          instanceId: inst.id,
          isRevoked: false,
        },
        orderBy: { validUntil: 'desc' },
      });

      if (existingLicense) {
        await LicenseGenerator.renew(existingLicense.id, cycleDays);
      } else {
        await LicenseGenerator.create({
          organizationId: sub.organizationId,
          instanceId: inst.id,
          tier: sub.tier as TierName,
          durationDays: cycleDays,
        });
      }
    }

    await NotificationService.sendPaymentSuccess(
      sub.organization.contactEmail,
      sub.organization.name,
      sub.priceRub,
      newPeriodEnd.toISOString().split('T')[0],
    );

    // Update org status
    await prisma.organization.update({
      where: { id: sub.organizationId },
      data: { status: 'active' },
    });
  }

  static async suspendSubscription(sub: any) {
    await prisma.subscription.update({
      where: { id: sub.id },
      data: { status: 'canceled' },
    });

    await prisma.organization.update({
      where: { id: sub.organizationId },
      data: { status: 'suspended' },
    });

    await NotificationService.sendSubscriptionSuspended(
      sub.organization.contactEmail,
      sub.organization.name,
    );

    logger.warn({ subscriptionId: sub.id, orgId: sub.organizationId }, 'Subscription suspended');
  }
}
