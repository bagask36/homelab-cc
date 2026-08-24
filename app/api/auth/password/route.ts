import { NextResponse } from "next/server";

import { hashPassword, verifyPassword } from "@/lib/auth/password";
import {
  isSessionUser,
  requireApiSession,
} from "@/lib/auth/require-session";
import { findUserByUsername, updateUserPassword } from "@/lib/auth/users";
import { changePasswordRequestSchema } from "@/types/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await requireApiSession();
  if (!isSessionUser(session)) {
    return session;
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

  const parsed = changePasswordRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        status: "unavailable",
        errors: parsed.error.issues.map((issue) => issue.message),
      },
      { status: 400 }
    );
  }

  const user = await findUserByUsername(session.username);
  if (!user) {
    return NextResponse.json(
      { status: "unavailable", errors: ["User not found"] },
      { status: 404 }
    );
  }

  const currentOk = await verifyPassword(
    parsed.data.currentPassword,
    user.passwordHash
  );

  if (!currentOk) {
    return NextResponse.json(
      { status: "unavailable", errors: ["Current password is incorrect"] },
      { status: 401 }
    );
  }

  await updateUserPassword(
    user.id,
    await hashPassword(parsed.data.newPassword)
  );

  return NextResponse.json({ status: "ok" });
}
