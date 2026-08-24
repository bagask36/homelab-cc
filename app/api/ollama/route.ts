import { NextResponse } from "next/server";

import { getOllamaHealth } from "@/lib/ollama/client";
import { ollamaResponseSchema } from "@/types/ollama";

export const dynamic = "force-dynamic";

export async function GET() {
  const timestamp = new Date().toISOString();

  try {
    const health = await getOllamaHealth();

    const response = ollamaResponseSchema.parse({
      status: health.online ? "ok" : "unavailable",
      timestamp,
      online: health.online,
      responseTimeMs: health.responseTimeMs,
      models: health.models,
      runningModels: health.runningModels,
      errors: health.online ? undefined : [health.message],
    });

    return NextResponse.json(response);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Ollama monitoring unavailable";

    return NextResponse.json(
      ollamaResponseSchema.parse({
        status: "unavailable",
        timestamp,
        online: false,
        errors: [message],
      }),
      { status: 503 }
    );
  }
}
