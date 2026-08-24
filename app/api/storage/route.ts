import { NextResponse } from "next/server";

import { getStorageMetrics } from "@/lib/monitoring/storage";
import { storageResponseSchema } from "@/types/storage";

export const dynamic = "force-dynamic";

export async function GET() {
  const timestamp = new Date().toISOString();

  try {
    const storage = await getStorageMetrics();
    const response = storageResponseSchema.parse({
      status: "ok",
      timestamp,
      summary: storage.summary,
      primary: storage.primary,
      filesystems: storage.filesystems,
    });

    return NextResponse.json(response);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Storage metrics unavailable";

    return NextResponse.json(
      storageResponseSchema.parse({
        status: "unavailable",
        timestamp,
        errors: [message],
      }),
      { status: 503 }
    );
  }
}
