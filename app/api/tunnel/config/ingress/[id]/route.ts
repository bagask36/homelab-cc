import { NextResponse } from "next/server";

import { writeAuditLog } from "@/lib/audit/logger";
import {
  deleteTunnelIngress,
  TunnelConfigError,
  updateTunnelIngress,
} from "@/lib/cloudflare/config";
import {
  isSessionUser,
  requireApiSession,
} from "@/lib/auth/require-session";
import {
  tunnelActionResponseSchema,
  tunnelIngressUpdateSchema,
} from "@/types/tunnel-config";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: Request, context: RouteContext) {
  const session = await requireApiSession();
  if (!isSessionUser(session)) {
    return session;
  }

  const { id } = await context.params;

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

  const parsed = tunnelIngressUpdateSchema.safeParse(body);
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
    const ingress = await updateTunnelIngress(id, parsed.data);
    const label = ingress.hostname ?? ingress.service;

    await writeAuditLog({
      user: session,
      action: "tunnel.ingress.update",
      target: ingress.id,
      targetName: label,
      success: true,
      message: `Updated ingress ${label}`,
    });

    return NextResponse.json(
      tunnelActionResponseSchema.parse({
        status: "ok",
        message: "Ingress rule updated",
        ingress,
      })
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update ingress rule";

    return NextResponse.json(
      tunnelActionResponseSchema.parse({
        status: "unavailable",
        errors: [message],
      }),
      { status: error instanceof TunnelConfigError ? error.status : 500 }
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await requireApiSession();
  if (!isSessionUser(session)) {
    return session;
  }

  const { id } = await context.params;

  try {
    await deleteTunnelIngress(id);

    await writeAuditLog({
      user: session,
      action: "tunnel.ingress.delete",
      target: id,
      success: true,
      message: "Deleted ingress rule",
    });

    return NextResponse.json(
      tunnelActionResponseSchema.parse({
        status: "ok",
        message: "Ingress rule deleted",
      })
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete ingress rule";

    return NextResponse.json(
      tunnelActionResponseSchema.parse({
        status: "unavailable",
        errors: [message],
      }),
      { status: error instanceof TunnelConfigError ? error.status : 500 }
    );
  }
}
