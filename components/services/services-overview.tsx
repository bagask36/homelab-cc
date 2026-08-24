"use client";

import { DashboardPanel } from "@/components/dashboard/panel";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { StatusIndicator } from "@/components/shared/status-indicator";
import { useServices } from "@/hooks/useServices";
import { formatTimestamp } from "@/lib/monitoring/format";
import {
  serviceStatusLabel,
  serviceStatusToLevel,
} from "@/types/service";
import {
  ActivityIcon,
  CircleCheckIcon,
  CircleXIcon,
  TriangleAlertIcon,
} from "lucide-react";

export function ServicesOverview() {
  const { data, error, isLoading } = useServices();
  const services = data?.services ?? [];
  const healthyCount = services.filter(
    (service) => service.status === "healthy"
  ).length;
  const downCount = services.filter(
    (service) => service.status === "down"
  ).length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Services</h2>
        <p className="text-sm text-muted-foreground">
          Health and availability of homelab services
        </p>
      </div>

      {error && !data && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Unable to load service health. {error.message}
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Healthy"
          value={isLoading && !data ? "…" : String(healthyCount)}
          subtitle={`of ${services.length || "—"} services`}
          icon={CircleCheckIcon}
        />
        <SummaryCard
          title="Down"
          value={isLoading && !data ? "…" : String(downCount)}
          subtitle="Requires attention"
          icon={CircleXIcon}
        />
        <SummaryCard
          title="Overall"
          value={
            data?.status === "ok"
              ? "All healthy"
              : data?.status === "partial"
                ? "Partial"
                : "Unavailable"
          }
          subtitle="Current service state"
          icon={TriangleAlertIcon}
        />
        <SummaryCard
          title="Updated"
          value={formatTimestamp(data?.timestamp) || "—"}
          subtitle="Live polling"
          icon={ActivityIcon}
        />
      </section>

      <DashboardPanel title="Service Health" description="Individual probe results">
        {services.length > 0 ? (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {services.map((service) => (
              <li
                key={service.id}
                className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium">{service.name}</p>
                  <p className="text-xs text-muted-foreground">{service.message}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-mono text-xs text-muted-foreground">
                    {service.responseTimeMs !== null
                      ? `${service.responseTimeMs} ms`
                      : "—"}
                  </span>
                  <StatusIndicator
                    status={serviceStatusToLevel(service.status)}
                    label={serviceStatusLabel(service.status)}
                  />
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-border bg-muted/20">
            <p className="text-xs text-muted-foreground">
              {isLoading ? "Loading services…" : "No service data available"}
            </p>
          </div>
        )}
      </DashboardPanel>
    </div>
  );
}
