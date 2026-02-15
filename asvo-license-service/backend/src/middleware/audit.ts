import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function createAuditLog(params: {
  actor: string;
  action: string;
  entityType: string;
  entityId: string;
  organizationId?: string;
  changes?: any;
  ipAddress?: string;
}) {
  await prisma.auditLog.create({
    data: {
      actor: params.actor,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      organizationId: params.organizationId || null,
      changes: params.changes || null,
      ipAddress: params.ipAddress || null,
    },
  });
}
