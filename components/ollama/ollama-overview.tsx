"use client";

import { useEffect, useState } from "react";
import {
  BrainCircuitIcon,
  ClockIcon,
  LayersIcon,
  LoaderCircleIcon,
  PlayIcon,
  SquareIcon,
} from "lucide-react";

import { DashboardPanel } from "@/components/dashboard/panel";
import { OllamaApiKeysPanel } from "@/components/ollama/ollama-api-keys";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { StatusIndicator } from "@/components/shared/status-indicator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useOllama } from "@/hooks/useOllama";
import { formatBytesCompact, formatTimestamp } from "@/lib/monitoring/format";
import { cn } from "@/lib/utils";
import type { OllamaActionResponse } from "@/types/ollama-control";

export function OllamaOverview() {
  const { data, error, isLoading, mutate } = useOllama();
  const online = data?.online ?? false;
  const running = new Set(data?.runningModels ?? []);

  const [selectedModel, setSelectedModel] = useState("");
  const [prompt, setPrompt] = useState("");
  const [output, setOutput] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyModel, setBusyModel] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (!selectedModel && data?.models?.length) {
      queueMicrotask(() => {
        setSelectedModel(data.models![0]!.name);
      });
    }
  }, [data?.models, selectedModel]);

  async function postAction(
    path: "/api/ollama/run" | "/api/ollama/stop",
    body: Record<string, unknown>
  ): Promise<OllamaActionResponse> {
    const response = await fetch(path, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const payload = (await response.json().catch(() => null)) as
      | OllamaActionResponse
      | null;

    if (!response.ok) {
      throw new Error(
        payload?.errors?.[0] ?? `Request failed (${response.status})`
      );
    }

    return (
      payload ?? {
        status: "ok",
      }
    );
  }

  async function handleLoad(model: string) {
    setActionError(null);
    setBusyModel(model);
    try {
      await postAction("/api/ollama/run", { model });
      setSelectedModel(model);
      await mutate();
    } catch (caught) {
      setActionError(
        caught instanceof Error ? caught.message : "Failed to load model"
      );
    } finally {
      setBusyModel(null);
    }
  }

  async function handleUnload(model: string) {
    setActionError(null);
    setBusyModel(model);
    try {
      await postAction("/api/ollama/stop", { model });
      await mutate();
    } catch (caught) {
      setActionError(
        caught instanceof Error ? caught.message : "Failed to unload model"
      );
    } finally {
      setBusyModel(null);
    }
  }

  async function handleGenerate() {
    if (!selectedModel || !prompt.trim()) return;

    setActionError(null);
    setIsGenerating(true);
    setOutput("");

    try {
      const result = await postAction("/api/ollama/run", {
        model: selectedModel,
        prompt: prompt.trim(),
      });
      setOutput(result.response?.trim() || "(empty response)");
      await mutate();
    } catch (caught) {
      setActionError(
        caught instanceof Error ? caught.message : "Failed to run prompt"
      );
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Ollama</h2>
        <p className="text-sm text-muted-foreground">
          Local LLM runtime — load models, run prompts, and unload from memory
        </p>
      </div>

      {error && !data && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Unable to reach Ollama. {error.message}
        </div>
      )}

      {actionError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {actionError}
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

      <DashboardPanel
        title="Available Models"
        description="Load into memory or unload when finished"
      >
        {data?.models && data.models.length > 0 ? (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {data.models.map((model) => {
              const isRunning = running.has(model.name);
              const isBusy = busyModel === model.name;

              return (
                <li
                  key={model.name}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium">{model.name}</p>
                      {isRunning && (
                        <Badge variant="secondary">Running</Badge>
                      )}
                    </div>
                    {model.modifiedAt && (
                      <p className="text-xs text-muted-foreground">
                        Modified {new Date(model.modifiedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">
                      {model.size ? formatBytesCompact(model.size) : "—"}
                    </span>
                    {isRunning ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={!online || isBusy || isGenerating}
                        onClick={() => void handleUnload(model.name)}
                      >
                        {isBusy ? (
                          <LoaderCircleIcon className="size-3.5 animate-spin" />
                        ) : (
                          <SquareIcon className="size-3.5" />
                        )}
                        Stop
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={!online || isBusy || isGenerating}
                        onClick={() => void handleLoad(model.name)}
                      >
                        {isBusy ? (
                          <LoaderCircleIcon className="size-3.5 animate-spin" />
                        ) : (
                          <PlayIcon className="size-3.5" />
                        )}
                        Run
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={!online}
                      onClick={() => setSelectedModel(model.name)}
                      className={cn(
                        selectedModel === model.name && "bg-muted"
                      )}
                    >
                      Use
                    </Button>
                  </div>
                </li>
              );
            })}
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

      <DashboardPanel
        title="Run prompt"
        description="Send a prompt to a selected model (keeps it loaded)"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ollama-model">Model</Label>
            <select
              id="ollama-model"
              className="flex h-8 w-full rounded-lg border border-border bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
              value={selectedModel}
              disabled={!online || isGenerating || !data?.models?.length}
              onChange={(event) => setSelectedModel(event.target.value)}
            >
              {(data?.models ?? []).map((model) => (
                <option key={model.name} value={model.name}>
                  {model.name}
                  {running.has(model.name) ? " (running)" : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ollama-prompt">Prompt</Label>
            <textarea
              id="ollama-prompt"
              rows={4}
              value={prompt}
              disabled={!online || isGenerating}
              placeholder="Ask the model something…"
              onChange={(event) => setPrompt(event.target.value)}
              className="w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              disabled={
                !online ||
                isGenerating ||
                !selectedModel ||
                !prompt.trim() ||
                busyModel !== null
              }
              onClick={() => void handleGenerate()}
            >
              {isGenerating ? (
                <LoaderCircleIcon className="size-4 animate-spin" />
              ) : (
                <PlayIcon className="size-4" />
              )}
              {isGenerating ? "Running…" : "Run prompt"}
            </Button>
            <p className="text-xs text-muted-foreground">
              First load of a large model can take a minute or more
            </p>
          </div>

          {(output || isGenerating) && (
            <div className="space-y-2">
              <Label>Response</Label>
              <pre className="max-h-[28rem] overflow-auto rounded-lg border border-border bg-muted/20 p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap text-foreground">
                {isGenerating && !output ? "Waiting for model…" : output}
              </pre>
            </div>
          )}
        </div>
      </DashboardPanel>

      <OllamaApiKeysPanel models={(data?.models ?? []).map((model) => model.name)} />

      <DashboardPanel title="Running Models" description="Currently loaded in memory">
        {data?.runningModels && data.runningModels.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {data.runningModels.map((model) => (
              <div key={model} className="flex items-center gap-1.5">
                <Badge variant="secondary">{model}</Badge>
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  disabled={!online || busyModel === model || isGenerating}
                  onClick={() => void handleUnload(model)}
                >
                  Stop
                </Button>
              </div>
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
