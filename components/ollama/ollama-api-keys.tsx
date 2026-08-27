"use client";

import { useMemo, useState } from "react";
import {
  CheckIcon,
  CopyIcon,
  KeyRoundIcon,
  LoaderCircleIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";

import { DashboardPanel } from "@/components/dashboard/panel";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useOllamaApiKeys } from "@/hooks/useOllamaApiKeys";
import type { ApiKeyCreateResponse } from "@/types/api-key";

type OllamaApiKeysPanelProps = {
  models: string[];
};

function formatTokenCount(value: number): string {
  return value.toLocaleString();
}

export function OllamaApiKeysPanel({ models }: OllamaApiKeysPanelProps) {
  const { data, error, isLoading, mutate } = useOllamaApiKeys();
  const keys = data?.keys ?? [];
  const totalTokensUsed = useMemo(
    () => keys.reduce((sum, key) => sum + key.totalTokens, 0),
    [keys]
  );

  const [name, setName] = useState("");
  const [model, setModel] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [createdToken, setCreatedToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const apiBase = useMemo(() => {
    if (typeof window === "undefined") return "/api/v1";
    return `${window.location.origin}/api/v1`;
  }, []);

  async function postJson(
    url: string,
    method: "POST" | "DELETE",
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
      token?: string;
    } | null;

    if (!response.ok) {
      throw new Error(
        payload?.errors?.[0] ?? payload?.message ?? `Request failed (${response.status})`
      );
    }

    return payload;
  }

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;

    setActionError(null);
    setBusy("create");

    try {
      const payload = (await postJson("/api/ollama/keys", "POST", {
        name: name.trim(),
        model: model.trim() || undefined,
      })) as ApiKeyCreateResponse;

      setName("");
      setModel("");
      setCreatedToken(payload.token ?? null);
      setCopied(false);
      await mutate();
    } catch (caught) {
      setActionError(
        caught instanceof Error ? caught.message : "Failed to create API key"
      );
    } finally {
      setBusy(null);
    }
  }

  async function handleRevoke(id: string) {
    setActionError(null);
    setBusy(id);

    try {
      await postJson(`/api/ollama/keys/${id}`, "DELETE");
      await mutate();
    } catch (caught) {
      setActionError(
        caught instanceof Error ? caught.message : "Failed to revoke API key"
      );
    } finally {
      setBusy(null);
    }
  }

  async function handleCopy(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <>
      <DashboardPanel
        title="API keys"
        description="Generate a key to call models from other apps (OpenAI-compatible /api/v1)"
      >
        <div className="space-y-4">
          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error.message}
            </div>
          )}

          {actionError && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {actionError}
            </div>
          )}

          <form
            onSubmit={handleCreate}
            className="grid gap-4 rounded-lg border border-border p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
          >
            <div className="space-y-2">
              <Label htmlFor="api-key-name">Name</Label>
              <Input
                id="api-key-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="home-assistant"
                disabled={busy !== null}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="api-key-model">Restrict to model</Label>
              <select
                id="api-key-model"
                className="flex h-8 w-full rounded-lg border border-border bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
                value={model}
                disabled={busy !== null}
                onChange={(event) => setModel(event.target.value)}
              >
                <option value="">Any model</option>
                {models.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
            <Button
              type="submit"
              size="sm"
              disabled={busy !== null || !name.trim()}
            >
              {busy === "create" ? (
                <LoaderCircleIcon className="size-4 animate-spin" />
              ) : (
                <PlusIcon className="size-4" />
              )}
              Generate
            </Button>
          </form>

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
            <p>
              Base URL for clients:{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono">
                {apiBase}
              </code>
            </p>
            {keys.length > 0 && (
              <p>
                Total tokens used:{" "}
                <span className="font-medium text-foreground">
                  {formatTokenCount(totalTokensUsed)}
                </span>
              </p>
            )}
          </div>

          {keys.length > 0 ? (
            <ul className="divide-y divide-border rounded-lg border border-border">
              {keys.map((key) => (
                <li
                  key={key.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{key.name}</p>
                    <p className="font-mono text-xs text-muted-foreground">
                      {key.keyPrefix}… · {key.model ?? "any model"}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatTokenCount(key.totalTokens)} tokens
                      <span className="text-muted-foreground/80">
                        {" "}
                        ({formatTokenCount(key.promptTokens)} prompt ·{" "}
                        {formatTokenCount(key.completionTokens)} completion)
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {key.lastUsedAt
                        ? `Last used ${new Date(key.lastUsedAt).toLocaleString()}`
                        : "Never used"}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={busy !== null}
                      onClick={() => void handleRevoke(key.id)}
                    >
                      {busy === key.id ? (
                        <LoaderCircleIcon className="size-3.5 animate-spin" />
                      ) : (
                        <Trash2Icon className="size-3.5" />
                      )}
                      Revoke
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex h-24 items-center justify-center rounded-lg border border-dashed border-border bg-muted/20">
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <KeyRoundIcon className="size-3.5" />
                {isLoading ? "Loading keys…" : "No API keys yet"}
              </p>
            </div>
          )}
        </div>
      </DashboardPanel>

      <Dialog
        open={createdToken !== null}
        onOpenChange={(open) => {
          if (!open) {
            setCreatedToken(null);
            setCopied(false);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>API key created</DialogTitle>
            <DialogDescription>
              Copy this key now. It will not be shown again.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 px-6 py-4">
            <pre className="overflow-x-auto rounded-lg border border-border bg-muted/20 p-3 font-mono text-xs break-all whitespace-pre-wrap">
              {createdToken}
            </pre>
            <pre className="overflow-x-auto rounded-lg border border-border bg-muted/20 p-3 font-mono text-xs whitespace-pre-wrap text-muted-foreground">
              {`curl ${apiBase}/chat/completions \\
  -H "Authorization: Bearer ${createdToken ?? "hcc_…"}" \\
  -H "Content-Type: application/json" \\
  -d '{"model":"${models[0] ?? "llama3"}","messages":[{"role":"user","content":"Hello"}]}'`}
            </pre>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!createdToken}
              onClick={() => createdToken && void handleCopy(createdToken)}
            >
              {copied ? (
                <CheckIcon className="size-4" />
              ) : (
                <CopyIcon className="size-4" />
              )}
              {copied ? "Copied" : "Copy key"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
