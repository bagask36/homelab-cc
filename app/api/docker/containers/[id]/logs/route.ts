import { NextResponse } from "next/server";

import {
  isSessionUser,
  requireApiSession,
} from "@/lib/auth/require-session";
import {
  ContainerControlError,
  getContainerLogsForUser,
} from "@/lib/docker/control";
import { containerLogsResponseSchema } from "@/types/docker-control";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const session = await requireApiSession();
  if (!isSessionUser(session)) {
    return session;
  }

  const { id } = await context.params;
  const { searchParams } = new URL(request.url);
  const tailParam = Number(searchParams.get("tail") ?? "100");
  const tail =
    Number.isFinite(tailParam) && tailParam > 0
      ? Math.min(tailParam, 500)
      : 100;

  try {
    const result = await getContainerLogsForUser(id, session, tail);

    return NextResponse.json(
      containerLogsResponseSchema.parse({
        status: "ok",
        containerId: result.containerId,
        containerName: result.containerName,
        logs: result.logs,
      })
    );
  } catch (error) {
    if (error instanceof ContainerControlError) {
      return NextResponse.json(
        containerLogsResponseSchema.parse({
          status: "unavailable",
          containerId: id,
          containerName: id,
          logs: "",
          errors: [error.message],
        }),
        { status: error.status }
      );
    }

    const message =
      error instanceof Error ? error.message : "Failed to fetch container logs";

    return NextResponse.json(
      containerLogsResponseSchema.parse({
        status: "unavailable",
        containerId: id,
        containerName: id,
        logs: "",
        errors: [message],
      }),
      { status: 500 }
    );
  }
}
