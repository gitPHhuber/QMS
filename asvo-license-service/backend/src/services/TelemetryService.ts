import { PrismaClient, TelemetryEventType } from '@prisma/client';

const prisma = new PrismaClient();

export class TelemetryService {
  static async getEvents(instanceId: string, options: {
    eventType?: TelemetryEventType;
    from?: Date;
    to?: Date;
    limit?: number;
    offset?: number;
  } = {}) {
    const { eventType, from, to, limit = 100, offset = 0 } = options;

    const where: any = { instanceId };
    if (eventType) where.eventType = eventType;
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = from;
      if (to) where.createdAt.lte = to;
    }

    const [events, total] = await Promise.all([
      prisma.telemetryEvent.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.telemetryEvent.count({ where }),
    ]);

    return { events, total };
  }

  static async getAggregatedStats(instanceId: string, days: number = 30) {
    const since = new Date(Date.now() - days * 86400 * 1000);

    const events = await prisma.telemetryEvent.findMany({
      where: {
        instanceId,
        eventType: 'heartbeat',
        createdAt: { gte: since },
      },
      orderBy: { createdAt: 'asc' },
    });

    const usersData: { date: string; count: number }[] = [];
    const storageData: { date: string; gb: number }[] = [];
    const errorsData: { date: string; count: number }[] = [];

    for (const event of events) {
      const payload = event.payload as any;
      const date = event.createdAt.toISOString().split('T')[0];
      if (payload.users_count != null) {
        usersData.push({ date, count: payload.users_count });
      }
      if (payload.storage_used_gb != null) {
        storageData.push({ date, gb: payload.storage_used_gb });
      }
      if (payload.errors_24h != null) {
        errorsData.push({ date, count: payload.errors_24h });
      }
    }

    return { usersData, storageData, errorsData };
  }
}
