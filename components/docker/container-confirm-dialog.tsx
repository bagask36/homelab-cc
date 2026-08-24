"use client";

import { useEffect, useState } from "react";
import {
  PlayIcon,
  RotateCwIcon,
  SquareIcon,
  TriangleAlertIcon,
} from "lucide-react";

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
import { cn } from "@/lib/utils";

type ContainerConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: "start" | "stop" | "restart";
  containerName: string;
  onConfirm: () => Promise<void>;
};

export function ContainerConfirmDialog({
  open,
  onOpenChange,
  action,
  containerName,
  onConfirm,
}: ContainerConfirmDialogProps) {
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const requiresNameMatch = action === "stop" || action === "restart";
  const canSubmit =
    !isSubmitting &&
    (!requiresNameMatch || confirmation === containerName);

  useEffect(() => {
    if (!open) {
      queueMicrotask(() => {
        setConfirmation("");
        setError(null);
        setIsSubmitting(false);
      });
    }
  }, [open]);

  async function handleConfirm() {
    setError(null);
    setIsSubmitting(true);

    try {
      await onConfirm();
      onOpenChange(false);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Action failed"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const config = actionConfig(action);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={!isSubmitting}>
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-full border",
                config.iconClassName
              )}
            >
              <config.icon className="size-4" aria-hidden />
            </div>
            <div className="min-w-0 space-y-1 pt-0.5">
              <DialogTitle>{config.title}</DialogTitle>
              <DialogDescription>{config.description(containerName)}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 px-6 pb-2 pt-1">
          <div className="rounded-lg border border-border bg-muted/30 px-3 py-2.5">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Target container
            </p>
            <p className="mt-1 truncate font-mono text-sm">{containerName}</p>
          </div>

          {requiresNameMatch && (
            <div className="space-y-2">
              <Label htmlFor="container-confirm">
                Type <span className="font-mono">{containerName}</span> to confirm
              </Label>
              <Input
                id="container-confirm"
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                placeholder={containerName}
                autoComplete="off"
                autoFocus
                disabled={isSubmitting}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && canSubmit) {
                    void handleConfirm();
                  }
                }}
              />
            </div>
          )}

          {requiresNameMatch && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
              <TriangleAlertIcon className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              <p>
                {action === "stop"
                  ? "Stopping a container will interrupt any running processes inside it."
                  : "Restarting will briefly stop and start the container again."}
              </p>
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant={config.buttonVariant}
            onClick={handleConfirm}
            disabled={!canSubmit}
          >
            {isSubmitting ? "Working…" : config.confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function actionConfig(action: "start" | "stop" | "restart") {
  switch (action) {
    case "start":
      return {
        icon: PlayIcon,
        iconClassName:
          "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
        title: "Start container",
        description: (name: string) =>
          `Bring ${name} back online. This action is logged in the audit trail.`,
        confirmLabel: "Start container",
        buttonVariant: "default" as const,
      };
    case "stop":
      return {
        icon: SquareIcon,
        iconClassName:
          "border-destructive/20 bg-destructive/10 text-destructive",
        title: "Stop container",
        description: (name: string) =>
          `Confirm you want to stop ${name}. This action cannot be undone from here.`,
        confirmLabel: "Stop container",
        buttonVariant: "destructive" as const,
      };
    case "restart":
      return {
        icon: RotateCwIcon,
        iconClassName:
          "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400",
        title: "Restart container",
        description: (name: string) =>
          `Confirm you want to restart ${name}. The container will be briefly unavailable.`,
        confirmLabel: "Restart container",
        buttonVariant: "default" as const,
      };
  }
}
