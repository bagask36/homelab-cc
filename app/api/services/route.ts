import { NextResponse } from "next/server";

import { getServicesHealth } from "@/lib/monitoring/services";
import { servicesResponseSchema } from "@/types/service";

export const dynamic = "force-dynamic";

export async function GET() {
  const timestamp = new Date().toISOString();

  try {
    const services = await getServicesHealth();
    const healthyCount = services.filter(
      (service) => service.status === "healthy"
    ).length;
    const status =
      healthyCount === services.length
        ? "ok"
        : healthyCount > 0
          ? "partial"
          : "partial";

    const response = servicesResponseSchema.parse({
      status,
      timestamp,
      services,
    });

    return NextResponse.json(response);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Service checks unavailable";

    return NextResponse.json(
      servicesResponseSchema.parse({
        status: "unavailable",
        timestamp,
        errors: [message],
      }),
      { status: 503 }
    );
  }
}
