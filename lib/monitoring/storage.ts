import si from "systeminformation";

import type { Filesystem, StorageSummary } from "@/types/storage";

const IGNORED_FS_TYPES = new Set([
  "tmpfs",
  "devtmpfs",
  "overlay",
  "squashfs",
  "proc",
  "sysfs",
  "devpts",
  "cgroup",
  "cgroup2",
  "mqueue",
  "hugetlbfs",
  "securityfs",
  "pstore",
  "debugfs",
  "tracefs",
  "fusectl",
  "configfs",
  "rpc_pipefs",
  "autofs",
]);

const IGNORED_MOUNT_POINTS = new Set([
  "/etc/hostname",
  "/etc/hosts",
  "/etc/resolv.conf",
]);

const IGNORED_DISPLAY_PREFIXES = [
  "/proc",
  "/sys",
  "/dev",
  "/run",
  "/snap",
  "/var/lib/docker",
  "/var/lib/containers",
];

export type StorageMetrics = {
  summary: StorageSummary;
  primary: Filesystem | undefined;
  filesystems: Filesystem[];
};

/**
 * When the dashboard runs in Docker, bind-mount the host root at this path
 * (see docker-compose HOST_FS_ROOT=/host and volumes: /:/host:ro,rslave).
 */
function getHostFsRoot(): string {
  const raw = process.env.HOST_FS_ROOT?.trim() ?? "";
  if (!raw || raw === "/") return "";
  return raw.replace(/\/$/, "");
}

function toDisplayMount(mount: string, hostRoot: string): string {
  if (!hostRoot) return mount;
  if (mount === hostRoot) return "/";
  if (mount.startsWith(`${hostRoot}/`)) {
    return mount.slice(hostRoot.length) || "/";
  }
  return mount;
}

function isHostScoped(mount: string, hostRoot: string): boolean {
  if (!hostRoot) return true;
  return mount === hostRoot || mount.startsWith(`${hostRoot}/`);
}

function isIgnoredDisplayMount(displayMount: string): boolean {
  if (IGNORED_MOUNT_POINTS.has(displayMount)) return true;
  return IGNORED_DISPLAY_PREFIXES.some(
    (prefix) =>
      displayMount === prefix || displayMount.startsWith(`${prefix}/`)
  );
}

export async function getStorageMetrics(): Promise<StorageMetrics> {
  const hostRoot = getHostFsRoot();
  const filesystems = await si.fsSize();

  const mounts: Filesystem[] = filesystems
    .filter((entry) => {
      if (entry.size <= 0) return false;
      if (IGNORED_FS_TYPES.has(entry.type)) return false;
      if (!isHostScoped(entry.mount, hostRoot)) return false;

      const displayMount = toDisplayMount(entry.mount, hostRoot);
      if (isIgnoredDisplayMount(displayMount)) return false;

      return true;
    })
    .map((entry) => ({
      fs: entry.fs,
      type: entry.type,
      mount: toDisplayMount(entry.mount, hostRoot),
      size: entry.size,
      used: entry.used,
      available: entry.available,
      usagePercent: round(entry.use),
    }))
    .sort((a, b) => a.mount.localeCompare(b.mount));

  // Deduplicate by display mount (bind mounts can appear twice)
  const uniqueMounts = dedupeByMount(mounts);

  if (uniqueMounts.length === 0) {
    throw new Error(
      hostRoot
        ? `No storage filesystems available under ${hostRoot}. Ensure the host root is mounted (e.g. /:/host:ro,rslave).`
        : "No storage filesystems available"
    );
  }

  const primary =
    uniqueMounts.find((entry) => entry.mount === "/") ??
    uniqueMounts.find((entry) => entry.mount === "/data") ??
    uniqueMounts[0];

  const total = uniqueMounts.reduce((sum, entry) => sum + entry.size, 0);
  const used = uniqueMounts.reduce((sum, entry) => sum + entry.used, 0);
  const available = uniqueMounts.reduce(
    (sum, entry) => sum + entry.available,
    0
  );

  return {
    summary: {
      total,
      used,
      available,
      usagePercent: total > 0 ? round((used / total) * 100) : 0,
    },
    primary,
    filesystems: uniqueMounts,
  };
}

function dedupeByMount(mounts: Filesystem[]): Filesystem[] {
  const byMount = new Map<string, Filesystem>();
  for (const entry of mounts) {
    const existing = byMount.get(entry.mount);
    if (!existing || entry.size > existing.size) {
      byMount.set(entry.mount, entry);
    }
  }
  return [...byMount.values()].sort((a, b) => a.mount.localeCompare(b.mount));
}

function round(value: number, decimals = 1): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}
