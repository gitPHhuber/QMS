import { PrismaClient, InstanceStatus } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

interface HeartbeatData {
  fingerprint: string;
  version: string;
  modules_active: string[];
  users_count: number;
  storage_used_gb: number;
  os: string;
  uptime_hours: number;
  errors_24h: number;
}

interface HeartbeatCommand {
  type: string;
  [key: string]: any;
}

export class HeartbeatService {
  static async process(instanceId: string, data: HeartbeatData, clientIp: string) {
    const instance = await prisma.instance.findUnique({
      where: { id: instanceId },
      include: {
        organization: { include: { subscription: true } },
        licenses: {
          where: { isRevoked: false },
          orderBy: { validUntil: 'desc' },
          take: 1,
        },
      },
    });

    if (!instance) {
      throw new Error('Instance not found');
    }

    // Check if organization license is revoked (all licenses revoked)
    const activeLicenseCount = await prisma.license.count({
      where: { organizationId: instance.organizationId, isRevoked: false },
    });
    const allRevoked = activeLicenseCount === 0 && await prisma.license.count({
      where: { organizationId: instance.organizationId },
    }) > 0;
    if (allRevoked) {
      throw Object.assign(new Error('License revoked'), { statusCode: 403 });
    }

    // Fingerprint mismatch check — alert but do NOT block
    if (data.fingerprint !== instance.fingerprint) {
      logger.warn(
        { instanceId, expected: instance.fingerprint, received: data.fingerprint },
        'Fingerprint mismatch detected',
      );
      await prisma.telemetryEvent.create({
        data: {
          instanceId,
          eventType: 'error',
          payload: {
            type: 'fingerprint_mismatch',
            expected: instance.fingerprint,
            received: data.fingerprint,
          },
        },
      });
    }

    // Update instance status
    await prisma.instance.update({
      where: { id: instanceId },
      data: {
        lastHeartbeatAt: new Date(),
        lastIp: clientIp,
        version: data.version,
        modulesActive: data.modules_active,
        status: InstanceStatus.online,
        osInfo: { os: data.os, uptime_hours: data.uptime_hours },
      },
    });

    // Create telemetry event
    await prisma.telemetryEvent.create({
      data: {
        instanceId,
        eventType: 'heartbeat',
        payload: {
          fingerprint: data.fingerprint,
          version: data.version,
          modules_active: data.modules_active,
          users_count: data.users_count,
          storage_used_gb: data.storage_used_gb,
          os: data.os,
          uptime_hours: data.uptime_hours,
          errors_24h: data.errors_24h,
        },
      },
    });

    // Log errors
    if (data.errors_24h > 0) {
      await prisma.telemetryEvent.create({
        data: {
          instanceId,
          eventType: 'error',
          payload: { errors_24h: data.errors_24h },
        },
      });
    }

    // Build commands
    const commands: HeartbeatCommand[] = [];

    // Check if subscription is suspended
    const sub = instance.organization.subscription;
    if (sub && sub.status === 'canceled') {
      commands.push({
        type: 'message',
        severity: 'error',
        text: 'Подписка приостановлена. Свяжитесь с поддержкой.',
      });
    }

    // Fingerprint mismatch warning command
    if (data.fingerprint !== instance.fingerprint) {
      commands.push({
        type: 'message',
        severity: 'warning',
        text: 'Обнаружено несовпадение аппаратного отпечатка. Свяжитесь с администратором.',
      });
    }

    // Check for pending license update
    const currentLicense = instance.licenses[0];
    if (currentLicense) {
      const now = new Date();
      const daysUntilExpiry = Math.floor((currentLicense.validUntil.getTime() - now.getTime()) / 86400000);
      if (daysUntilExpiry <= 7 && daysUntilExpiry > 0) {
        commands.push({
          type: 'message',
          severity: 'warning',
          text: `Лицензия истекает через ${daysUntilExpiry} дн. Обновление будет выполнено автоматически.`,
        });
      }

      // Module enable/disable commands
      const licensedModules = currentLicense.modules || [];
      const activeModules = data.modules_active || [];

      // Modules that should be enabled but are not active
      for (const mod of licensedModules) {
        if (mod !== '*' && !activeModules.includes(mod)) {
          commands.push({ type: 'enable_module', module: mod });
        }
      }

      // Modules that are active but not in the license (unless license has wildcard)
      if (!licensedModules.includes('*')) {
        for (const mod of activeModules) {
          if (!licensedModules.includes(mod)) {
            commands.push({ type: 'disable_module', module: mod });
          }
        }
      }
    }

    // Determine license to send (if updated since last heartbeat)
    let licenseToSend: string | null = null;
    if (currentLicense && instance.lastHeartbeatAt) {
      if (currentLicense.createdAt > instance.lastHeartbeatAt) {
        licenseToSend = currentLicense.licenseKey;
        commands.push({ type: 'update_license', license: currentLicense.licenseKey });
      }
    }

    return {
      status: 'ok',
      license: licenseToSend,
      commands,
      server_time: new Date().toISOString(),
    };
  }
}
