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
import { MemoryNodeList } from "@/components/memory/memory-node-list";
import { useMetricsHistory } from "@/hooks/useMetricsHistory";
import { formatChartAxisLabel } from "@/lib/monitoring/format";
import type { MetricsHistoryRange } from "@/types/metrics-history";
import type { MemoryNode, MetricsHistoryPoint } from "@/types/metrics";

const MAX_LIVE_POINTS = 30;
const NODE_CHART_COLORS = [
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-1)",
];

type MetricsChartsProps = {
  cpu?: number;
  memory?: number;
  nodes?: MemoryNode[];
  timestamp?: string;
  range: MetricsHistoryRange;
};

export function MetricsCharts({
  cpu,
  memory,
  nodes,
  timestamp,
  range,
}: MetricsChartsProps) {
  const liveHistory = useLiveMetricsHistory(
    cpu,
    memory,
    nodes,
    timestamp,
    range
  );
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

  const memorySeries = useMemo(() => {
    const series: ChartSeries[] = [
      { dataKey: "memory", color: "var(--chart-2)", label: "Total" },
    ];

    if (range === "live" && nodes && nodes.length > 1) {
      for (const [index, node] of nodes.entries()) {
        series.push({
          dataKey: nodeSeriesKey(node.id),
          color: NODE_CHART_COLORS[index % NODE_CHART_COLORS.length],
          label: node.name,
        });
      }
    }

    return series;
  }, [nodes, range]);

  return (
    <section className="grid gap-4 xl:grid-cols-2">
      <DashboardPanel title="CPU Usage" description={description}>
        {hasHistory ? (
          <Chart
            data={history}
            series={[
              { dataKey: "cpu", color: "var(--chart-1)", label: "CPU %" },
            ]}
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

      <DashboardPanel
        title="Memory Usage"
        description={
          range === "live" && nodes && nodes.length > 1
            ? "Usage over time (live), per node"
            : description
        }
      >
        {hasHistory ? (
          <Chart data={history} series={memorySeries} />
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
        {nodes && nodes.length > 0 && (
          <div className="mt-4">
            <MemoryNodeList nodes={nodes} />
          </div>
        )}
      </DashboardPanel>
    </section>
  );
}

function nodeSeriesKey(id: number): string {
  return `node_${id}`;
}

function nodeUsageFingerprint(nodes: MemoryNode[] | undefined): string {
  if (!nodes?.length) return "";
  return nodes.map((node) => `${node.id}:${node.usagePercent}`).join("|");
}

function useLiveMetricsHistory(
  cpu: number | undefined,
  memory: number | undefined,
  nodes: MemoryNode[] | undefined,
  timestamp: string | undefined,
  range: MetricsHistoryRange
): MetricsHistoryPoint[] {
  const [history, setHistory] = useState<MetricsHistoryPoint[]>([]);
  const nodeFingerprint = nodeUsageFingerprint(nodes);

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

        const nodeValues: Record<string, number> = {};
        for (const node of nodes ?? []) {
          nodeValues[nodeSeriesKey(node.id)] = node.usagePercent;
        }

        const nodesUnchanged = (nodes ?? []).every(
          (node) => last?.[nodeSeriesKey(node.id)] === node.usagePercent
        );

        if (
          last?.time === time &&
          last.cpu === cpu &&
          last.memory === memory &&
          nodesUnchanged
        ) {
          return current;
        }

        return [...current, { time, cpu, memory, ...nodeValues }].slice(
          -MAX_LIVE_POINTS
        );
      });
    });
  }, [cpu, memory, nodeFingerprint, nodes, range, timestamp]);

  return history;
}

type ChartSeries = {
  dataKey: string;
  color: string;
  label: string;
};

type ChartProps = {
  data: MetricsHistoryPoint[];
  series: ChartSeries[];
};

function Chart({ data, series }: ChartProps) {
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
            formatter={(value, name) => [
              `${Number(value).toFixed(1)}%`,
              String(name),
            ]}
          />
          {series.map((item) => (
            <Line
              key={item.dataKey}
              type="monotone"
              dataKey={item.dataKey}
              name={item.label}
              stroke={item.color}
              strokeWidth={item.dataKey === "memory" && series.length > 1 ? 1.5 : 2}
              strokeDasharray={
                item.dataKey === "memory" && series.length > 1 ? "4 3" : undefined
              }
              dot={false}
              isAnimationActive={false}
            />
          ))}
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
