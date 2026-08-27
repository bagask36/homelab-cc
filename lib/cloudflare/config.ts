import { access, constants, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

import type { SessionUser } from "@/lib/auth/session";
import { writeAuditLog } from "@/lib/audit/logger";
import { reloadCloudflared } from "@/lib/cloudflare/reload";
import { getPrisma, isDatabaseConfigured } from "@/lib/db/prisma";
import type { TunnelIngress, TunnelSettings } from "@/types/tunnel-config";

export class TunnelConfigError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export type ParsedTunnelFile = {
  tunnelId?: string;
  credentialsFile?: string;
  ingress: Array<{ hostname: string | null; service: string }>;
};

export function getTunnelSettings(): TunnelSettings {
  const configPath =
    process.env.CLOUDFLARE_TUNNEL_CONFIG_PATH?.trim() ||
    "/etc/cloudflared/config.yml";
  const credentialsFile =
    process.env.CLOUDFLARE_TUNNEL_CREDENTIALS_FILE?.trim() ||
    "/etc/cloudflared/credentials.json";
  const tunnelId = process.env.CLOUDFLARE_TUNNEL_ID?.trim() ?? "";
  const reloadCommand =
    process.env.CLOUDFLARE_TUNNEL_RELOAD_CMD?.trim() || null;

  return {
    tunnelId,
    credentialsFile,
    configPath,
    configWritable: false,
    configExists: false,
    reloadCommand,
  };
}

async function refreshConfigAccess(settings: TunnelSettings): Promise<TunnelSettings> {
  try {
    await access(settings.configPath, constants.F_OK);
    settings.configExists = true;
  } catch {
    settings.configExists = false;
  }

  try {
    await access(settings.configPath, constants.W_OK);
    settings.configWritable = true;
  } catch {
    try {
      await access(dirname(settings.configPath), constants.W_OK);
      settings.configWritable = true;
    } catch {
      settings.configWritable = false;
    }
  }

  return settings;
}

function mapIngress(row: {
  id: string;
  hostname: string | null;
  service: string;
  sortOrder: number;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}): TunnelIngress {
  return {
    id: row.id,
    hostname: row.hostname,
    service: row.service,
    sortOrder: row.sortOrder,
    enabled: row.enabled,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listTunnelIngress(): Promise<TunnelIngress[]> {
  const prisma = requirePrisma();
  const rows = await prisma.tunnelIngress.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  return rows.map(mapIngress);
}

export async function createTunnelIngress(input: {
  hostname?: string;
  service: string;
  enabled?: boolean;
}): Promise<TunnelIngress> {
  const prisma = requirePrisma();
  const maxOrder = await prisma.tunnelIngress.aggregate({
    _max: { sortOrder: true },
  });

  const row = await prisma.tunnelIngress.create({
    data: {
      hostname: input.hostname ?? null,
      service: input.service,
      enabled: input.enabled ?? true,
      sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
    },
  });

  return mapIngress(row);
}

export async function updateTunnelIngress(
  id: string,
  input: Partial<{ hostname?: string; service: string; enabled: boolean }>
): Promise<TunnelIngress> {
  const prisma = requirePrisma();
  const existing = await prisma.tunnelIngress.findUnique({ where: { id } });
  if (!existing) {
    throw new TunnelConfigError("Ingress rule not found", 404);
  }

  const row = await prisma.tunnelIngress.update({
    where: { id },
    data: {
      ...(input.hostname !== undefined
        ? { hostname: input.hostname || null }
        : {}),
      ...(input.service !== undefined ? { service: input.service } : {}),
      ...(input.enabled !== undefined ? { enabled: input.enabled } : {}),
    },
  });

  return mapIngress(row);
}

export async function deleteTunnelIngress(id: string): Promise<void> {
  const prisma = requirePrisma();
  const existing = await prisma.tunnelIngress.findUnique({ where: { id } });
  if (!existing) {
    throw new TunnelConfigError("Ingress rule not found", 404);
  }
  await prisma.tunnelIngress.delete({ where: { id } });
}

export function buildConfigYaml(
  settings: Pick<TunnelSettings, "tunnelId" | "credentialsFile">,
  ingress: TunnelIngress[]
): string {
  const enabledRules = ingress.filter((rule) => rule.enabled);
  const withCatchAll = ensureCatchAllRule(enabledRules);

  const lines: string[] = [];

  if (settings.tunnelId) {
    lines.push(`tunnel: ${settings.tunnelId}`);
  }
  lines.push(`credentials-file: ${settings.credentialsFile}`);
  lines.push("", "ingress:");

  for (const rule of withCatchAll) {
    if (rule.hostname) {
      lines.push(`  - hostname: ${rule.hostname}`);
      lines.push(`    service: ${rule.service}`);
    } else {
      lines.push(`  - service: ${rule.service}`);
    }
  }

  return `${lines.join("\n")}\n`;
}

function ensureCatchAllRule(rules: TunnelIngress[]): TunnelIngress[] {
  const hostnameRules = rules.filter((rule) => rule.hostname);
  const catchAll = rules.find((rule) => !rule.hostname);

  if (catchAll) {
    return [...hostnameRules, catchAll];
  }

  return [
    ...hostnameRules,
    {
      id: "catch-all",
      hostname: null,
      service: "http_status:404",
      sortOrder: 9999,
      enabled: true,
      createdAt: "",
      updatedAt: "",
    },
  ];
}

export function parseTunnelConfigYaml(content: string): ParsedTunnelFile {
  const lines = content.split(/\r?\n/);
  const result: ParsedTunnelFile = { ingress: [] };

  let inIngress = false;
  let current: { hostname: string | null; service: string } | null = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    if (!inIngress) {
      if (line.startsWith("tunnel:")) {
        result.tunnelId = line.slice("tunnel:".length).trim();
      } else if (line.startsWith("credentials-file:")) {
        result.credentialsFile = line.slice("credentials-file:".length).trim();
      } else if (line === "ingress:") {
        inIngress = true;
      }
      continue;
    }

    if (line.startsWith("- hostname:")) {
      if (current) result.ingress.push(current);
      current = {
        hostname: line.slice("- hostname:".length).trim(),
        service: "",
      };
      continue;
    }

    if (line.startsWith("- service:")) {
      if (current) result.ingress.push(current);
      current = {
        hostname: null,
        service: line.slice("- service:".length).trim(),
      };
      continue;
    }

    if (line.startsWith("service:") && current) {
      current.service = line.slice("service:".length).trim();
    }
  }

  if (current) {
    result.ingress.push(current);
  }

  return {
    ...result,
    ingress: result.ingress.filter((rule) => rule.service.length > 0),
  };
}

export async function readTunnelConfigFile(): Promise<string | null> {
  const settings = await refreshConfigAccess(getTunnelSettings());
  if (!settings.configExists) return null;

  try {
    return await readFile(settings.configPath, "utf8");
  } catch {
    return null;
  }
}

export async function applyTunnelConfig(user: SessionUser): Promise<{
  message: string;
  configPath: string;
}> {
  const settings = await refreshConfigAccess(getTunnelSettings());

  if (!settings.configWritable) {
    throw new TunnelConfigError(
      `Config path is not writable: ${settings.configPath}. Mount it in docker-compose (see README).`,
      503
    );
  }

  if (!settings.tunnelId) {
    throw new TunnelConfigError(
      "Set CLOUDFLARE_TUNNEL_ID in environment before applying config",
      400
    );
  }

  const ingress = await listTunnelIngress();
  const yaml = buildConfigYaml(settings, ingress);

  try {
    if (settings.configExists) {
      await writeFile(`${settings.configPath}.bak`, await readFile(settings.configPath, "utf8"), "utf8");
    }
    await writeFile(settings.configPath, yaml, "utf8");
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to write config file";
    await writeAuditLog({
      user,
      action: "tunnel.config.apply",
      target: settings.configPath,
      success: false,
      message,
    });
    throw new TunnelConfigError(message, 500);
  }

  const reload = await reloadCloudflared(settings.reloadCommand);
  const message = reload.reloaded
    ? `Wrote ${settings.configPath}. ${reload.message}`
    : `Wrote ${settings.configPath}. ${reload.message}`;

  await writeAuditLog({
    user,
    action: "tunnel.config.apply",
    target: settings.configPath,
    success: true,
    message,
  });

  return { message, configPath: settings.configPath };
}

export async function importTunnelConfigFromFile(
  user: SessionUser,
  replace = true
): Promise<{ message: string; imported: number }> {
  const content = await readTunnelConfigFile();
  if (!content) {
    throw new TunnelConfigError("Config file not found or unreadable", 404);
  }

  const parsed = parseTunnelConfigYaml(content);
  if (parsed.ingress.length === 0) {
    throw new TunnelConfigError("No ingress rules found in config file", 400);
  }

  const prisma = requirePrisma();

  if (replace) {
    await prisma.tunnelIngress.deleteMany();
  }

  await prisma.tunnelIngress.createMany({
    data: parsed.ingress.map((rule, index) => ({
      hostname: rule.hostname,
      service: rule.service,
      sortOrder: index,
      enabled: true,
    })),
  });

  const message = `Imported ${parsed.ingress.length} ingress rule(s) from config file`;

  await writeAuditLog({
    user,
    action: "tunnel.config.import",
    target: getTunnelSettings().configPath,
    success: true,
    message,
  });

  return { message, imported: parsed.ingress.length };
}

export async function getTunnelConfigSnapshot() {
  const settings = await refreshConfigAccess(getTunnelSettings());
  const ingress = await listTunnelIngress().catch(() => []);
  const configPreview = buildConfigYaml(settings, ingress);

  return {
    settings,
    ingress,
    configPreview,
  };
}

function requirePrisma() {
  if (!isDatabaseConfigured()) {
    throw new TunnelConfigError("Database is not configured", 503);
  }
  const prisma = getPrisma();
  if (!prisma) {
    throw new TunnelConfigError("Database unavailable", 503);
  }
  return prisma;
}
