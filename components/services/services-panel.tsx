"use client";

import { DashboardPanel } from "@/components/dashboard/panel";
import { StatusIndicator } from "@/components/shared/status-indicator";
import { useServices } from "@/hooks/useServices";
import {
  serviceStatusLabel,
  serviceStatusToLevel,
} from "@/types/service";

export function ServicesPanel() {
  const { data, error, isLoading } = useServices();

  if (error && !data) {
    return (
      <DashboardPanel title="Services" description="Health check status">
        <div className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-6 text-center">
          <p className="text-sm text-muted-foreground">Services unavailable</p>
          <p className="mt-1 text-xs text-muted-foreground">{error.message}</p>
        </div>
      </DashboardPanel>
    );
  }

  const services = data?.services ?? [];

  return (
    <DashboardPanel title="Services" description="Health check status">
      <ul className="divide-y divide-border rounded-lg border border-border">
        {services.length > 0 ? (
          services.map((service) => (
            <li
              key={service.id}
              className="flex items-center justify-between gap-4 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium">{service.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {service.message}
                </p>
              </div>
              <StatusIndicator
                status={serviceStatusToLevel(service.status)}
                label={serviceStatusLabel(service.status)}
              />
            </li>
          ))
        ) : (
          <li className="px-4 py-6 text-center text-xs text-muted-foreground">
            {isLoading ? "Loading services…" : "No service data available"}
          </li>
        )}
      </ul>
    </DashboardPanel>
  );
}
