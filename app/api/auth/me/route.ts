import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth/session";
import { sessionResponseSchema } from "@/types/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      sessionResponseSchema.parse({
        status: "unavailable",
        errors: ["Unauthorized"],
      }),
      { status: 401 }
    );
  }

  return NextResponse.json(
    sessionResponseSchema.parse({
      status: "ok",
      user: {
        id: session.userId,
        username: session.username,
      },
    })
  );
}
