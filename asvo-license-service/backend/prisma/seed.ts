import { PrismaClient, Tier, OrgStatus, InstanceStatus, SubscriptionStatus, BillingCycle } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 3600 * 1000);
  const threeSixtyFiveDaysFromNow = new Date(now.getTime() + 365 * 24 * 3600 * 1000);

  // Upsert demo organization based on INN for idempotency
  const org = await prisma.organization.upsert({
    where: { inn: '7710000001' },
    update: {
      name: 'ООО МедТех Демо',
      contactEmail: 'demo@medtech.ru',
      contactName: 'Иванов Иван',
      tier: Tier.pro,
      status: OrgStatus.active,
    },
    create: {
      name: 'ООО МедТех Демо',
      inn: '7710000001',
      contactEmail: 'demo@medtech.ru',
      contactName: 'Иванов Иван',
      tier: Tier.pro,
      status: OrgStatus.active,
    },
  });
  console.log(`Organization upserted: ${org.name} (${org.id})`);

  // Upsert demo instance — find existing or create
  let instance = await prisma.instance.findFirst({
    where: { organizationId: org.id, fingerprint: 'sha256:demo123' },
  });

  if (instance) {
    instance = await prisma.instance.update({
      where: { id: instance.id },
      data: {
        name: 'Площадка Москва',
        version: '1.3.2',
        status: InstanceStatus.online,
        lastHeartbeatAt: now,
      },
    });
    console.log(`Instance updated: ${instance.name} (${instance.id})`);
  } else {
    instance = await prisma.instance.create({
      data: {
        organizationId: org.id,
        name: 'Площадка Москва',
        fingerprint: 'sha256:demo123',
        version: '1.3.2',
        status: InstanceStatus.online,
        lastHeartbeatAt: now,
        apiKey: crypto.createHash('sha256').update('demo_inst_key_12345678').digest('hex'),
      },
    });
    console.log(`Instance created: ${instance.name} (${instance.id})`);
  }

  // Upsert demo subscription (one-to-one with org via organizationId unique)
  const subscription = await prisma.subscription.upsert({
    where: { organizationId: org.id },
    update: {
      tier: Tier.pro,
      billingCycle: BillingCycle.monthly,
      priceRub: 60000,
      status: SubscriptionStatus.active,
      currentPeriodStart: now,
      currentPeriodEnd: thirtyDaysFromNow,
    },
    create: {
      organizationId: org.id,
      tier: Tier.pro,
      billingCycle: BillingCycle.monthly,
      priceRub: 60000,
      status: SubscriptionStatus.active,
      currentPeriodStart: now,
      currentPeriodEnd: thirtyDaysFromNow,
    },
  });
  console.log(`Subscription upserted: ${subscription.tier} / ${subscription.billingCycle} (${subscription.id})`);

  // Demo license — find existing active license or create one
  const proModules = [
    'qms.dms', 'qms.nc', 'qms.capa', 'qms.risk', 'qms.changes',
    'qms.complaints', 'qms.supplier', 'qms.audit', 'qms.training',
    'qms.equipment', 'qms.review', 'qms.pms', 'qms.dashboard',
    'wms.warehouse', 'wms.movements', 'wms.inventory',
    'addon.mobile', 'addon.pdf',
  ];

  let license = await prisma.license.findFirst({
    where: {
      organizationId: org.id,
      instanceId: instance.id,
      isRevoked: false,
    },
  });

  if (license) {
    license = await prisma.license.update({
      where: { id: license.id },
      data: {
        tier: Tier.pro,
        modules: proModules,
        maxUsers: 50,
        maxStorageGb: 100,
        validFrom: now,
        validUntil: threeSixtyFiveDaysFromNow,
        licenseKey: 'demo_license_placeholder',
      },
    });
    console.log(`License updated: ${license.tier} (${license.id})`);
  } else {
    license = await prisma.license.create({
      data: {
        organizationId: org.id,
        instanceId: instance.id,
        tier: Tier.pro,
        modules: proModules,
        maxUsers: 50,
        maxStorageGb: 100,
        validFrom: now,
        validUntil: threeSixtyFiveDaysFromNow,
        licenseKey: 'demo_license_placeholder',
      },
    });
    console.log(`License created: ${license.tier} (${license.id})`);
  }

  console.log('');
  console.log('Seed completed successfully!');
  console.log(`  Organization: ${org.name} (INN: 7710000001)`);
  console.log(`  Instance:     ${instance.name} (v${instance.version})`);
  console.log(`  Subscription: ${subscription.tier} / ${subscription.billingCycle} / ${subscription.priceRub} RUB`);
  console.log(`  License:      ${license.tier} / valid until ${license.validUntil.toISOString().split('T')[0]}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('Seed failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
