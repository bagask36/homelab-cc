import { RefreshCwIcon } from "lucide-react";

import { MobileSidebar } from "@/components/layout/sidebar";
import { StatusIndicator } from "@/components/shared/status-indicator";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
      <div className="flex h-14 items-center gap-4 px-4 lg:px-6">
        <MobileSidebar />

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-semibold tracking-tight">
            Homelab Command Center
          </h1>
          <p className="truncate text-xs text-muted-foreground">
            Hostname: <span className="font-mono">—</span>
          </p>
        </div>

        <div className="hidden items-center gap-4 sm:flex">
          <StatusIndicator status="unknown" label="Unknown" />
          <Separator orientation="vertical" className="h-6" />
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Last update</p>
            <p className="font-mono text-xs">—</p>
          </div>
          <Badge variant="outline" className="gap-1.5 font-normal">
            <RefreshCwIcon className="size-3 text-muted-foreground" />
            Idle
          </Badge>
        </div>
      </div>
    </header>
  );
}
