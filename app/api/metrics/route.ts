import { NextResponse } from "next/server";

import { getSystemMetrics } from "@/lib/monitoring/system";
import { metricsResponseSchema } from "@/types/metrics";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const metrics = await getSystemMetrics();
    const validated = metricsResponseSchema.parse(metrics);

    if (validated.status === "unavailable") {
      return NextResponse.json(validated, { status: 503 });
    }

    return NextResponse.json(validated);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to collect metrics";

    return NextResponse.json(
      {
        status: "unavailable" as const,
        timestamp: new Date().toISOString(),
        hostname: "unknown",
        uptime: 0,
        errors: [message],
      },
      { status: 500 }
    );
  }
}
