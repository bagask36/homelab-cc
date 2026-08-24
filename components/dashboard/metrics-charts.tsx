"use client";

import { useEffect, useState } from "react";
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
import type { MetricsHistoryPoint } from "@/types/metrics";

const MAX_POINTS = 30;

type MetricsChartsProps = {
  cpu?: number;
  memory?: number;
  timestamp?: string;
};

export function MetricsCharts({ cpu, memory, timestamp }: MetricsChartsProps) {
  const history = useMetricsHistory(cpu, memory, timestamp);
  const hasHistory = history.length > 0;

  return (
    <section className="grid gap-4 xl:grid-cols-2">
      <DashboardPanel title="CPU Usage" description="Usage over time (live)">
        {hasHistory ? (
          <Chart
            data={history}
            dataKey="cpu"
            color="var(--chart-1)"
            label="CPU %"
          />
        ) : (
          <EmptyChart label="Collecting CPU samples…" />
        )}
      </DashboardPanel>

      <DashboardPanel title="Memory Usage" description="Usage over time (live)">
        {hasHistory ? (
          <Chart
            data={history}
            dataKey="memory"
            color="var(--chart-2)"
            label="Memory %"
          />
        ) : (
          <EmptyChart label="Collecting memory samples…" />
        )}
      </DashboardPanel>
    </section>
  );
}

function useMetricsHistory(
  cpu?: number,
  memory?: number,
  timestamp?: string
): MetricsHistoryPoint[] {
  const [history, setHistory] = useState<MetricsHistoryPoint[]>([]);

  useEffect(() => {
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

        return [...current, { time, cpu, memory }].slice(-MAX_POINTS);
      });
    });
  }, [cpu, memory, timestamp]);

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
