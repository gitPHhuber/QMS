import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mock PrismaClient
// ---------------------------------------------------------------------------
const mockOrgFindUnique = vi.fn();
const mockOrgCreate = vi.fn();
const mockSubCreate = vi.fn();

vi.mock('@prisma/client', () => ({
  Tier: { start: 'start', standard: 'standard', pro: 'pro', industry: 'industry', corp: 'corp' },
  OrgStatus: { active: 'active', suspended: 'suspended', trial: 'trial', churned: 'churned' },
  SubscriptionStatus: {
    active: 'active',
    past_due: 'past_due',
    canceled: 'canceled',
    trialing: 'trialing',
  },
  PrismaClient: vi.fn().mockImplementation(() => ({
    organization: {
      findUnique: mockOrgFindUnique,
      create: mockOrgCreate,
    },
    subscription: {
      create: mockSubCreate,
    },
  })),
}));

// ---------------------------------------------------------------------------
// Mock NotificationService
// ---------------------------------------------------------------------------
const mockSendWelcome = vi.fn().mockResolvedValue(undefined);
const mockSendSubscriptionCreated = vi.fn().mockResolvedValue(undefined);
const mockNotifyAdminNewRegistration = vi.fn().mockResolvedValue(undefined);

vi.mock('../src/services/NotificationService', () => ({
  NotificationService: {
    sendWelcome: (...args: any[]) => mockSendWelcome(...args),
    sendSubscriptionCreated: (...args: any[]) => mockSendSubscriptionCreated(...args),
    notifyAdminNewRegistration: (...args: any[]) => mockNotifyAdminNewRegistration(...args),
  },
}));

// ---------------------------------------------------------------------------
// Mock LicenseGenerator
// ---------------------------------------------------------------------------
const mockLicenseCreate = vi.fn().mockResolvedValue({
  license: { id: 'lic-trial', tier: 'standard' },
  licenseKey: 'mock.license.key',
});

vi.mock('../src/services/LicenseGenerator', () => ({
  LicenseGenerator: {
    create: (...args: any[]) => mockLicenseCreate(...args),
  },
}));

// Mock logger
vi.mock('../src/utils/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { ProvisioningService } from '../src/services/ProvisioningService';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function defaultParams() {
  return {
    orgName: 'Test Org',
    inn: '7700000001',
    email: 'test@example.com',
    contactName: 'Ivan Petrov',
    tier: 'standard' as const,
    phone: '+79001234567',
  };
}

describe('ProvisioningService.register', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default: INN does not exist yet
    mockOrgFindUnique.mockResolvedValue(null);

    // Organization creation returns a realistic record
    mockOrgCreate.mockImplementation(({ data }: any) =>
      Promise.resolve({
        id: 'org-new-1',
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    );

    // Subscription creation returns a realistic record
    mockSubCreate.mockImplementation(({ data }: any) =>
      Promise.resolve({
        id: 'sub-new-1',
        ...data,
        createdAt: new Date(),
      }),
    );
  });

  // -----------------------------------------------------------------------
  it('creates an organization record', async () => {
    const params = defaultParams();
    const result = await ProvisioningService.register(params);

    expect(mockOrgCreate).toHaveBeenCalledOnce();
    const orgData = mockOrgCreate.mock.calls[0][0].data;
    expect(orgData.name).toBe('Test Org');
    expect(orgData.inn).toBe('7700000001');
    expect(orgData.contactEmail).toBe('test@example.com');
    expect(orgData.contactName).toBe('Ivan Petrov');
    expect(orgData.tier).toBe('standard');
    expect(orgData.status).toBe('trial');
    expect(orgData.trialEndsAt).toBeInstanceOf(Date);
    expect(result.organization).toBeDefined();
    expect(result.organization.id).toBe('org-new-1');
  });

  // -----------------------------------------------------------------------
  it('creates a subscription with trialing status', async () => {
    await ProvisioningService.register(defaultParams());

    expect(mockSubCreate).toHaveBeenCalledOnce();
    const subData = mockSubCreate.mock.calls[0][0].data;
    expect(subData.organizationId).toBe('org-new-1');
    expect(subData.tier).toBe('standard');
    expect(subData.billingCycle).toBe('monthly');
    expect(subData.status).toBe('trialing');
    expect(subData.priceRub).toBe(35000); // standard monthly
    expect(subData.currentPeriodStart).toBeInstanceOf(Date);
    expect(subData.currentPeriodEnd).toBeInstanceOf(Date);

    // Trial period should be ~14 days
    const trialDays =
      (subData.currentPeriodEnd.getTime() - subData.currentPeriodStart.getTime()) / 86400000;
    expect(trialDays).toBeCloseTo(14, 0);
  });

  // -----------------------------------------------------------------------
  it('sends a welcome email', async () => {
    await ProvisioningService.register(defaultParams());

    expect(mockSendWelcome).toHaveBeenCalledOnce();
    const [email, orgName, apiKey] = mockSendWelcome.mock.calls[0];
    expect(email).toBe('test@example.com');
    expect(orgName).toBe('Test Org');
    expect(typeof apiKey).toBe('string');
    expect(apiKey).toMatch(/^inst_/);
  });

  // -----------------------------------------------------------------------
  it('sends subscription-created notification and admin notification', async () => {
    await ProvisioningService.register(defaultParams());

    expect(mockSendSubscriptionCreated).toHaveBeenCalledOnce();
    const [email, orgName, tier] = mockSendSubscriptionCreated.mock.calls[0];
    expect(email).toBe('test@example.com');
    expect(orgName).toBe('Test Org');
    expect(tier).toBe('standard');

    expect(mockNotifyAdminNewRegistration).toHaveBeenCalledOnce();
    expect(mockNotifyAdminNewRegistration).toHaveBeenCalledWith('Test Org', 'test@example.com', 'standard');
  });

  // -----------------------------------------------------------------------
  it('rejects registration when the INN already exists', async () => {
    mockOrgFindUnique.mockResolvedValue({
      id: 'org-existing',
      inn: '7700000001',
      name: 'Existing Org',
    });

    await expect(ProvisioningService.register(defaultParams())).rejects.toThrow(
      'Organization with this INN already exists',
    );

    // No org or subscription should be created
    expect(mockOrgCreate).not.toHaveBeenCalled();
    expect(mockSubCreate).not.toHaveBeenCalled();
    expect(mockSendWelcome).not.toHaveBeenCalled();
  });
});
