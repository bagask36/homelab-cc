import { NextResponse } from "next/server";

import {
  getTunnelConfigSnapshot,
  TunnelConfigError,
} from "@/lib/cloudflare/config";
import { tunnelConfigResponseSchema } from "@/types/tunnel-config";

export const dynamic = "force-dynamic";

export async function GET() {
  const timestamp = new Date().toISOString();

  try {
    const snapshot = await getTunnelConfigSnapshot();

    return NextResponse.json(
      tunnelConfigResponseSchema.parse({
        status: "ok",
        timestamp,
        settings: snapshot.settings,
        ingress: snapshot.ingress,
        configPreview: snapshot.configPreview,
      })
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load tunnel config";

    return NextResponse.json(
      tunnelConfigResponseSchema.parse({
        status: "unavailable",
        timestamp,
        errors: [message],
      }),
      { status: error instanceof TunnelConfigError ? error.status : 503 }
    );
  }
}
