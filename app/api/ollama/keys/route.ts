import { NextResponse } from "next/server";

import { writeAuditLog } from "@/lib/audit/logger";
import {
  isSessionUser,
  requireApiSession,
} from "@/lib/auth/require-session";
import { ApiKeyError, createApiKey, listApiKeys } from "@/lib/ollama/api-keys";
import {
  apiKeyCreateInputSchema,
  apiKeyCreateResponseSchema,
  apiKeyListResponseSchema,
} from "@/types/api-key";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await requireApiSession();
  if (!isSessionUser(session)) {
    return session;
  }

  try {
    const keys = await listApiKeys();
    return NextResponse.json(
      apiKeyListResponseSchema.parse({ status: "ok", keys })
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to list API keys";

    return NextResponse.json(
      apiKeyListResponseSchema.parse({
        status: "unavailable",
        errors: [message],
      }),
      { status: error instanceof ApiKeyError ? error.status : 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await requireApiSession();
  if (!isSessionUser(session)) {
    return session;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      apiKeyCreateResponseSchema.parse({
        status: "unavailable",
        errors: ["Invalid JSON body"],
      }),
      { status: 400 }
    );
  }

  const parsed = apiKeyCreateInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      apiKeyCreateResponseSchema.parse({
        status: "unavailable",
        errors: parsed.error.issues.map((issue) => issue.message),
      }),
      { status: 400 }
    );
  }

  try {
    const created = await createApiKey(parsed.data);

    await writeAuditLog({
      user: session,
      action: "ollama.apikey.create",
      target: created.key.id,
      targetName: created.key.name,
      success: true,
      message: `Created API key ${created.key.name} (${created.key.keyPrefix}…)`,
    });

    return NextResponse.json(
      apiKeyCreateResponseSchema.parse({
        status: "ok",
        message: "API key created. Copy it now — it will not be shown again.",
        key: created.key,
        token: created.token,
      })
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create API key";

    await writeAuditLog({
      user: session,
      action: "ollama.apikey.create",
      target: "api-key",
      success: false,
      message,
    });

    return NextResponse.json(
      apiKeyCreateResponseSchema.parse({
        status: "unavailable",
        errors: [message],
      }),
      { status: error instanceof ApiKeyError ? error.status : 500 }
    );
  }
}
