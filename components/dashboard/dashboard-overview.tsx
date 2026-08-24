"use client";

import { DashboardPanel } from "@/components/dashboard/panel";
import { MetricsCharts } from "@/components/dashboard/metrics-charts";
import { NetworkChart } from "@/components/dashboard/network-chart";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { StatusIndicator } from "@/components/shared/status-indicator";
import { Badge } from "@/components/ui/badge";
import { useMetrics } from "@/hooks/useMetrics";
import { useStorage } from "@/hooks/useStorage";
import {
  formatLoadAverage,
  formatMemorySummary,
  formatPercent,
  formatStorageSummary,
  formatUptime,
} from "@/lib/monitoring/format";
import {
  CpuIcon,
  HardDriveIcon,
  MemoryStickIcon,
  PackageIcon,
} from "lucide-react";
import { useNetwork } from "@/hooks/useNetwork";

const services = [
  "Docker",
  "PostgreSQL",
  "Redis",
  "Ollama",
  "Open WebUI",
  "Cloudflare Tunnel",
  "Nginx Proxy Manager",
];

export function DashboardOverview() {
  const { data, error, isLoading } = useMetrics();
  const { data: storageData, isLoading: storageLoading } = useStorage();
  const { data: networkData } = useNetwork();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Overview</h2>
          <p className="text-sm text-muted-foreground">
            System health and service status at a glance
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {data?.os && (
            <Badge variant="outline" className="font-normal">
              {data.os.platform} · {data.os.arch}
            </Badge>
          )}
          <Badge variant="secondary" className="font-normal">
            Uptime {formatUptime(data?.uptime)}
          </Badge>
        </div>
      </div>

      {error && !data && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Unable to load system metrics. {error.message}
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="CPU Usage"
          value={isLoading && !data ? "…" : formatPercent(data?.cpu?.usage)}
          subtitle={`Load ${formatLoadAverage(data?.cpu?.loadAverage)}`}
          icon={CpuIcon}
        />
        <SummaryCard
          title="Memory"
          value={
            isLoading && !data
              ? "…"
              : formatPercent(data?.memory?.usagePercent)
          }
          subtitle={formatMemorySummary(data?.memory)}
          icon={MemoryStickIcon}
        />
        <SummaryCard
          title="Storage"
          value={
            storageLoading && !storageData
              ? "…"
              : formatPercent(storageData?.summary?.usagePercent)
          }
          subtitle={formatStorageSummary(storageData?.summary)}
          icon={HardDriveIcon}
        />
        <SummaryCard
          title="Docker"
          value="— running"
          subtitle="Milestone 4"
          icon={PackageIcon}
        />
      </section>

      <MetricsCharts
        cpu={data?.cpu?.usage}
        memory={data?.memory?.usagePercent}
        timestamp={data?.timestamp}
      />

      <section className="grid gap-4 xl:grid-cols-3">
        <NetworkChart
          rxBytes={networkData?.totals?.rxBytes}
          txBytes={networkData?.totals?.txBytes}
          timestamp={networkData?.timestamp}
          className="xl:col-span-2"
        />

        <DashboardPanel title="Docker Overview" description="Container status">
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                { label: "Running", value: "—" },
                { label: "Stopped", value: "—" },
                { label: "Unhealthy", value: "—" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-lg border border-border bg-muted/20 px-3 py-4"
                >
                  <p className="text-lg font-semibold">{item.value}</p>
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                </div>
              ))}
            </div>
            <p className="text-center text-xs text-muted-foreground">
              Container details will appear in Milestone 4
            </p>
          </div>
        </DashboardPanel>
      </section>

      <DashboardPanel title="Services" description="Health check status">
        <ul className="divide-y divide-border rounded-lg border border-border">
          {services.map((service) => (
            <li
              key={service}
              className="flex items-center justify-between px-4 py-3"
            >
              <span className="text-sm font-medium">{service}</span>
              <StatusIndicator status="unknown" label="Unknown" />
            </li>
          ))}
        </ul>
      </DashboardPanel>
    </div>
  );
}
