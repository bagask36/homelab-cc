import { NextResponse } from "next/server";

import { getAlerts } from "@/lib/alerts/evaluate";
import { alertsResponseSchema } from "@/types/alert";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const alerts = await getAlerts();
    const validated = alertsResponseSchema.parse(alerts);

    if (validated.status === "unavailable") {
      return NextResponse.json(validated, { status: 503 });
    }

    return NextResponse.json(validated);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to evaluate alerts";

    return NextResponse.json(
      alertsResponseSchema.parse({
        status: "unavailable",
        timestamp: new Date().toISOString(),
        summary: { total: 0, critical: 0, warning: 0 },
        alerts: [],
        errors: [message],
      }),
      { status: 500 }
    );
  }
}
