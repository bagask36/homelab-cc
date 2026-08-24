import type { SessionUser } from "@/lib/auth/session";
import { getPrisma, isDatabaseConfigured } from "@/lib/db/prisma";
import { auditActionSchema, type AuditAction } from "@/types/audit";

export type AuditLogInput = {
  user: SessionUser;
  action: AuditAction;
  target: string;
  targetName?: string;
  success: boolean;
  message?: string;
};

export async function writeAuditLog(entry: AuditLogInput): Promise<void> {
  if (!isDatabaseConfigured()) {
    console.warn(
      `[audit] ${entry.action} on ${entry.target} by ${entry.user.username} (database unavailable)`
    );
    return;
  }

  const prisma = getPrisma();
  if (!prisma) return;

  try {
    await prisma.auditLog.create({
      data: {
        userId: entry.user.userId,
        username: entry.user.username,
        action: entry.action,
        target: entry.target,
        targetName: entry.targetName,
        success: entry.success,
        message: entry.message,
      },
    });
  } catch (error) {
    console.error(
      "[audit] Failed to write audit log:",
      error instanceof Error ? error.message : error
    );
  }
}

export async function getRecentAuditLogs(limit = 50) {
  if (!isDatabaseConfigured()) {
    return [];
  }

  const prisma = getPrisma();
  if (!prisma) return [];

  const logs = await prisma.auditLog.findMany({
    orderBy: { timestamp: "desc" },
    take: limit,
  });

  return logs
    .map((log) => {
      const parsedAction = auditActionSchema.safeParse(log.action);
      if (!parsedAction.success) {
        return null;
      }

      return {
        id: log.id,
        timestamp: log.timestamp.toISOString(),
        userId: log.userId,
        username: log.username,
        action: parsedAction.data,
        target: log.target,
        targetName: log.targetName,
        success: log.success,
        message: log.message,
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null);
}
