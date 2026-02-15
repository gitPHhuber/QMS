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
    }

    // Determine license to send (if updated since last heartbeat)
    let licenseToSend: string | null = null;
    if (currentLicense && instance.lastHeartbeatAt) {
      if (currentLicense.createdAt > instance.lastHeartbeatAt) {
        licenseToSend = currentLicense.licenseKey;
        commands.push({ type: 'update_license' });
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
