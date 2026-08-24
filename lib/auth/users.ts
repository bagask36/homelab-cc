import { hashPassword } from "@/lib/auth/password";
import { getPrisma, isDatabaseConfigured } from "@/lib/db/prisma";

export async function ensureBootstrapUser(): Promise<void> {
  if (!isDatabaseConfigured()) {
    return;
  }

  const prisma = getPrisma();
  if (!prisma) return;

  try {
    const existing = await prisma.user.count();
    if (existing > 0) {
      return;
    }

    const username = process.env.AUTH_USERNAME?.trim();
    const password = process.env.AUTH_PASSWORD;

    if (!username || !password) {
      console.warn(
        "[auth] No users found. Set AUTH_USERNAME and AUTH_PASSWORD to bootstrap the first account."
      );
      return;
    }

    await prisma.user.create({
      data: {
        username,
        passwordHash: await hashPassword(password),
      },
    });

    console.info(`[auth] Bootstrapped admin user "${username}"`);
  } catch (error) {
    console.error(
      "[auth] Failed to bootstrap user:",
      error instanceof Error ? error.message : error
    );
  }
}

export async function findUserByUsername(username: string) {
  const prisma = getPrisma();
  if (!prisma) return null;

  return prisma.user.findUnique({
    where: { username },
  });
}

export async function updateUserPassword(
  userId: string,
  passwordHash: string
): Promise<void> {
  const prisma = getPrisma();
  if (!prisma) {
    throw new Error("Database is not configured");
  }

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });
}
