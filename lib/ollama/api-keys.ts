import { createHash, randomBytes } from "node:crypto";

import { getPrisma, isDatabaseConfigured } from "@/lib/db/prisma";
import type { ApiKey } from "@/types/api-key";

export class ApiKeyError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export type VerifiedApiKey = {
  id: string;
  name: string;
  model: string | null;
};

const TOKEN_PREFIX = "hcc_";

function requirePrisma() {
  if (!isDatabaseConfigured()) {
    throw new ApiKeyError("Database is not configured", 503);
  }
  const prisma = getPrisma();
  if (!prisma) {
    throw new ApiKeyError("Database unavailable", 503);
  }
  return prisma;
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function mapKey(row: {
  id: string;
  name: string;
  keyPrefix: string;
  model: string | null;
  createdAt: Date;
  lastUsedAt: Date | null;
}): ApiKey {
  return {
    id: row.id,
    name: row.name,
    keyPrefix: row.keyPrefix,
    model: row.model,
    createdAt: row.createdAt.toISOString(),
    lastUsedAt: row.lastUsedAt?.toISOString() ?? null,
  };
}

export async function listApiKeys(): Promise<ApiKey[]> {
  const prisma = requirePrisma();
  const rows = await prisma.apiKey.findMany({
    where: { revokedAt: null },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(mapKey);
}

export async function createApiKey(input: {
  name: string;
  model?: string;
}): Promise<{ key: ApiKey; token: string }> {
  const prisma = requirePrisma();
  const token = `${TOKEN_PREFIX}${randomBytes(24).toString("base64url")}`;

  const row = await prisma.apiKey.create({
    data: {
      name: input.name,
      model: input.model ?? null,
      keyPrefix: token.slice(0, 12),
      keyHash: hashToken(token),
    },
  });

  return { key: mapKey(row), token };
}

export async function revokeApiKey(id: string): Promise<void> {
  const prisma = requirePrisma();
  const existing = await prisma.apiKey.findUnique({ where: { id } });
  if (!existing || existing.revokedAt) {
    throw new ApiKeyError("API key not found", 404);
  }

  await prisma.apiKey.update({
    where: { id },
    data: { revokedAt: new Date() },
  });
}

export async function verifyApiKey(
  token: string
): Promise<VerifiedApiKey | null> {
  const trimmed = token.trim();
  if (!trimmed.startsWith(TOKEN_PREFIX) || trimmed.length < 20) {
    return null;
  }

  if (!isDatabaseConfigured()) {
    return null;
  }
  const prisma = getPrisma();
  if (!prisma) {
    return null;
  }

  const row = await prisma.apiKey.findUnique({
    where: { keyHash: hashToken(trimmed) },
  });

  if (!row || row.revokedAt) {
    return null;
  }

  return { id: row.id, name: row.name, model: row.model };
}

export async function touchApiKeyLastUsed(id: string): Promise<void> {
  const prisma = getPrisma();
  if (!prisma) return;

  try {
    await prisma.apiKey.update({
      where: { id },
      data: { lastUsedAt: new Date() },
    });
  } catch {
    // Non-critical; ignore stale/revoked keys
  }
}
