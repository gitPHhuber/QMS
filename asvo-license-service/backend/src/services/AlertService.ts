import { PrismaClient } from '@prisma/client';
import { sendTelegramAlert } from '../utils/email';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export interface Alert {
  type: 'offline_instance' | 'expiring_license' | 'payment_failed' | 'limit_warning';
  severity: 'warning' | 'error' | 'critical';
  message: string;
  entityType: string;
  entityId: string;
  orgName?: string;
}

export class AlertService {
  static async checkOfflineInstances(): Promise<Alert[]> {
    const threshold = new Date(Date.now() - 24 * 3600 * 1000);
    const instances = await prisma.instance.findMany({
      where: {
        status: { not: 'offline' },
        lastHeartbeatAt: { lt: threshold },
      },
      include: { organization: true },
    });

    const alerts: Alert[] = [];

    for (const inst of instances) {
      await prisma.instance.update({
        where: { id: inst.id },
        data: { status: 'offline' },
      });

      alerts.push({
        type: 'offline_instance',
        severity: 'warning',
        message: `Instance "${inst.name}" (${inst.organization.name}) offline > 24h`,
        entityType: 'instance',
        entityId: inst.id,
        orgName: inst.organization.name,
      });
    }

    return alerts;
  }

  static async checkExpiringLicenses(): Promise<Alert[]> {
    const sevenDays = new Date(Date.now() + 7 * 86400 * 1000);
    const licenses = await prisma.license.findMany({
      where: {
        isRevoked: false,
        validUntil: { lte: sevenDays },
      },
      include: { organization: true },
    });

    return licenses.map((lic) => ({
      type: 'expiring_license' as const,
      severity: 'warning' as const,
      message: `License for "${lic.organization.name}" (${lic.tier}) expires ${lic.validUntil.toISOString().split('T')[0]}`,
      entityType: 'license',
      entityId: lic.id,
      orgName: lic.organization.name,
    }));
  }

  static async getActiveAlerts(): Promise<Alert[]> {
    const [offline, expiring] = await Promise.all([
      this.checkOfflineInstances(),
      this.checkExpiringLicenses(),
    ]);
    return [...offline, ...expiring];
  }

  static async sendAdminAlerts(alerts: Alert[]) {
    for (const alert of alerts) {
      if (alert.severity === 'critical' || alert.severity === 'error') {
        await sendTelegramAlert(`⚠️ ${alert.severity.toUpperCase()}: ${alert.message}`);
      }
    }
  }
}
