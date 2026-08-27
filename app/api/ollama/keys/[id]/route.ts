import { NextResponse } from "next/server";

import { writeAuditLog } from "@/lib/audit/logger";
import {
  isSessionUser,
  requireApiSession,
} from "@/lib/auth/require-session";
import { ApiKeyError, revokeApiKey } from "@/lib/ollama/api-keys";
import { apiKeyActionResponseSchema } from "@/types/api-key";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await requireApiSession();
  if (!isSessionUser(session)) {
    return session;
  }

  const { id } = await context.params;

  try {
    await revokeApiKey(id);

    await writeAuditLog({
      user: session,
      action: "ollama.apikey.revoke",
      target: id,
      success: true,
      message: "Revoked API key",
    });

    return NextResponse.json(
      apiKeyActionResponseSchema.parse({
        status: "ok",
        message: "API key revoked",
      })
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to revoke API key";

    await writeAuditLog({
      user: session,
      action: "ollama.apikey.revoke",
      target: id,
      success: false,
      message,
    });

    return NextResponse.json(
      apiKeyActionResponseSchema.parse({
        status: "unavailable",
        errors: [message],
      }),
      { status: error instanceof ApiKeyError ? error.status : 500 }
    );
  }
}
