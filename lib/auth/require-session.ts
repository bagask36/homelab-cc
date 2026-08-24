import { NextResponse } from "next/server";

import { getSession, type SessionUser } from "@/lib/auth/session";

export async function requireApiSession(): Promise<
  SessionUser | NextResponse
> {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      { status: "unavailable", errors: ["Unauthorized"] },
      { status: 401 }
    );
  }

  return session;
}

export function isSessionUser(
  value: SessionUser | NextResponse
): value is SessionUser {
  return !(value instanceof NextResponse);
}
