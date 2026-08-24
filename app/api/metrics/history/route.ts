import { NextResponse } from "next/server";

import { getMetricsHistory } from "@/lib/db/history";
import { getPrisma, isDatabaseConfigured } from "@/lib/db/prisma";
import {
  metricsHistoryRangeSchema,
  metricsHistoryResponseSchema,
} from "@/types/metrics-history";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rangeParam = searchParams.get("range") ?? "1h";
  const parsedRange = metricsHistoryRangeSchema.safeParse(rangeParam);

  if (!parsedRange.success || parsedRange.data === "live") {
    return NextResponse.json(
      metricsHistoryResponseSchema.parse({
        status: "unavailable",
        range: "1h",
        points: [],
        errors: ["Invalid history range"],
      }),
      { status: 400 }
    );
  }

  const range = parsedRange.data;

  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      metricsHistoryResponseSchema.parse({
        status: "unavailable",
        range,
        points: [],
        errors: ["Database is not configured"],
      }),
      { status: 503 }
    );
  }

  const prisma = getPrisma();
  if (!prisma) {
    return NextResponse.json(
      metricsHistoryResponseSchema.parse({
        status: "unavailable",
        range,
        points: [],
        errors: ["Database client unavailable"],
      }),
      { status: 503 }
    );
  }

  try {
    const points = await getMetricsHistory(prisma, range);

    return NextResponse.json(
      metricsHistoryResponseSchema.parse({
        status: "ok",
        range,
        points,
      })
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load history";

    return NextResponse.json(
      metricsHistoryResponseSchema.parse({
        status: "unavailable",
        range,
        points: [],
        errors: [message],
      }),
      { status: 500 }
    );
  }
}
