import { PrismaClient, Tier, OrgStatus, SubscriptionStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { LicenseGenerator } from './LicenseGenerator';
import { NotificationService } from './NotificationService';
import { TIER_PRESETS, getTierPrice, TierName } from '../config';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

interface RegisterParams {
  orgName: string;
  inn: string;
  email: string;
  contactName: string;
  tier: TierName;
  phone?: string;
}

export class ProvisioningService {
  static async register(params: RegisterParams) {
    const { orgName, inn, email, contactName, tier, phone } = params;

    // Check INN uniqueness
    const existing = await prisma.organization.findUnique({ where: { inn } });
    if (existing) {
      throw new Error('Organization with this INN already exists');
    }

    const now = new Date();
    const trialEnd = new Date(now.getTime() + 14 * 86400000);

    // 1. Create Organization
    const org = await prisma.organization.create({
      data: {
        name: orgName,
        inn,
        contactEmail: email,
        contactPhone: phone || null,
        contactName,
        tier: tier as Tier,
        status: OrgStatus.trial,
        trialEndsAt: trialEnd,
      },
    });

    // 2. Create Subscription (trialing)
    const price = getTierPrice(tier, 'monthly');
    const subscription = await prisma.subscription.create({
      data: {
        organizationId: org.id,
        tier: tier as Tier,
        billingCycle: 'monthly',
        priceRub: price,
        status: SubscriptionStatus.trialing,
        currentPeriodStart: now,
        currentPeriodEnd: trialEnd,
      },
    });

    // 3. Generate trial license
    const { license, licenseKey } = await LicenseGenerator.create({
      organizationId: org.id,
      tier,
      durationDays: 14,
      graceDays: 7,
    });

    // 4. Generate API key for future instance registration
    const apiKey = `inst_${uuidv4().replace(/-/g, '')}`;

    // 5. Send welcome email
    await NotificationService.sendWelcome(email, orgName, apiKey);
    await NotificationService.sendSubscriptionCreated(
      email,
      orgName,
      tier,
      trialEnd.toISOString().split('T')[0],
    );

    // 6. Notify admins
    await NotificationService.notifyAdminNewRegistration(orgName, email, tier);

    logger.info({ orgId: org.id, tier }, 'New organization registered');

    return {
      organization: org,
      subscription,
      license,
      licenseKey,
      apiKey,
    };
  }
}
