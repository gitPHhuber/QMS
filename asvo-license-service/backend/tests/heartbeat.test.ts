import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mock PrismaClient before importing the service
// ---------------------------------------------------------------------------
const {
  mockInstanceFindUnique,
  mockInstanceUpdate,
  mockTelemetryEventCreate,
  mockLicenseCount,
} = vi.hoisted(() => ({
  mockInstanceFindUnique: vi.fn(),
  mockInstanceUpdate: vi.fn(),
  mockTelemetryEventCreate: vi.fn(),
  mockLicenseCount: vi.fn().mockResolvedValue(1),
}));

vi.mock('@prisma/client', () => {
  const InstanceStatus = { online: 'online', offline: 'offline', degraded: 'degraded' } as const;
  return {
    InstanceStatus,
    PrismaClient: vi.fn().mockImplementation(() => ({
      instance: {
        findUnique: mockInstanceFindUnique,
        update: mockInstanceUpdate,
      },
      telemetryEvent: {
        create: mockTelemetryEventCreate,
      },
      license: {
        count: mockLicenseCount,
      },
    })),
  };
});

// Mock logger to prevent console noise
vi.mock('../src/utils/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { HeartbeatService } from '../src/services/HeartbeatService';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeHeartbeatData(overrides: Record<string, unknown> = {}) {
  return {
    fingerprint: 'fp-abc123',
    version: '2.4.1',
    modules_active: ['qms.dms', 'qms.nc'],
    users_count: 3,
    storage_used_gb: 1.2,
    os: 'Ubuntu 22.04',
    uptime_hours: 120,
    errors_24h: 0,
    ...overrides,
  };
}

function makeInstanceRow(overrides: Record<string, unknown> = {}) {
  const now = new Date();
  const validUntil = new Date(now.getTime() + 30 * 86400000); // 30 days from now
  return {
    id: 'inst-001',
    organizationId: 'org-001',
    fingerprint: 'fp-abc123',
    lastHeartbeatAt: new Date(now.getTime() - 300_000), // 5 min ago
    organization: {
      subscription: { status: 'active' },
    },
    licenses: [
      {
        id: 'lic-001',
        licenseKey: 'tok.en.sig',
        modules: ['qms.dms', 'qms.nc'],
        validUntil,
        createdAt: new Date(now.getTime() - 86400000), // created yesterday
      },
    ],
    ...overrides,
  };
}

describe('HeartbeatService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInstanceUpdate.mockResolvedValue({});
    mockTelemetryEventCreate.mockResolvedValue({});
  });

  // -----------------------------------------------------------------------
  it('returns status: ok for a valid heartbeat', async () => {
    mockInstanceFindUnique.mockResolvedValue(makeInstanceRow());

    const result = await HeartbeatService.process('inst-001', makeHeartbeatData(), '10.0.0.1');

    expect(result.status).toBe('ok');
    expect(result).toHaveProperty('server_time');
  });

  // -----------------------------------------------------------------------
  it('updates instance fields (lastHeartbeatAt, lastIp, version, status)', async () => {
    mockInstanceFindUnique.mockResolvedValue(makeInstanceRow());

    await HeartbeatService.process('inst-001', makeHeartbeatData({ version: '3.0.0' }), '192.168.1.5');

    expect(mockInstanceUpdate).toHaveBeenCalledOnce();
    const updateCall = mockInstanceUpdate.mock.calls[0][0];
    expect(updateCall.where).toEqual({ id: 'inst-001' });
    expect(updateCall.data.version).toBe('3.0.0');
    expect(updateCall.data.lastIp).toBe('192.168.1.5');
    expect(updateCall.data.status).toBe('online');
    expect(updateCall.data.lastHeartbeatAt).toBeInstanceOf(Date);
  });

  // -----------------------------------------------------------------------
  it('creates a telemetry event of type heartbeat', async () => {
    const data = makeHeartbeatData();
    mockInstanceFindUnique.mockResolvedValue(makeInstanceRow());

    await HeartbeatService.process('inst-001', data, '10.0.0.1');

    // The first telemetryEvent.create call should be the heartbeat event
    const firstCreateCall = mockTelemetryEventCreate.mock.calls[0][0];
    expect(firstCreateCall.data.instanceId).toBe('inst-001');
    expect(firstCreateCall.data.eventType).toBe('heartbeat');
    expect(firstCreateCall.data.payload).toMatchObject({
      fingerprint: data.fingerprint,
      version: data.version,
      modules_active: data.modules_active,
      users_count: data.users_count,
      storage_used_gb: data.storage_used_gb,
    });
  });

  // -----------------------------------------------------------------------
  it('includes a warning command when the license expires within 7 days', async () => {
    const now = new Date();
    const almostExpired = new Date(now.getTime() + 5 * 86400000); // 5 days from now
    const instance = makeInstanceRow({
      licenses: [
        {
          id: 'lic-exp',
          licenseKey: 'tok.en.sig',
          modules: ['qms.dms', 'qms.nc'],
          validUntil: almostExpired,
          createdAt: new Date(now.getTime() - 86400000),
        },
      ],
    });
    mockInstanceFindUnique.mockResolvedValue(instance);

    const result = await HeartbeatService.process('inst-001', makeHeartbeatData(), '10.0.0.1');

    const warningCmd = result.commands.find(
      (c: { type: string; severity?: string }) => c.type === 'message' && c.severity === 'warning',
    );
    expect(warningCmd).toBeDefined();
    expect(warningCmd!.text).toContain('5');
  });

  // -----------------------------------------------------------------------
  it('does not include a warning when the license expires in more than 7 days', async () => {
    const now = new Date();
    const farFuture = new Date(now.getTime() + 30 * 86400000);
    const instance = makeInstanceRow({
      licenses: [
        {
          id: 'lic-ok',
          licenseKey: 'tok.en.sig',
          modules: ['qms.dms', 'qms.nc'],
          validUntil: farFuture,
          createdAt: new Date(now.getTime() - 86400000),
        },
      ],
    });
    mockInstanceFindUnique.mockResolvedValue(instance);

    const result = await HeartbeatService.process('inst-001', makeHeartbeatData(), '10.0.0.1');

    const warningCmd = result.commands.find(
      (c: { type: string; severity?: string }) => c.type === 'message' && c.severity === 'warning',
    );
    expect(warningCmd).toBeUndefined();
  });

  // -----------------------------------------------------------------------
  it('throws when instance is not found', async () => {
    mockInstanceFindUnique.mockResolvedValue(null);

    await expect(
      HeartbeatService.process('missing', makeHeartbeatData(), '10.0.0.1'),
    ).rejects.toThrow('Instance not found');
  });
});
