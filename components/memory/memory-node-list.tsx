"use client";

import {
  formatBytesCompact,
  formatPercent,
} from "@/lib/monitoring/format";
import { cn } from "@/lib/utils";
import type { MemoryNode } from "@/types/metrics";

type MemoryNodeListProps = {
  nodes?: MemoryNode[];
  isLoading?: boolean;
  emptyLabel?: string;
};

export function MemoryNodeList({
  nodes,
  isLoading = false,
  emptyLabel = "No memory node data available",
}: MemoryNodeListProps) {
  if (!nodes || nodes.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-border bg-muted/20">
        <p className="text-xs text-muted-foreground">
          {isLoading ? "Loading memory nodes…" : emptyLabel}
        </p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border rounded-lg border border-border">
      {nodes.map((node) => (
        <li key={`${node.id}-${node.name}`} className="px-4 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{node.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {formatBytesCompact(node.free)} available
              </p>
            </div>
            <div className="w-full sm:w-56">
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  {formatBytesCompact(node.used)} /{" "}
                  {formatBytesCompact(node.total)}
                </span>
                <span className="font-medium">
                  {formatPercent(node.usagePercent)}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "h-full rounded-full bg-primary transition-all",
                    node.usagePercent >= 90 && "bg-destructive",
                    node.usagePercent >= 75 &&
                      node.usagePercent < 90 &&
                      "bg-amber-500"
                  )}
                  style={{
                    width: `${Math.min(node.usagePercent, 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
