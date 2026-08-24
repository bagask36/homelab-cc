"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { ContainerMetrics } from "@/types/docker";

type ContainerLogsSheetProps = {
  container: ContainerMetrics | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ContainerLogsSheet({
  container,
  open,
  onOpenChange,
}: ContainerLogsSheetProps) {
  const [logs, setLogs] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!open || !container) {
      return;
    }

    let cancelled = false;
    const containerId = container.id;

    async function loadLogs() {
      setIsLoading(true);
      setError(null);
      setLogs("");

      try {
        const response = await fetch(
          `/api/docker/containers/${containerId}/logs?tail=200`,
          { credentials: "same-origin" }
        );

        const body = (await response.json()) as {
          logs?: string;
          errors?: string[];
        };

        if (!response.ok) {
          throw new Error(body.errors?.[0] ?? "Failed to load logs");
        }

        if (!cancelled) {
          setLogs(body.logs ?? "");
        }
      } catch (caught) {
        if (!cancelled) {
          setError(
            caught instanceof Error ? caught.message : "Failed to load logs"
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadLogs();

    return () => {
      cancelled = true;
    };
  }, [container, open]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>Container logs</SheetTitle>
          <SheetDescription>
            {container
              ? `${container.name} (${container.id})`
              : "Select a container"}
          </SheetDescription>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-3 px-4 pb-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              Last 200 lines · audit logged
            </p>
            {container && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isLoading}
                onClick={() => {
                  setLogs("");
                  setError(null);
                  void fetch(
                    `/api/docker/containers/${container.id}/logs?tail=200`,
                    { credentials: "same-origin" }
                  )
                    .then(async (response) => {
                      const body = (await response.json()) as {
                        logs?: string;
                        errors?: string[];
                      };
                      if (!response.ok) {
                        throw new Error(
                          body.errors?.[0] ?? "Failed to load logs"
                        );
                      }
                      setLogs(body.logs ?? "");
                    })
                    .catch((caught) => {
                      setError(
                        caught instanceof Error
                          ? caught.message
                          : "Failed to load logs"
                      );
                    });
                }}
              >
                Refresh
              </Button>
            )}
          </div>

          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <ScrollArea className="h-[min(70vh,640px)] rounded-lg border border-border bg-muted/20">
            <pre className="overflow-x-auto p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap text-foreground">
              {isLoading
                ? "Loading logs…"
                : logs || (error ? "" : "No logs available")}
            </pre>
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
}
