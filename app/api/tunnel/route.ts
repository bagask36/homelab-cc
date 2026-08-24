import { NextResponse } from "next/server";

import { getCloudflareTunnelHealth } from "@/lib/cloudflare/client";
import { tunnelResponseSchema } from "@/types/tunnel";

export const dynamic = "force-dynamic";

export async function GET() {
  const timestamp = new Date().toISOString();

  try {
    const health = await getCloudflareTunnelHealth();

    const response = tunnelResponseSchema.parse({
      status: health.online ? "ok" : "unavailable",
      timestamp,
      online: health.online,
      responseTimeMs: health.responseTimeMs,
      message: health.message,
      errors: health.online ? undefined : [health.message],
    });

    return NextResponse.json(response);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Cloudflare Tunnel monitoring unavailable";

    return NextResponse.json(
      tunnelResponseSchema.parse({
        status: "unavailable",
        timestamp,
        online: false,
        errors: [message],
      }),
      { status: 503 }
    );
  }
}
