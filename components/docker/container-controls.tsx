"use client";

import { useState } from "react";
import { FileTextIcon, PlayIcon, RotateCwIcon, SquareIcon } from "lucide-react";

import { ContainerConfirmDialog } from "@/components/docker/container-confirm-dialog";
import { ContainerLogsSheet } from "@/components/docker/container-logs-sheet";
import { Button } from "@/components/ui/button";
import type { ContainerMetrics, ContainerState } from "@/types/docker";

type ContainerControlsProps = {
  container: ContainerMetrics;
  onActionComplete?: () => void;
};

type PendingAction = "start" | "stop" | "restart";

export function ContainerControls({
  container,
  onActionComplete,
}: ContainerControlsProps) {
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(
    null
  );
  const [logsOpen, setLogsOpen] = useState(false);

  async function runAction(action: PendingAction) {
    const response = await fetch(
      `/api/docker/containers/${container.id}/${action}`,
      {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          confirmed: true,
          containerName: container.name,
        }),
      }
    );

    const body = (await response.json().catch(() => null)) as {
      errors?: string[];
    } | null;

    if (!response.ok) {
      throw new Error(body?.errors?.[0] ?? `Failed to ${action} container`);
    }

    onActionComplete?.();
  }

  const canStart = isStoppedState(container.state);
  const canStop = container.state === "running" || container.state === "restarting";
  const canRestart =
    container.state === "running" ||
    container.state === "restarting" ||
    container.state === "paused";

  return (
    <>
      <div className="flex flex-wrap items-center gap-1.5">
        {canStart && (
          <Button
            type="button"
            variant="outline"
            size="xs"
            onClick={() => setPendingAction("start")}
          >
            <PlayIcon className="size-3" aria-hidden />
            Start
          </Button>
        )}
        {canStop && (
          <Button
            type="button"
            variant="outline"
            size="xs"
            onClick={() => setPendingAction("stop")}
          >
            <SquareIcon className="size-3" aria-hidden />
            Stop
          </Button>
        )}
        {canRestart && (
          <Button
            type="button"
            variant="outline"
            size="xs"
            onClick={() => setPendingAction("restart")}
          >
            <RotateCwIcon className="size-3" aria-hidden />
            Restart
          </Button>
        )}
        <Button
          type="button"
          variant="ghost"
          size="xs"
          onClick={() => setLogsOpen(true)}
        >
          <FileTextIcon className="size-3" aria-hidden />
          Logs
        </Button>
      </div>

      {pendingAction && (
        <ContainerConfirmDialog
          open
          onOpenChange={(open) => {
            if (!open) setPendingAction(null);
          }}
          action={pendingAction}
          containerName={container.name}
          onConfirm={() => runAction(pendingAction)}
        />
      )}

      <ContainerLogsSheet
        container={container}
        open={logsOpen}
        onOpenChange={setLogsOpen}
      />
    </>
  );
}

function isStoppedState(state: ContainerState): boolean {
  return (
    state === "exited" ||
    state === "created" ||
    state === "dead" ||
    state === "stopped"
  );
}
