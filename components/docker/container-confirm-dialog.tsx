"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85vh]">
        <SheetHeader>
          <SheetTitle>{actionLabel(action)} container</SheetTitle>
          <SheetDescription>
            {requiresNameMatch
              ? `Type "${containerName}" to confirm this action.`
              : `Confirm starting ${containerName}.`}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 px-4">
          <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm">
            <span className="text-muted-foreground">Container: </span>
            <span className="font-mono">{containerName}</span>
          </div>

          {requiresNameMatch && (
            <div className="space-y-2">
              <Label htmlFor="container-confirm">Container name</Label>
              <Input
                id="container-confirm"
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                placeholder={containerName}
                autoComplete="off"
                disabled={isSubmitting}
              />
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}
        </div>

        <SheetFooter className="px-4 pb-4">
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
            variant={action === "stop" ? "destructive" : "default"}
            onClick={handleConfirm}
            disabled={!canSubmit}
          >
            {isSubmitting ? "Working…" : actionLabel(action)}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function actionLabel(action: "start" | "stop" | "restart"): string {
  switch (action) {
    case "start":
      return "Start";
    case "stop":
      return "Stop";
    case "restart":
      return "Restart";
  }
}
