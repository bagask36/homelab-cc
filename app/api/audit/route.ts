import { NextResponse } from "next/server";

import { getRecentAuditLogs } from "@/lib/audit/logger";
import {
  isSessionUser,
  requireApiSession,
} from "@/lib/auth/require-session";
import { auditLogsResponseSchema } from "@/types/audit";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await requireApiSession();
  if (!isSessionUser(session)) {
    return session;
  }

  const { searchParams } = new URL(request.url);
  const limitParam = Number(searchParams.get("limit") ?? "50");
  const limit =
    Number.isFinite(limitParam) && limitParam > 0
      ? Math.min(limitParam, 200)
      : 50;

  try {
    const logs = await getRecentAuditLogs(limit);

    return NextResponse.json(
      auditLogsResponseSchema.parse({
        status: "ok",
        logs,
      })
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load audit logs";

    return NextResponse.json(
      auditLogsResponseSchema.parse({
        status: "unavailable",
        logs: [],
        errors: [message],
      }),
      { status: 500 }
    );
  }
}
