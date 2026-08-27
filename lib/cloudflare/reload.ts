import { readdir, readFile } from "node:fs/promises";
import { exec } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);

export type CloudflaredReloadResult = {
  reloaded: boolean;
  message: string;
};

const MANUAL_RESTART_HINT =
  "Restart cloudflared on the host: sudo systemctl restart cloudflared";

/**
 * Reload cloudflared after config.yml is written.
 * - Custom CLOUDFLARE_TUNNEL_RELOAD_CMD if set
 * - Otherwise send SIGHUP to host cloudflared (requires pid: host in compose)
 */
export async function reloadCloudflared(
  reloadCommand: string | null
): Promise<CloudflaredReloadResult> {
  if (reloadCommand) {
    return reloadViaCommand(reloadCommand);
  }

  return reloadViaSignal();
}

async function reloadViaCommand(
  command: string
): Promise<CloudflaredReloadResult> {
  try {
    await execAsync(command, { timeout: 15_000, shell: "/bin/sh" });
    return { reloaded: true, message: "Reloaded cloudflared." };
  } catch (error) {
    const detail =
      error instanceof Error ? error.message : "Reload command failed";

    const isSystemctlInContainer =
      command.includes("systemctl") &&
      (detail.includes("systemctl: not found") ||
        detail.includes("Failed to connect to bus"));

    const hint = isSystemctlInContainer
      ? `Remove CLOUDFLARE_TUNNEL_RELOAD_CMD from .env (Docker has no systemd) or ${MANUAL_RESTART_HINT.toLowerCase()}.`
      : MANUAL_RESTART_HINT;

    return {
      reloaded: false,
      message: `Reload skipped (${detail}). ${hint}`,
    };
  }
}

async function reloadViaSignal(): Promise<CloudflaredReloadResult> {
  const pids = await findCloudflaredPids();

  if (pids.length === 0) {
    return {
      reloaded: false,
      message: `No cloudflared process visible from container. ${MANUAL_RESTART_HINT}.`,
    };
  }

  let signaled = 0;
  for (const pid of pids) {
    try {
      process.kill(pid, "SIGHUP");
      signaled += 1;
    } catch {
      // Process may have exited between scan and signal
    }
  }

  if (signaled === 0) {
    return {
      reloaded: false,
      message: `Could not signal cloudflared. ${MANUAL_RESTART_HINT}.`,
    };
  }

  return {
    reloaded: true,
    message: `Sent reload signal to cloudflared (pid ${pids.join(", ")}). If routes do not update, ${MANUAL_RESTART_HINT.toLowerCase()}.`,
  };
}

async function findCloudflaredPids(): Promise<number[]> {
  const pids: number[] = [];

  let entries: string[];
  try {
    entries = await readdir("/proc");
  } catch {
    return pids;
  }

  for (const entry of entries) {
    if (!/^\d+$/.test(entry)) continue;

    const pid = Number(entry);
    if (!Number.isFinite(pid) || pid <= 1) continue;

    try {
      const comm = (await readFile(`/proc/${pid}/comm`, "utf8")).trim();
      if (comm === "cloudflared") {
        pids.push(pid);
      }
    } catch {
      // Process exited or permission denied
    }
  }

  return pids;
}
