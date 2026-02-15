import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateKeyPair, sign, verify } from '../src/utils/crypto';

// ---------------------------------------------------------------------------
// Mock PrismaClient
// ---------------------------------------------------------------------------
const {
  mockOrgFindUnique,
  mockLicenseCreate,
  mockLicenseUpdate,
  mockLicenseFindUnique,
} = vi.hoisted(() => ({
  mockOrgFindUnique: vi.fn(),
  mockLicenseCreate: vi.fn(),
  mockLicenseUpdate: vi.fn(),
  mockLicenseFindUnique: vi.fn(),
}));

vi.mock('@prisma/client', () => ({
  Tier: { start: 'start', standard: 'standard', pro: 'pro', industry: 'industry', corp: 'corp' },
  PrismaClient: vi.fn().mockImplementation(() => ({
    organization: { findUnique: mockOrgFindUnique },
    license: {
      create: mockLicenseCreate,
      update: mockLicenseUpdate,
      findUnique: mockLicenseFindUnique,
    },
  })),
}));

// Mock crypto key functions — use a real key pair so sign/verify actually work
const testKeyPair = generateKeyPair();

vi.mock('../src/utils/crypto', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/utils/crypto')>();
  return {
    ...actual,
    getPrivateKey: () => testKeyPair.secretKey,
    getPublicKey: () => testKeyPair.publicKey,
  };
});

// Mock config (getConfig is used by crypto, but we override getPrivateKey above)
vi.mock('../src/config', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/config')>();
  return {
    ...actual,
    getConfig: () => ({
      ED25519_PRIVATE_KEY_PATH: '',
      ED25519_PUBLIC_KEY_PATH: '',
    }),
  };
});

// Mock logger
vi.mock('../src/utils/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { LicenseGenerator } from '../src/services/LicenseGenerator';

describe('LicenseGenerator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -----------------------------------------------------------------------
  describe('create — sign + verify cycle', () => {
    it('generates a license token that can be verified with the public key', async () => {
      mockOrgFindUnique.mockResolvedValue({ id: 'org-1', name: 'Test Org' });
      mockLicenseCreate.mockImplementation(({ data }: any) =>
        Promise.resolve({ id: data.id, ...data }),
      );

      const { licenseKey } = await LicenseGenerator.create({
        organizationId: 'org-1',
        tier: 'standard',
        durationDays: 30,
      });

      expect(typeof licenseKey).toBe('string');

      // Verify with real crypto
      const result = verify(licenseKey, testKeyPair.publicKey);
      expect(result.valid).toBe(true);
      expect(result.error).toBeNull();
    });
  });

  // -----------------------------------------------------------------------
  describe('create — payload fields', () => {
    it('produces a payload with iss, sub, iat, exp, lid, tier, modules, and limits', async () => {
      mockOrgFindUnique.mockResolvedValue({ id: 'org-2', name: 'Pharma LLC' });
      mockLicenseCreate.mockImplementation(({ data }: any) =>
        Promise.resolve({ id: data.id, ...data }),
      );

      const { licenseKey } = await LicenseGenerator.create({
        organizationId: 'org-2',
        tier: 'pro',
        durationDays: 90,
        maxUsers: 25,
        maxStorageGb: 50,
        modules: ['qms.dms', 'qms.nc', 'qms.capa'],
      });

      const { payload } = verify(licenseKey, testKeyPair.publicKey);

      expect(payload.iss).toBe('asvo-license-service');
      expect(payload.sub).toBe('Pharma LLC');
      expect(payload.tier).toBe('pro');
      expect(payload.lid).toEqual(expect.any(String));
      expect(payload.iat).toEqual(expect.any(Number));
      expect(payload.exp).toEqual(expect.any(Number));
      expect(payload.exp).toBeGreaterThan(payload.iat);
      expect(payload.modules).toEqual(['qms.dms', 'qms.nc', 'qms.capa']);
      expect(payload.limits).toEqual({ max_users: 25, max_storage_gb: 50 });
    });

    it('uses tier preset defaults when modules/maxUsers/maxStorageGb are not supplied', async () => {
      mockOrgFindUnique.mockResolvedValue({ id: 'org-3', name: 'Default Org' });
      mockLicenseCreate.mockImplementation(({ data }: any) =>
        Promise.resolve({ id: data.id, ...data }),
      );

      const { licenseKey } = await LicenseGenerator.create({
        organizationId: 'org-3',
        tier: 'start',
        durationDays: 14,
      });

      const { payload } = verify(licenseKey, testKeyPair.publicKey);

      // start preset: max_users=5, max_storage_gb=5, modules=['qms.dms','qms.nc']
      expect(payload.modules).toEqual(['qms.dms', 'qms.nc']);
      expect(payload.limits.max_users).toBe(5);
      expect(payload.limits.max_storage_gb).toBe(5);
    });
  });

  // -----------------------------------------------------------------------
  describe('revoke', () => {
    it('marks the license as revoked with a reason and timestamp', async () => {
      mockLicenseUpdate.mockResolvedValue({
        id: 'lic-99',
        isRevoked: true,
        revokedAt: new Date(),
        revokeReason: 'policy violation',
      });

      const result = await LicenseGenerator.revoke('lic-99', 'policy violation');

      expect(mockLicenseUpdate).toHaveBeenCalledOnce();
      const call = mockLicenseUpdate.mock.calls[0][0];
      expect(call.where).toEqual({ id: 'lic-99' });
      expect(call.data.isRevoked).toBe(true);
      expect(call.data.revokedAt).toBeInstanceOf(Date);
      expect(call.data.revokeReason).toBe('policy violation');
      expect(result.isRevoked).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  describe('renew', () => {
    it('extends the validity of an existing license and produces a new token', async () => {
      const now = new Date();
      const existingValidUntil = new Date(now.getTime() + 10 * 86400000); // 10 days left

      mockLicenseFindUnique.mockResolvedValue({
        id: 'lic-renew',
        organizationId: 'org-r',
        tier: 'standard',
        modules: ['qms.dms', 'qms.nc'],
        maxUsers: 15,
        maxStorageGb: 20,
        validUntil: existingValidUntil,
        organization: { name: 'Renew Corp' },
      });

      mockLicenseUpdate.mockImplementation(({ data }: any) =>
        Promise.resolve({
          id: 'lic-renew',
          ...data,
        }),
      );

      const result = await LicenseGenerator.renew('lic-renew', 30);

      expect(mockLicenseUpdate).toHaveBeenCalledOnce();
      const call = mockLicenseUpdate.mock.calls[0][0];

      // New validUntil should be existingValidUntil + 30 days (since existing > now)
      const expectedEnd = new Date(existingValidUntil.getTime() + 30 * 86400000);
      const actualEnd = call.data.validUntil as Date;
      // Allow 2 seconds tolerance for test execution time
      expect(Math.abs(actualEnd.getTime() - expectedEnd.getTime())).toBeLessThan(2000);

      // Should un-revoke the license
      expect(call.data.isRevoked).toBe(false);
      expect(call.data.revokedAt).toBeNull();
      expect(call.data.revokeReason).toBeNull();

      // New licenseKey should verify
      const verifyResult = verify(call.data.licenseKey, testKeyPair.publicKey);
      expect(verifyResult.valid).toBe(true);
      expect(verifyResult.payload.sub).toBe('Renew Corp');
    });
  });
});
