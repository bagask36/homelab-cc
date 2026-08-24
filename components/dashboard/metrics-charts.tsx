"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { DashboardPanel } from "@/components/dashboard/panel";
import { useMetricsHistory } from "@/hooks/useMetricsHistory";
import { formatChartAxisLabel } from "@/lib/monitoring/format";
import type { MetricsHistoryRange } from "@/types/metrics-history";
import type { MetricsHistoryPoint } from "@/types/metrics";

const MAX_LIVE_POINTS = 30;

type MetricsChartsProps = {
  cpu?: number;
  memory?: number;
  timestamp?: string;
  range: MetricsHistoryRange;
};

export function MetricsCharts({
  cpu,
  memory,
  timestamp,
  range,
}: MetricsChartsProps) {
  const liveHistory = useLiveMetricsHistory(cpu, memory, timestamp, range);
  const { data: historyData, error, isLoading } = useMetricsHistory(range);

  const history = useMemo(() => {
    if (range === "live") {
      return liveHistory;
    }

    return (
      historyData?.points.map((point) => ({
        time: formatChartAxisLabel(point.timestamp, range),
        cpu: point.cpu,
        memory: point.memory,
      })) ?? []
    );
  }, [historyData?.points, liveHistory, range]);

  const hasHistory = history.length > 0;
  const isHistoricalLoading =
    range !== "live" && isLoading && !historyData && !error;
  const description =
    range === "live"
      ? "Usage over time (live)"
      : `Usage over the last ${range}`;

  return (
    <section className="grid gap-4 xl:grid-cols-2">
      <DashboardPanel title="CPU Usage" description={description}>
        {hasHistory ? (
          <Chart
            data={history}
            dataKey="cpu"
            color="var(--chart-1)"
            label="CPU %"
          />
        ) : (
          <EmptyChart
            label={
              isHistoricalLoading
                ? "Loading historical CPU data…"
                : range === "live"
                  ? "Collecting CPU samples…"
                  : "No historical CPU data yet"
            }
          />
        )}
      </DashboardPanel>

      <DashboardPanel title="Memory Usage" description={description}>
        {hasHistory ? (
          <Chart
            data={history}
            dataKey="memory"
            color="var(--chart-2)"
            label="Memory %"
          />
        ) : (
          <EmptyChart
            label={
              isHistoricalLoading
                ? "Loading historical memory data…"
                : range === "live"
                  ? "Collecting memory samples…"
                  : "No historical memory data yet"
            }
          />
        )}
      </DashboardPanel>
    </section>
  );
}

function useLiveMetricsHistory(
  cpu: number | undefined,
  memory: number | undefined,
  timestamp: string | undefined,
  range: MetricsHistoryRange
): MetricsHistoryPoint[] {
  const [history, setHistory] = useState<MetricsHistoryPoint[]>([]);

  useEffect(() => {
    if (range !== "live") {
      queueMicrotask(() => setHistory([]));
      return;
    }

    if (cpu === undefined || memory === undefined || !timestamp) return;

    queueMicrotask(() => {
      setHistory((current) => {
        const last = current.at(-1);
        const time = new Date(timestamp).toLocaleTimeString(undefined, {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });

        if (last?.time === time && last.cpu === cpu && last.memory === memory) {
          return current;
        }

        return [...current, { time, cpu, memory }].slice(-MAX_LIVE_POINTS);
      });
    });
  }, [cpu, memory, range, timestamp]);

  return history;
}

type ChartProps = {
  data: MetricsHistoryPoint[];
  dataKey: "cpu" | "memory";
  color: string;
  label: string;
};

function Chart({ data, dataKey, color, label }: ChartProps) {
  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
          <XAxis
            dataKey="time"
            tick={{ fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            minTickGap={24}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            width={36}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip
            contentStyle={{
              background: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              fontSize: "12px",
            }}
            formatter={(value) => [`${Number(value).toFixed(1)}%`, label]}
          />
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-border bg-muted/20">
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
