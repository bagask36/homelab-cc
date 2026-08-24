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

export type StorageMetrics = {
  summary: StorageSummary;
  primary: Filesystem | undefined;
  filesystems: Filesystem[];
};

const IGNORED_MOUNT_POINTS = new Set([
  "/etc/hostname",
  "/etc/hosts",
  "/etc/resolv.conf",
]);

export async function getStorageMetrics(): Promise<StorageMetrics> {
  const filesystems = await si.fsSize();

  const mounts: Filesystem[] = filesystems
    .filter(
      (entry) =>
        entry.size > 0 &&
        !IGNORED_FS_TYPES.has(entry.type) &&
        !IGNORED_MOUNT_POINTS.has(entry.mount)
    )
    .map((entry) => ({
      fs: entry.fs,
      type: entry.type,
      mount: entry.mount,
      size: entry.size,
      used: entry.used,
      available: entry.available,
      usagePercent: round(entry.use),
    }))
    .sort((a, b) => a.mount.localeCompare(b.mount));

  if (mounts.length === 0) {
    throw new Error("No storage filesystems available");
  }

  const primary =
    mounts.find((entry) => entry.mount === "/") ??
    mounts.find((entry) => entry.mount === "/data") ??
    mounts[0];

  const total = mounts.reduce((sum, entry) => sum + entry.size, 0);
  const used = mounts.reduce((sum, entry) => sum + entry.used, 0);
  const available = mounts.reduce((sum, entry) => sum + entry.available, 0);

  return {
    summary: {
      total,
      used,
      available,
      usagePercent: total > 0 ? round((used / total) * 100) : 0,
    },
    primary,
    filesystems: mounts,
  };
}

function round(value: number, decimals = 1): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}
