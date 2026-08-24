import { NextResponse } from "next/server";

import {
  checkLoginRateLimit,
  clearLoginRateLimit,
} from "@/lib/auth/rate-limit";
import { verifyPassword } from "@/lib/auth/password";
import {
  createSessionToken,
  isAuthConfigured,
  sessionCookieOptions,
} from "@/lib/auth/session";
import { ensureBootstrapUser, findUserByUsername } from "@/lib/auth/users";
import { isDatabaseConfigured } from "@/lib/db/prisma";
import { loginRequestSchema } from "@/types/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isAuthConfigured()) {
    return NextResponse.json(
      { status: "unavailable", errors: ["AUTH_SECRET is not configured"] },
      { status: 503 }
    );
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { status: "unavailable", errors: ["Database is not configured"] },
      { status: 503 }
    );
  }

  const clientKey =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  const rate = checkLoginRateLimit(clientKey);
  if (!rate.allowed) {
    return NextResponse.json(
      {
        status: "unavailable",
        errors: [
          `Too many login attempts. Try again in ${rate.retryAfterSeconds}s`,
        ],
      },
      {
        status: 429,
        headers: rate.retryAfterSeconds
          ? { "Retry-After": String(rate.retryAfterSeconds) }
          : undefined,
      }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { status: "unavailable", errors: ["Invalid JSON body"] },
      { status: 400 }
    );
  }

  const parsed = loginRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        status: "unavailable",
        errors: parsed.error.issues.map((issue) => issue.message),
      },
      { status: 400 }
    );
  }

  await ensureBootstrapUser();

  const user = await findUserByUsername(parsed.data.username);
  const passwordOk =
    user !== null &&
    (await verifyPassword(parsed.data.password, user.passwordHash));

  if (!passwordOk) {
    return NextResponse.json(
      { status: "unavailable", errors: ["Invalid username or password"] },
      { status: 401 }
    );
  }

  const token = await createSessionToken({
    userId: user.id,
    username: user.username,
  });

  if (!token) {
    return NextResponse.json(
      { status: "unavailable", errors: ["Failed to create session"] },
      { status: 500 }
    );
  }

  clearLoginRateLimit(clientKey);

  const response = NextResponse.json({
    status: "ok",
    user: { id: user.id, username: user.username },
  });

  response.cookies.set(sessionCookieOptions(token));
  return response;
}
