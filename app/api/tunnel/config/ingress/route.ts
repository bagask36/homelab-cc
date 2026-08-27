import { NextResponse } from "next/server";

import { writeAuditLog } from "@/lib/audit/logger";
import {
  createTunnelIngress,
  TunnelConfigError,
} from "@/lib/cloudflare/config";
import {
  isSessionUser,
  requireApiSession,
} from "@/lib/auth/require-session";
import {
  tunnelActionResponseSchema,
  tunnelIngressInputSchema,
} from "@/types/tunnel-config";

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
      tunnelActionResponseSchema.parse({
        status: "unavailable",
        errors: ["Invalid JSON body"],
      }),
      { status: 400 }
    );
  }

  const parsed = tunnelIngressInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      tunnelActionResponseSchema.parse({
        status: "unavailable",
        errors: parsed.error.issues.map((issue) => issue.message),
      }),
      { status: 400 }
    );
  }

  try {
    const ingress = await createTunnelIngress(parsed.data);
    const label = ingress.hostname ?? ingress.service;

    await writeAuditLog({
      user: session,
      action: "tunnel.ingress.create",
      target: ingress.id,
      targetName: label,
      success: true,
      message: `Added ingress ${label} → ${ingress.service}`,
    });

    return NextResponse.json(
      tunnelActionResponseSchema.parse({
        status: "ok",
        message: "Ingress rule added",
        ingress,
      })
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to add ingress rule";

    await writeAuditLog({
      user: session,
      action: "tunnel.ingress.create",
      target: "tunnel-ingress",
      success: false,
      message,
    });

    return NextResponse.json(
      tunnelActionResponseSchema.parse({
        status: "unavailable",
        errors: [message],
      }),
      { status: error instanceof TunnelConfigError ? error.status : 500 }
    );
  }
}
