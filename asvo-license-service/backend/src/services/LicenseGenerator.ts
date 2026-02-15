import { PrismaClient, Tier } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { sign, getPrivateKey } from '../utils/crypto';
import { TIER_PRESETS, TierName } from '../config';

const prisma = new PrismaClient();

interface CreateLicenseParams {
  organizationId: string;
  instanceId?: string;
  tier: TierName;
  modules?: string[];
  maxUsers?: number;
  maxStorageGb?: number;
  durationDays: number;
  fingerprint?: string;
  graceDays?: number;
}

export class LicenseGenerator {
  static async create(params: CreateLicenseParams) {
    const preset = TIER_PRESETS[params.tier];
    const modules = params.modules || [...preset.modules];
    const maxUsers = params.maxUsers || preset.max_users;
    const maxStorageGb = params.maxStorageGb || preset.max_storage_gb;
    const graceDays = params.graceDays || 14;

    const now = new Date();
    const validFrom = now;
    const validUntil = new Date(now.getTime() + params.durationDays * 86400 * 1000);

    const licenseId = uuidv4();
    const iat = Math.floor(now.getTime() / 1000);
    const exp = Math.floor(validUntil.getTime() / 1000);

    const org = await prisma.organization.findUnique({ where: { id: params.organizationId } });
    if (!org) throw new Error('Organization not found');

    const payload = {
      iss: 'asvo-license-service',
      sub: org.name,
      iat,
      exp,
      lid: licenseId,
      tier: params.tier,
      modules,
      limits: {
        max_users: maxUsers,
        max_storage_gb: maxStorageGb,
      },
      fingerprint: params.fingerprint || null,
      grace_days: graceDays,
    };

    const secretKey = getPrivateKey();
    const licenseKey = sign(payload, secretKey);

    const license = await prisma.license.create({
      data: {
        id: licenseId,
        organizationId: params.organizationId,
        instanceId: params.instanceId || null,
        licenseKey,
        tier: params.tier as Tier,
        modules,
        maxUsers,
        maxStorageGb,
        validFrom,
        validUntil,
      },
    });

    return { license, licenseKey };
  }

  static async revoke(licenseId: string, reason: string) {
    return prisma.license.update({
      where: { id: licenseId },
      data: {
        isRevoked: true,
        revokedAt: new Date(),
        revokeReason: reason,
      },
    });
  }

  static async renew(licenseId: string, durationDays: number) {
    const existing = await prisma.license.findUnique({
      where: { id: licenseId },
      include: { organization: true },
    });
    if (!existing) throw new Error('License not found');

    const now = new Date();
    const baseDate = existing.validUntil > now ? existing.validUntil : now;
    const newValidUntil = new Date(baseDate.getTime() + durationDays * 86400 * 1000);

    const payload = {
      iss: 'asvo-license-service',
      sub: existing.organization.name,
      iat: Math.floor(now.getTime() / 1000),
      exp: Math.floor(newValidUntil.getTime() / 1000),
      lid: existing.id,
      tier: existing.tier,
      modules: existing.modules,
      limits: {
        max_users: existing.maxUsers,
        max_storage_gb: existing.maxStorageGb,
      },
      fingerprint: null,
      grace_days: 14,
    };

    const secretKey = getPrivateKey();
    const licenseKey = sign(payload, secretKey);

    return prisma.license.update({
      where: { id: licenseId },
      data: {
        licenseKey,
        validUntil: newValidUntil,
        isRevoked: false,
        revokedAt: null,
        revokeReason: null,
      },
    });
  }
}
