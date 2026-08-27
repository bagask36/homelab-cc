import { readdir, readFile } from "fs/promises";
import os from "os";
import { join } from "path";

import si from "systeminformation";

import type { MemoryMetrics, MemoryModule, MemoryNode } from "@/types/metrics";

export async function getMemoryMetrics(): Promise<MemoryMetrics> {
  const mem = await si.mem();
  const usagePercent = mem.total > 0 ? (mem.used / mem.total) * 100 : 0;
  const swapTotal = mem.swaptotal ?? 0;
  const swapUsed = mem.swapused ?? 0;

  const [nodes, modules] = await Promise.all([
    getMemoryNodes(mem),
    getMemoryModules(),
  ]);

  return {
    total: mem.total,
    used: mem.used,
    available: mem.available,
    usagePercent: round(usagePercent),
    swapTotal,
    swapUsed,
    swapUsagePercent:
      swapTotal > 0 ? round((swapUsed / swapTotal) * 100) : 0,
    nodes,
    modules,
  };
}

async function getMemoryNodes(
  mem: Awaited<ReturnType<typeof si.mem>>
): Promise<MemoryNode[]> {
  const numaNodes = await readNumaNodes();
  if (numaNodes.length > 0) {
    return numaNodes;
  }

  return [
    {
      id: 0,
      name: os.hostname(),
      total: mem.total,
      used: mem.used,
      free: mem.available,
      usagePercent: mem.total > 0 ? round((mem.used / mem.total) * 100) : 0,
    },
  ];
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
  const values = new Map<string, number>();

  for (const line of text.split("\n")) {
    const match = line.match(/^Node\s+\d+\s+(\w+):\s+(\d+)\s+kB/i);
    if (!match) continue;
    values.set(match[1], Number(match[2]) * 1024);
  }

  const total = values.get("MemTotal") ?? 0;
  if (total <= 0) return null;

  const free = values.get("MemFree") ?? 0;
  const used = values.get("MemUsed") ?? Math.max(0, total - free);

  return {
    id,
    name: `Node ${id}`,
    total,
    used,
    free,
    usagePercent: round((used / total) * 100),
  };
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
