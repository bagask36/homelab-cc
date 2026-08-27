"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MenuIcon, ServerIcon } from "lucide-react";

import { navGroups, settingsNavItem, type NavItem } from "@/components/layout/nav-config";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAlerts } from "@/hooks/useAlerts";
import { cn } from "@/lib/utils";

function isActivePath(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({
  item,
  alertCount = 0,
  onNavigate,
}: {
  item: NavItem;
  alertCount?: number;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const active = isActivePath(pathname, item.href);
  const Icon = item.icon;
  const showAlerts = item.href === "/alerts" && alertCount > 0;

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
        active
          ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground"
      )}
    >
      <span
        className={cn(
          "absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-sidebar-primary transition-opacity",
          active ? "opacity-100" : "opacity-0"
        )}
        aria-hidden
      />
      <Icon
        className={cn(
          "size-4 shrink-0",
          active ? "text-sidebar-primary" : "opacity-80"
        )}
        aria-hidden
      />
      <span className="min-w-0 flex-1 truncate">{item.title}</span>
      {showAlerts && (
        <span
          className={cn(
            "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 font-mono text-[10px] font-medium",
            "bg-destructive/15 text-destructive"
          )}
        >
          {alertCount > 99 ? "99+" : alertCount}
        </span>
      )}
    </Link>
  );
}

function NavSections({ onNavigate }: { onNavigate?: () => void }) {
  const { data: alertsData } = useAlerts();
  const alertCount = alertsData?.summary.total ?? 0;

  return (
    <nav className="flex flex-col gap-5" aria-label="Main">
      {navGroups.map((group) => (
        <div key={group.label} className="flex flex-col gap-1">
          <p className="px-2.5 pb-1 text-[10px] font-semibold tracking-[0.14em] text-muted-foreground/80 uppercase">
            {group.label}
          </p>
          {group.items.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              alertCount={alertCount}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      ))}
    </nav>
  );
}

function SidebarBrand({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <Link
      href="/"
      onClick={onNavigate}
      className="flex items-center gap-3 rounded-lg px-1 py-0.5 outline-none hover:opacity-90 focus-visible:ring-2 focus-visible:ring-sidebar-ring"
    >
      <div className="flex size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground shadow-sm">
        <ServerIcon className="size-4" aria-hidden />
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold tracking-tight">
          Homelab CC
        </p>
        <p className="truncate text-[11px] text-muted-foreground">
          Command Center
        </p>
      </div>
    </Link>
  );
}

function SidebarBody({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <>
      <div className="px-3 py-4 pr-12 lg:pr-3">
        <SidebarBrand onNavigate={onNavigate} />
      </div>
      <ScrollArea className="min-h-0 flex-1 px-2.5">
        <div className="pb-4">
          <NavSections onNavigate={onNavigate} />
        </div>
      </ScrollArea>
      <div className="mt-auto border-t border-sidebar-border p-2.5">
        <NavLink item={settingsNavItem} onNavigate={onNavigate} />
      </div>
    </>
  );
}

export function DesktopSidebar() {
  return (
    <aside className="hidden h-svh w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
      <SidebarBody />
    </aside>
  );
}

export function MobileSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button variant="outline" size="icon-sm" className="lg:hidden" />
        }
      >
        <MenuIcon className="size-4" />
        <span className="sr-only">Open navigation</span>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-72 gap-0 bg-sidebar p-0 sm:max-w-72"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Navigation</SheetTitle>
        </SheetHeader>
        <SidebarBody onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
