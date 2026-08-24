import { NextResponse } from "next/server";

import { clearedSessionCookieOptions } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function POST() {
  const response = NextResponse.json({ status: "ok" });
  response.cookies.set(clearedSessionCookieOptions());
  return response;
}
