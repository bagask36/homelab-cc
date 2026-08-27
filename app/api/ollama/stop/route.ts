import { NextResponse } from "next/server";

import {
  isSessionUser,
  requireApiSession,
} from "@/lib/auth/require-session";
import {
  OllamaActionError,
  stopOllamaModel,
} from "@/lib/ollama/actions";
import {
  ollamaActionResponseSchema,
  ollamaStopRequestSchema,
} from "@/types/ollama-control";

export const dynamic = "force-dynamic";

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

  const parsed = ollamaStopRequestSchema.safeParse(body);
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
    const result = await stopOllamaModel(parsed.data.model);

    return NextResponse.json(
      ollamaActionResponseSchema.parse({
        status: "ok",
        message: result.message,
        model: parsed.data.model,
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
      error instanceof Error ? error.message : "Failed to stop model";

    return NextResponse.json(
      ollamaActionResponseSchema.parse({
        status: "unavailable",
        errors: [message],
      }),
      { status: 500 }
    );
  }
}
