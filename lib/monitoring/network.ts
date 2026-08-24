import si from "systeminformation";

import type { NetworkInterface, NetworkTotals } from "@/types/network";

const IGNORED_INTERFACE_PREFIXES = ["lo", "docker", "br-", "veth", "cni", "flannel"];

export type NetworkMetrics = {
  totals: NetworkTotals;
  interfaces: NetworkInterface[];
};

export async function getNetworkMetrics(): Promise<NetworkMetrics> {
  const stats = await si.networkStats();

  const interfaces: NetworkInterface[] = stats
    .filter((entry) => !shouldIgnoreInterface(entry.iface))
    .map((entry) => ({
      iface: entry.iface,
      operstate: entry.operstate,
      rxBytes: entry.rx_bytes,
      txBytes: entry.tx_bytes,
    }))
    .sort((a, b) => a.iface.localeCompare(b.iface));

  if (interfaces.length === 0) {
    throw new Error("No network interfaces available");
  }

  const totals = interfaces.reduce(
    (acc, entry) => ({
      rxBytes: acc.rxBytes + entry.rxBytes,
      txBytes: acc.txBytes + entry.txBytes,
    }),
    { rxBytes: 0, txBytes: 0 }
  );

  return { totals, interfaces };
}

function shouldIgnoreInterface(name: string): boolean {
  return IGNORED_INTERFACE_PREFIXES.some(
    (prefix) => name === prefix || name.startsWith(`${prefix}`)
  );
}
