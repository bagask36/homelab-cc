"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MenuIcon, ServerIcon } from "lucide-react";

import { navItems } from "@/components/layout/nav-config";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {navItems.map((item) => {
        const isActive =
          item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
            )}
          >
            <Icon className="size-4 shrink-0" aria-hidden />
            {item.title}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarBrand() {
  return (
    <div className="flex items-center gap-3 px-3 py-2">
      <div className="flex size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
        <ServerIcon className="size-4" aria-hidden />
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">Homelab CC</p>
        <p className="truncate text-xs text-muted-foreground">Command Center</p>
      </div>
    </div>
  );
}

export function DesktopSidebar() {
  return (
    <aside className="hidden h-full w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
      <div className="p-4">
        <SidebarBrand />
      </div>
      <Separator />
      <ScrollArea className="flex-1 px-3 py-4">
        <NavLinks />
      </ScrollArea>
    </aside>
  );
}

export function MobileSidebar() {
  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button variant="outline" size="icon-sm" className="lg:hidden" />
        }
      >
        <MenuIcon className="size-4" />
        <span className="sr-only">Open navigation</span>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 bg-sidebar p-0">
        <SheetHeader className="border-b border-sidebar-border p-4 text-left">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarBrand />
        </SheetHeader>
        <div className="p-3">
          <NavLinks />
        </div>
      </SheetContent>
    </Sheet>
  );
}
