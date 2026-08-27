import { readdir, readFile } from "fs/promises";
import os from "os";
import { join } from "path";

import si from "systeminformation";

import type { MemoryMetrics, MemoryModule, MemoryNode } from "@/types/metrics";

type ParsedMeminfo = {
  total: number;
  free: number;
  available: number;
  used: number;
  cached: number;
  swapTotal: number;
  swapUsed: number;
};

export async function getMemoryMetrics(): Promise<MemoryMetrics> {
  const mem = (await readHostMeminfo()) ?? fromSysteminformation(await si.mem());
  const usagePercent = mem.total > 0 ? (mem.used / mem.total) * 100 : 0;

  const [nodes, modules] = await Promise.all([
    getMemoryNodes(mem),
    getMemoryModules(),
  ]);

  return {
    total: mem.total,
    used: mem.used,
    available: mem.available,
    cached: mem.cached,
    usagePercent: round(usagePercent),
    swapTotal: mem.swapTotal,
    swapUsed: mem.swapUsed,
    swapUsagePercent:
      mem.swapTotal > 0 ? round((mem.swapUsed / mem.swapTotal) * 100) : 0,
    nodes,
    modules,
  };
}

function fromSysteminformation(
  mem: Awaited<ReturnType<typeof si.mem>>
): ParsedMeminfo {
  // `active` is total - MemAvailable (cache excluded), matching Netdata/htop.
  // `used` from systeminformation is total - MemFree and includes cache.
  const used = mem.active ?? Math.max(0, mem.total - mem.available);
  return {
    total: mem.total,
    free: mem.free,
    available: mem.available,
    used,
    cached: mem.buffcache ?? Math.max(0, mem.total - used - (mem.free ?? 0)),
    swapTotal: mem.swaptotal ?? 0,
    swapUsed: mem.swapused ?? 0,
  };
}

async function getMemoryNodes(mem: ParsedMeminfo): Promise<MemoryNode[]> {
  const numaNodes = await readNumaNodes();

  if (numaNodes.length === 1) {
    return [
      {
        ...numaNodes[0],
        total: mem.total,
        used: mem.used,
        free: mem.available,
        cached: mem.cached,
        usagePercent: mem.total > 0 ? round((mem.used / mem.total) * 100) : 0,
      },
    ];
  }

  if (numaNodes.length > 1) {
    return numaNodes;
  }

  return [
    {
      id: 0,
      name: os.hostname(),
      total: mem.total,
      used: mem.used,
      free: mem.available,
      cached: mem.cached,
      usagePercent: mem.total > 0 ? round((mem.used / mem.total) * 100) : 0,
    },
  ];
}

async function readHostMeminfo(): Promise<ParsedMeminfo | null> {
  for (const path of procMeminfoCandidates()) {
    const parsed = await readFile(path, "utf8")
      .then(parseProcMeminfo)
      .catch(() => null);
    if (parsed) return parsed;
  }
  return null;
}

function procMeminfoCandidates(): string[] {
  const hostRoot = getHostFsRoot();
  const candidates: string[] = [];
  if (hostRoot) {
    candidates.push(join(hostRoot, "proc/meminfo"));
  }
  candidates.push("/proc/meminfo");
  return candidates;
}

function parseProcMeminfo(text: string): ParsedMeminfo | null {
  const values = readMeminfoValues(text, /^([^:]+):\s+(\d+)\s+kB/i);
  return toParsedMeminfo(values);
}

function toParsedMeminfo(values: Map<string, number>): ParsedMeminfo | null {
  const total = values.get("MemTotal") ?? 0;
  if (total <= 0) return null;

  const free = values.get("MemFree") ?? 0;
  const buffers = values.get("Buffers") ?? 0;
  const cached = values.get("Cached") ?? 0;
  const sreclaimable = values.get("SReclaimable") ?? 0;
  const buffcache = buffers + cached + sreclaimable;
  const available =
    values.get("MemAvailable") ?? Math.min(total, free + buffcache);
  const used = Math.max(0, total - available);
  const swapTotal = values.get("SwapTotal") ?? 0;
  const swapFree = values.get("SwapFree") ?? 0;

  return {
    total,
    free,
    available: Math.min(total, available),
    used,
    cached: buffcache,
    swapTotal,
    swapUsed: Math.max(0, swapTotal - swapFree),
  };
}

async function readNumaNodes(): Promise<MemoryNode[]> {
  for (const root of numaRootCandidates()) {
    const nodes = await readNumaNodesFrom(root).catch(() => []);
    if (nodes.length > 0) {
      return nodes;
    }
  }

  return [];
}

function numaRootCandidates(): string[] {
  const hostRoot = getHostFsRoot();
  const candidates: string[] = [];

  if (hostRoot) {
    candidates.push(join(hostRoot, "sys/devices/system/node"));
  }

  candidates.push("/sys/devices/system/node");
  return candidates;
}

function getHostFsRoot(): string {
  const raw = process.env.HOST_FS_ROOT?.trim() ?? "";
  if (!raw || raw === "/") return "";
  return raw.replace(/\/$/, "");
}

async function readNumaNodesFrom(root: string): Promise<MemoryNode[]> {
  const entries = await readdir(root, { withFileTypes: true });
  const dirs = entries
    .filter((entry) => entry.isDirectory() && /^node\d+$/.test(entry.name))
    .map((entry) => entry.name)
    .sort((a, b) => Number(a.slice(4)) - Number(b.slice(4)));

  const nodes: MemoryNode[] = [];

  for (const dir of dirs) {
    const text = await readFile(join(root, dir, "meminfo"), "utf8");
    const parsed = parseNumaMeminfo(text, Number(dir.slice(4)));
    if (parsed) {
      nodes.push(parsed);
    }
  }

  return nodes;
}

function parseNumaMeminfo(text: string, id: number): MemoryNode | null {
  const values = readMeminfoValues(text, /^Node\s+\d+\s+([^:]+):\s+(\d+)\s+kB/i);
  const total = values.get("MemTotal") ?? 0;
  if (total <= 0) return null;

  const free = values.get("MemFree") ?? 0;
  const filePages =
    values.get("FilePages") ??
    (values.get("Active(file)") ?? 0) + (values.get("Inactive(file)") ?? 0);
  const reclaimable =
    values.get("SReclaimable") ?? values.get("KReclaimable") ?? 0;
  const cached = filePages + reclaimable;
  const available = Math.min(total, free + cached);
  const used = Math.max(0, total - available);

  return {
    id,
    name: `Node ${id}`,
    total,
    used,
    free: available,
    cached,
    usagePercent: round((used / total) * 100),
  };
}

function readMeminfoValues(text: string, pattern: RegExp): Map<string, number> {
  const values = new Map<string, number>();

  for (const line of text.split("\n")) {
    const match = line.match(pattern);
    if (!match) continue;
    values.set(match[1].trim(), Number(match[2]) * 1024);
  }

  return values;
}

async function getMemoryModules(): Promise<MemoryModule[]> {
  try {
    const layout = await si.memLayout();
    return layout
      .filter((entry) => entry.size > 0)
      .map((entry) => ({
        bank: entry.bank || "Unknown",
        size: entry.size,
        type: entry.type || "Unknown",
        clockSpeed: entry.clockSpeed ?? null,
        formFactor: entry.formFactor || "",
      }));
  } catch {
    return [];
  }
}

function round(value: number, decimals = 1): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}
