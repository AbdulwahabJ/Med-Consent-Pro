import { desc } from "drizzle-orm";
import { db, auditLogsTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

export interface CreateAuditLogInput {
  userId: number | null;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown> | null;
}

export async function createAuditLog(input: CreateAuditLogInput): Promise<void> {
  await db.insert(auditLogsTable).values({
    userId: input.userId,
    action: input.action,
    entityType: input.entityType ?? null,
    entityId: input.entityId ?? null,
    ipAddress: input.ipAddress ?? null,
    userAgent: input.userAgent ?? null,
    metadata: input.metadata ?? null,
  });
}

export async function getRecentAuditLogs(limit = 10) {
  const rows = await db
    .select({
      id: auditLogsTable.id,
      userId: auditLogsTable.userId,
      userFullNameAr: usersTable.fullNameAr,
      action: auditLogsTable.action,
      entityType: auditLogsTable.entityType,
      entityId: auditLogsTable.entityId,
      createdAt: auditLogsTable.createdAt,
    })
    .from(auditLogsTable)
    .leftJoin(usersTable, eq(auditLogsTable.userId, usersTable.id))
    .orderBy(desc(auditLogsTable.createdAt))
    .limit(limit);

  return rows.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
  }));
}
