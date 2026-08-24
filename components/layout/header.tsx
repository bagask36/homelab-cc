"use client";

import { MobileSidebar } from "@/components/layout/sidebar";
import { HeaderStatus } from "@/components/layout/header-status";
import { UserMenu } from "@/components/layout/user-menu";
import { useMetrics } from "@/hooks/useMetrics";

export function Header() {
  const { data } = useMetrics();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
      <div className="flex h-14 items-center gap-4 px-4 lg:px-6">
        <MobileSidebar />

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-semibold tracking-tight">
            Homelab Command Center
          </h1>
          <p className="truncate text-xs text-muted-foreground">
            Hostname:{" "}
            <span className="font-mono">{data?.hostname ?? "—"}</span>
            {data?.os && (
              <span className="hidden md:inline">
                {" "}
                · {data.os.distro} {data.os.release}
              </span>
            )}
          </p>
        </div>

        <HeaderStatus />
        <UserMenu />
      </div>
    </header>
  );
}
