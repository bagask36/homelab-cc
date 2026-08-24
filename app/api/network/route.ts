import { NextResponse } from "next/server";

import { getNetworkMetrics } from "@/lib/monitoring/network";
import { networkResponseSchema } from "@/types/network";

export const dynamic = "force-dynamic";

export async function GET() {
  const timestamp = new Date().toISOString();

  try {
    const network = await getNetworkMetrics();
    const response = networkResponseSchema.parse({
      status: "ok",
      timestamp,
      totals: network.totals,
      interfaces: network.interfaces,
    });

    return NextResponse.json(response);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Network metrics unavailable";

    return NextResponse.json(
      networkResponseSchema.parse({
        status: "unavailable",
        timestamp,
        errors: [message],
      }),
      { status: 503 }
    );
  }
}
