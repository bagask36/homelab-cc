"use client";

import { DashboardPanel } from "@/components/dashboard/panel";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { StatusIndicator } from "@/components/shared/status-indicator";
import { Badge } from "@/components/ui/badge";
import { useOllama } from "@/hooks/useOllama";
import { formatBytesCompact, formatTimestamp } from "@/lib/monitoring/format";
import { BrainCircuitIcon, ClockIcon, LayersIcon } from "lucide-react";

export function OllamaOverview() {
  const { data, error, isLoading } = useOllama();
  const online = data?.online ?? false;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Ollama</h2>
        <p className="text-sm text-muted-foreground">
          Local LLM runtime status, models, and response time
        </p>
      </div>

      {error && !data && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Unable to reach Ollama. {error.message}
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <SummaryCard
          title="Status"
          value={isLoading && !data ? "…" : online ? "Online" : "Offline"}
          subtitle={data?.errors?.[0] ?? "API probe"}
          icon={BrainCircuitIcon}
        />
        <SummaryCard
          title="Response Time"
          value={
            data?.responseTimeMs != null ? `${data.responseTimeMs} ms` : "—"
          }
          subtitle="GET /api/tags"
          icon={ClockIcon}
        />
        <SummaryCard
          title="Models"
          value={
            isLoading && !data ? "…" : String(data?.models?.length ?? "—")
          }
          subtitle={`Updated ${formatTimestamp(data?.timestamp)}`}
          icon={LayersIcon}
        />
      </section>

      <DashboardPanel title="Available Models" description="Installed Ollama models">
        {data?.models && data.models.length > 0 ? (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {data.models.map((model) => (
              <li
                key={model.name}
                className="flex items-center justify-between gap-4 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium">{model.name}</p>
                  {model.modifiedAt && (
                    <p className="text-xs text-muted-foreground">
                      Modified {new Date(model.modifiedAt).toLocaleString()}
                    </p>
                  )}
                </div>
                <span className="font-mono text-xs text-muted-foreground">
                  {model.size ? formatBytesCompact(model.size) : "—"}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-border bg-muted/20">
            <p className="text-xs text-muted-foreground">
              {isLoading
                ? "Loading models…"
                : online
                  ? "No models found"
                  : "Ollama is offline"}
            </p>
          </div>
        )}
      </DashboardPanel>

      <DashboardPanel title="Running Models" description="Currently loaded models">
        {data?.runningModels && data.runningModels.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {data.runningModels.map((model) => (
              <Badge key={model} variant="secondary">
                {model}
              </Badge>
            ))}
          </div>
        ) : (
          <div className="flex h-24 items-center justify-center rounded-lg border border-dashed border-border bg-muted/20">
            <p className="text-xs text-muted-foreground">
              {online ? "No models currently running" : "Ollama unavailable"}
            </p>
          </div>
        )}
      </DashboardPanel>

      <div className="flex items-center gap-2">
        <StatusIndicator
          status={online ? "healthy" : "critical"}
          label={online ? "Online" : "Offline"}
        />
      </div>
    </div>
  );
}
