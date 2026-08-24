"use client";

import { useRouter } from "next/navigation";
import { LogOutIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/useSession";

export function UserMenu() {
  const router = useRouter();
  const { data } = useSession();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function onLogout() {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.replace("/login");
      router.refresh();
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      {data?.user?.username && (
        <span className="hidden text-xs text-muted-foreground sm:inline">
          {data.user.username}
        </span>
      )}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onLogout}
        disabled={isLoggingOut}
      >
        <LogOutIcon className="size-3.5" aria-hidden />
        {isLoggingOut ? "Signing out…" : "Sign out"}
      </Button>
    </div>
  );
}
