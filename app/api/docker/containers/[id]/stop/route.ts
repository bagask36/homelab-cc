import { NextResponse } from "next/server";

import {
  isSessionUser,
  requireApiSession,
} from "@/lib/auth/require-session";
import {
  ContainerControlError,
  performContainerAction,
} from "@/lib/docker/control";
import { containerActionRequestSchema } from "@/types/docker-control";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
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
      { status: "unavailable", errors: ["Invalid JSON body"] },
      { status: 400 }
    );
  }

  const parsed = containerActionRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        status: "unavailable",
        errors: parsed.error.issues.map((issue) => issue.message),
      },
      { status: 400 }
    );
  }

  try {
    const result = await performContainerAction(
      "container.stop",
      id,
      session,
      parsed.data
    );

    return NextResponse.json({ status: "ok", message: result.message });
  } catch (error) {
    if (error instanceof ContainerControlError) {
      return NextResponse.json(
        { status: "unavailable", errors: [error.message] },
        { status: error.status }
      );
    }

    const message =
      error instanceof Error ? error.message : "Failed to stop container";

    return NextResponse.json(
      { status: "unavailable", errors: [message] },
      { status: 500 }
    );
  }
}
