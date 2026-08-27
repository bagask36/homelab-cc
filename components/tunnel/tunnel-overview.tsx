"use client";

import { DashboardPanel } from "@/components/dashboard/panel";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { StatusIndicator } from "@/components/shared/status-indicator";
import { TunnelConfigPanel } from "@/components/tunnel/tunnel-config-panel";
import { useTunnel } from "@/hooks/useTunnel";
import { formatTimestamp } from "@/lib/monitoring/format";
import { ClockIcon, CloudIcon, RadioIcon } from "lucide-react";

export function TunnelOverview() {
  const { data, error, isLoading } = useTunnel();
  const online = data?.online ?? false;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">
          Cloudflare Tunnel
        </h2>
        <p className="text-sm text-muted-foreground">
          Tunnel connectivity and ingress configuration for cloudflared
        </p>
      </div>

      {error && !data && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Unable to check Cloudflare Tunnel. {error.message}
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <SummaryCard
          title="Status"
          value={isLoading && !data ? "…" : online ? "Connected" : "Offline"}
          subtitle={data?.message ?? "Metrics probe"}
          icon={CloudIcon}
        />
        <SummaryCard
          title="Response Time"
          value={
            data?.responseTimeMs != null ? `${data.responseTimeMs} ms` : "—"
          }
          subtitle="Metrics endpoint"
          icon={ClockIcon}
        />
        <SummaryCard
          title="Updated"
          value={formatTimestamp(data?.timestamp) || "—"}
          subtitle="Live polling"
          icon={RadioIcon}
        />
      </section>

      <DashboardPanel
        title="Tunnel Monitor"
        description="Replaceable Cloudflare integration module"
      >
        <div className="space-y-4 rounded-lg border border-border bg-muted/20 px-4 py-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">cloudflared metrics</p>
              <p className="text-xs text-muted-foreground">
                Probes the configured metrics URL. Customize via{" "}
                <code className="font-mono">CLOUDFLARE_TUNNEL_METRICS_URL</code>.
              </p>
            </div>
            <StatusIndicator
              status={online ? "healthy" : "critical"}
              label={online ? "Reachable" : "Unreachable"}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {data?.message ??
              (isLoading
                ? "Checking tunnel status…"
                : "No tunnel status available")}
          </p>
        </div>
      </DashboardPanel>

      <TunnelConfigPanel />
    </div>
  );
}
