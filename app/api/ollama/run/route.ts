import { NextResponse } from "next/server";

import {
  isSessionUser,
  requireApiSession,
} from "@/lib/auth/require-session";
import {
  OllamaActionError,
  runOllamaModel,
} from "@/lib/ollama/actions";
import {
  ollamaActionResponseSchema,
  ollamaRunRequestSchema,
} from "@/types/ollama-control";

export const dynamic = "force-dynamic";
export const maxDuration = 180;

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
      ollamaActionResponseSchema.parse({
        status: "unavailable",
        errors: ["Invalid JSON body"],
      }),
      { status: 400 }
    );
  }

  const parsed = ollamaRunRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      ollamaActionResponseSchema.parse({
        status: "unavailable",
        errors: parsed.error.issues.map((issue) => issue.message),
      }),
      { status: 400 }
    );
  }

  try {
    const result = await runOllamaModel(parsed.data);

    return NextResponse.json(
      ollamaActionResponseSchema.parse({
        status: "ok",
        message: result.message,
        model: parsed.data.model,
        response: result.response || undefined,
        responseTimeMs: result.responseTimeMs,
      })
    );
  } catch (error) {
    if (error instanceof OllamaActionError) {
      return NextResponse.json(
        ollamaActionResponseSchema.parse({
          status: "unavailable",
          errors: [error.message],
        }),
        { status: error.status }
      );
    }

    const message =
      error instanceof Error ? error.message : "Failed to run model";

    return NextResponse.json(
      ollamaActionResponseSchema.parse({
        status: "unavailable",
        errors: [message],
      }),
      { status: 500 }
    );
  }
}
