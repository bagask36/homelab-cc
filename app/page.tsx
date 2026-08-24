import {
  ChartPlaceholder,
  DashboardPanel,
} from "@/components/dashboard/panel";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { StatusIndicator } from "@/components/shared/status-indicator";
import { Badge } from "@/components/ui/badge";
import { CpuIcon, HardDriveIcon, MemoryStickIcon, PackageIcon } from "lucide-react";

const services = [
  "Docker",
  "PostgreSQL",
  "Redis",
  "Ollama",
  "Open WebUI",
  "Cloudflare Tunnel",
  "Nginx Proxy Manager",
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Overview</h2>
          <p className="text-sm text-muted-foreground">
            System health and service status at a glance
          </p>
        </div>
        <Badge variant="secondary">Milestone 1 — Shell only</Badge>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard title="CPU Usage" value="—" icon={CpuIcon} />
        <SummaryCard
          title="Memory"
          value="—"
          subtitle="— / — GB"
          icon={MemoryStickIcon}
        />
        <SummaryCard
          title="Storage"
          value="—"
          subtitle="— / — GB"
          icon={HardDriveIcon}
        />
        <SummaryCard
          title="Docker"
          value="— running"
          subtitle="— stopped"
          icon={PackageIcon}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <DashboardPanel title="CPU Usage" description="Usage over time">
          <ChartPlaceholder label="Live CPU metrics will appear in Milestone 2" />
        </DashboardPanel>
        <DashboardPanel title="Memory Usage" description="Usage over time">
          <ChartPlaceholder label="Live memory metrics will appear in Milestone 2" />
        </DashboardPanel>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <DashboardPanel
          title="Network Traffic"
          description="Download and upload"
          className="xl:col-span-2"
        >
          <ChartPlaceholder label="Network metrics will appear in Milestone 3" />
        </DashboardPanel>

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
