"use client";

import { NetworkChart } from "@/components/dashboard/network-chart";
import { DashboardPanel } from "@/components/dashboard/panel";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { useNetwork } from "@/hooks/useNetwork";
import {
  formatBytesCompact,
  formatBytesPerSecond,
  formatTimestamp,
} from "@/lib/monitoring/format";
import { ActivityIcon, ArrowDownIcon, ArrowUpIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function NetworkOverview() {
  const { data, error, isLoading } = useNetwork();
  const rates = useNetworkRates(
    data?.totals?.rxBytes,
    data?.totals?.txBytes,
    data?.timestamp
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Network</h2>
        <p className="text-sm text-muted-foreground">
          Interface traffic and throughput
        </p>
      </div>

      {error && !data && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Unable to load network metrics. {error.message}
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <SummaryCard
          title="Download"
          value={isLoading && !data ? "…" : formatBytesPerSecond(rates.download)}
          subtitle={`Total ${formatBytesCompact(data?.totals?.rxBytes)}`}
          icon={ArrowDownIcon}
        />
        <SummaryCard
          title="Upload"
          value={isLoading && !data ? "…" : formatBytesPerSecond(rates.upload)}
          subtitle={`Total ${formatBytesCompact(data?.totals?.txBytes)}`}
          icon={ArrowUpIcon}
        />
        <SummaryCard
          title="Interfaces"
          value={
            isLoading && !data
              ? "…"
              : String(data?.interfaces?.length ?? "—")
          }
          subtitle={`Updated ${formatTimestamp(data?.timestamp)}`}
          icon={ActivityIcon}
        />
      </section>

      <NetworkChart
        rxBytes={data?.totals?.rxBytes}
        txBytes={data?.totals?.txBytes}
        timestamp={data?.timestamp}
      />

      <DashboardPanel title="Interfaces" description="Per-interface counters">
        {data?.interfaces && data.interfaces.length > 0 ? (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {data.interfaces.map((iface) => (
              <li
                key={iface.iface}
                className="flex items-center justify-between gap-4 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium">{iface.iface}</p>
                  <p className="text-xs capitalize text-muted-foreground">
                    {iface.operstate}
                  </p>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <p>RX {formatBytesCompact(iface.rxBytes)}</p>
                  <p>TX {formatBytesCompact(iface.txBytes)}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-border bg-muted/20">
            <p className="text-xs text-muted-foreground">
              {isLoading ? "Loading network data…" : "No interface data available"}
            </p>
          </div>
        )}
      </DashboardPanel>
    </div>
  );
}

function useNetworkRates(
  rxBytes?: number,
  txBytes?: number,
  timestamp?: string
) {
  const [rates, setRates] = useState({ download: undefined as number | undefined, upload: undefined as number | undefined });
  const previousRef = useRef<{
    rxBytes: number;
    txBytes: number;
    timestamp: number;
  } | null>(null);

  useEffect(() => {
    if (rxBytes === undefined || txBytes === undefined || !timestamp) return;

    const currentTime = new Date(timestamp).getTime();
    if (!Number.isFinite(currentTime)) return;

    queueMicrotask(() => {
      const previous = previousRef.current;
      previousRef.current = { rxBytes, txBytes, timestamp: currentTime };

      if (!previous) return;

      const elapsedSeconds = (currentTime - previous.timestamp) / 1000;
      if (elapsedSeconds <= 0) return;

      setRates({
        download: Math.max(0, (rxBytes - previous.rxBytes) / elapsedSeconds),
        upload: Math.max(0, (txBytes - previous.txBytes) / elapsedSeconds),
      });
    });
  }, [rxBytes, txBytes, timestamp]);

  return rates;
}
