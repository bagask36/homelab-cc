import { NextResponse } from "next/server";

import {
  importTunnelConfigFromFile,
  TunnelConfigError,
} from "@/lib/cloudflare/config";
import {
  isSessionUser,
  requireApiSession,
} from "@/lib/auth/require-session";
import { tunnelActionResponseSchema } from "@/types/tunnel-config";

export const dynamic = "force-dynamic";

export async function POST() {
  const session = await requireApiSession();
  if (!isSessionUser(session)) {
    return session;
  }

  try {
    const result = await importTunnelConfigFromFile(session, true);

    return NextResponse.json(
      tunnelActionResponseSchema.parse({
        status: "ok",
        message: result.message,
      })
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to import tunnel config";

    return NextResponse.json(
      tunnelActionResponseSchema.parse({
        status: "unavailable",
        errors: [message],
      }),
      { status: error instanceof TunnelConfigError ? error.status : 500 }
    );
  }
}
