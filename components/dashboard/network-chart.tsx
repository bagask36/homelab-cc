"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { DashboardPanel } from "@/components/dashboard/panel";
import { useMetricsHistory } from "@/hooks/useMetricsHistory";
import {
  formatBytesPerSecond,
  formatChartAxisLabel,
} from "@/lib/monitoring/format";
import type { MetricsHistoryRange } from "@/types/metrics-history";
import type { NetworkHistoryPoint } from "@/types/network";

const MAX_LIVE_POINTS = 30;

type NetworkChartProps = {
  rxBytes?: number;
  txBytes?: number;
  timestamp?: string;
  className?: string;
  range?: MetricsHistoryRange;
};

export function NetworkChart({
  rxBytes,
  txBytes,
  timestamp,
  className,
  range = "live",
}: NetworkChartProps) {
  const liveHistory = useLiveNetworkHistory(rxBytes, txBytes, timestamp, range);
  const { data: historyData, error, isLoading } = useMetricsHistory(range);

  const history = useMemo(() => {
    if (range === "live") {
      return liveHistory;
    }

    return (
      historyData?.points
        .filter(
          (point) =>
            point.networkRxRate !== undefined &&
            point.networkTxRate !== undefined
        )
        .map((point) => ({
          time: formatChartAxisLabel(point.timestamp, range),
          download: point.networkRxRate!,
          upload: point.networkTxRate!,
        })) ?? []
    );
  }, [historyData?.points, liveHistory, range]);

  const latest = history.at(-1);
  const isHistoricalLoading =
    range !== "live" && isLoading && !historyData && !error;
  const description =
    range === "live"
      ? "Download and upload throughput"
      : `Throughput over the last ${range}`;

  return (
    <DashboardPanel
      title="Network Traffic"
      description={description}
      className={className}
    >
      {history.length > 0 ? (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span>
              Download:{" "}
              <span className="font-mono text-foreground">
                {formatBytesPerSecond(latest?.download)}
              </span>
            </span>
            <span>
              Upload:{" "}
              <span className="font-mono text-foreground">
                {formatBytesPerSecond(latest?.upload)}
              </span>
            </span>
          </div>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={history}
                margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-border/50"
                />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={24}
                />
                <YAxis
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  width={48}
                  tickFormatter={(value) =>
                    formatBytesPerSecond(Number(value))
                  }
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  formatter={(value, name) => [
                    formatBytesPerSecond(Number(value)),
                    name === "download" ? "Download" : "Upload",
                  ]}
                />
                <Legend
                  verticalAlign="top"
                  height={24}
                  formatter={(value) =>
                    value === "download" ? "Download" : "Upload"
                  }
                />
                <Line
                  type="monotone"
                  dataKey="download"
                  stroke="var(--chart-1)"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="upload"
                  stroke="var(--chart-3)"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-border bg-muted/20">
          <p className="text-xs text-muted-foreground">
            {isHistoricalLoading
              ? "Loading historical network data…"
              : range === "live"
                ? "Collecting network samples…"
                : "No historical network data yet"}
          </p>
        </div>
      )}
    </DashboardPanel>
  );
}

function useLiveNetworkHistory(
  rxBytes: number | undefined,
  txBytes: number | undefined,
  timestamp: string | undefined,
  range: MetricsHistoryRange
): NetworkHistoryPoint[] {
  const [history, setHistory] = useState<NetworkHistoryPoint[]>([]);
  const previousRef = useRef<{
    rxBytes: number;
    txBytes: number;
    timestamp: number;
  } | null>(null);

  useEffect(() => {
    if (range !== "live") {
      queueMicrotask(() => {
        setHistory([]);
        previousRef.current = null;
      });
      return;
    }

    if (rxBytes === undefined || txBytes === undefined || !timestamp) return;

    const currentTime = new Date(timestamp).getTime();
    if (!Number.isFinite(currentTime)) return;

    queueMicrotask(() => {
      const previous = previousRef.current;
      previousRef.current = { rxBytes, txBytes, timestamp: currentTime };

      if (!previous) return;

      const elapsedSeconds = (currentTime - previous.timestamp) / 1000;
      if (elapsedSeconds <= 0) return;

      const download = Math.max(
        0,
        (rxBytes - previous.rxBytes) / elapsedSeconds
      );
      const upload = Math.max(
        0,
        (txBytes - previous.txBytes) / elapsedSeconds
      );
      const time = new Date(timestamp).toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

      setHistory((current) => {
        const last = current.at(-1);
        if (
          last?.time === time &&
          last.download === download &&
          last.upload === upload
        ) {
          return current;
        }

        return [...current, { time, download, upload }].slice(-MAX_LIVE_POINTS);
      });
    });
  }, [range, rxBytes, timestamp, txBytes]);

  return history;
}
