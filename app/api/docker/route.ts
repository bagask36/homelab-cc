import { NextResponse } from "next/server";

import { getDockerMetrics } from "@/lib/docker/containers";
import { dockerResponseSchema } from "@/types/docker";

export const dynamic = "force-dynamic";

export async function GET() {
  const timestamp = new Date().toISOString();

  try {
    const docker = await getDockerMetrics();
    const response = dockerResponseSchema.parse({
      status: "ok",
      timestamp,
      summary: docker.summary,
      containers: docker.containers,
    });

    return NextResponse.json(response);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Docker daemon unavailable";

    return NextResponse.json(
      dockerResponseSchema.parse({
        status: "unavailable",
        timestamp,
        errors: [message],
      }),
      { status: 503 }
    );
  }
}
