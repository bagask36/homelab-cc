"use client";

import { useState } from "react";
import {
  DownloadIcon,
  LoaderCircleIcon,
  PlusIcon,
  SaveIcon,
  Trash2Icon,
} from "lucide-react";

import { DashboardPanel } from "@/components/dashboard/panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTunnelConfig } from "@/hooks/useTunnelConfig";

export function TunnelConfigPanel() {
  const { data, error, isLoading, mutate } = useTunnelConfig();
  const [hostname, setHostname] = useState("");
  const [service, setService] = useState("http://127.0.0.1:3001");
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  async function postJson(
    url: string,
    method: "POST" | "PUT" | "DELETE",
    body?: unknown
  ) {
    const response = await fetch(url, {
      method,
      credentials: "same-origin",
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });

    const payload = (await response.json().catch(() => null)) as {
      message?: string;
      errors?: string[];
    } | null;

    if (!response.ok) {
      throw new Error(
        payload?.errors?.[0] ?? payload?.message ?? `Request failed (${response.status})`
      );
    }

    return payload;
  }

  async function handleAddRule(event: React.FormEvent) {
    event.preventDefault();
    setActionError(null);
    setActionMessage(null);
    setBusy("add");

    try {
      await postJson("/api/tunnel/config/ingress", "POST", {
        hostname: hostname.trim() || undefined,
        service: service.trim(),
      });
      setHostname("");
      setActionMessage("Ingress rule added. Click Apply to write config.yml.");
      await mutate();
    } catch (caught) {
      setActionError(
        caught instanceof Error ? caught.message : "Failed to add rule"
      );
    } finally {
      setBusy(null);
    }
  }

  async function handleDelete(id: string) {
    setActionError(null);
    setActionMessage(null);
    setBusy(id);

    try {
      await postJson(`/api/tunnel/config/ingress/${id}`, "DELETE");
      setActionMessage("Rule deleted. Click Apply to update config.yml.");
      await mutate();
    } catch (caught) {
      setActionError(
        caught instanceof Error ? caught.message : "Failed to delete rule"
      );
    } finally {
      setBusy(null);
    }
  }

  async function handleApply() {
    setActionError(null);
    setActionMessage(null);
    setBusy("apply");

    try {
      const result = await postJson("/api/tunnel/config/apply", "POST");
      setActionMessage(result?.message ?? "Config applied");
      await mutate();
    } catch (caught) {
      setActionError(
        caught instanceof Error ? caught.message : "Failed to apply config"
      );
    } finally {
      setBusy(null);
    }
  }

  async function handleImport() {
    setActionError(null);
    setActionMessage(null);
    setBusy("import");

    try {
      const result = await postJson("/api/tunnel/config/import", "POST");
      setActionMessage(result?.message ?? "Config imported");
      await mutate();
    } catch (caught) {
      setActionError(
        caught instanceof Error ? caught.message : "Failed to import config"
      );
    } finally {
      setBusy(null);
    }
  }

  const settings = data?.settings;
  const ingress = data?.ingress ?? [];

  return (
    <DashboardPanel
      title="Tunnel configuration"
      description="Manage Cloudflare Tunnel ingress rules without editing config.yml manually"
    >
      <div className="space-y-5">
        {error && !data && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error.message}
          </div>
        )}

        {actionError && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {actionError}
          </div>
        )}

        {actionMessage && (
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
            {actionMessage}
          </div>
        )}

        {settings && (
          <div className="grid gap-3 rounded-lg border border-border bg-muted/20 p-4 text-xs sm:grid-cols-2">
            <div>
              <p className="text-muted-foreground">Tunnel ID</p>
              <p className="mt-1 font-mono">
                {settings.tunnelId || "Not set (CLOUDFLARE_TUNNEL_ID)"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Config path</p>
              <p className="mt-1 font-mono break-all">{settings.configPath}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Credentials</p>
              <p className="mt-1 font-mono break-all">
                {settings.credentialsFile}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">File access</p>
              <p className="mt-1">
                {settings.configExists ? "Found" : "Missing"} ·{" "}
                {settings.configWritable ? "Writable" : "Read-only"}
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleAddRule} className="space-y-4 rounded-lg border border-border p-4">
          <p className="text-sm font-medium">Add ingress rule</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="tunnel-hostname">Hostname</Label>
              <Input
                id="tunnel-hostname"
                value={hostname}
                onChange={(event) => setHostname(event.target.value)}
                placeholder="app.example.com"
                disabled={busy !== null}
              />
              <p className="text-xs text-muted-foreground">
                Leave empty for catch-all rules (usually http_status:404)
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tunnel-service">Service URL</Label>
              <Input
                id="tunnel-service"
                value={service}
                onChange={(event) => setService(event.target.value)}
                placeholder="http://127.0.0.1:3001"
                required
                disabled={busy !== null}
              />
            </div>
          </div>
          <Button type="submit" size="sm" disabled={busy !== null || !service.trim()}>
            {busy === "add" ? (
              <LoaderCircleIcon className="size-4 animate-spin" />
            ) : (
              <PlusIcon className="size-4" />
            )}
            Add rule
          </Button>
        </form>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            disabled={busy !== null || ingress.length === 0}
            onClick={() => void handleApply()}
          >
            {busy === "apply" ? (
              <LoaderCircleIcon className="size-4 animate-spin" />
            ) : (
              <SaveIcon className="size-4" />
            )}
            Apply to config.yml
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy !== null || !settings?.configExists}
            onClick={() => void handleImport()}
          >
            {busy === "import" ? (
              <LoaderCircleIcon className="size-4 animate-spin" />
            ) : (
              <DownloadIcon className="size-4" />
            )}
            Import from file
          </Button>
        </div>

        {ingress.length > 0 ? (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {ingress.map((rule) => (
              <li
                key={rule.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    {rule.hostname ?? "(catch-all)"}
                  </p>
                  <p className="truncate font-mono text-xs text-muted-foreground">
                    → {rule.service}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={busy !== null}
                  onClick={() => void handleDelete(rule.id)}
                >
                  {busy === rule.id ? (
                    <LoaderCircleIcon className="size-4 animate-spin" />
                  ) : (
                    <Trash2Icon className="size-4" />
                  )}
                  Delete
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-border bg-muted/20">
            <p className="text-xs text-muted-foreground">
              {isLoading
                ? "Loading rules…"
                : "No ingress rules yet. Add one or import from config.yml."}
            </p>
          </div>
        )}

        {data?.configPreview && (
          <div className="space-y-2">
            <Label>Generated config preview</Label>
            <pre className="max-h-72 overflow-auto rounded-lg border border-border bg-muted/20 p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap">
              {data.configPreview}
            </pre>
          </div>
        )}
      </div>
    </DashboardPanel>
  );
}
