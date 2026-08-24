import { writeAuditLog } from "@/lib/audit/logger";
import type { SessionUser } from "@/lib/auth/session";
import {
  fetchContainerLogs,
  resolveContainer,
  restartContainer,
  startContainer,
  stopContainer,
} from "@/lib/docker/actions";
import type { AuditAction } from "@/types/audit";
import type { ContainerActionRequest } from "@/types/docker-control";

type ControlAction = Exclude<AuditAction, "container.logs">;

export class ContainerControlError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export function validateContainerConfirmation(
  request: ContainerActionRequest,
  containerName: string,
  requireNameMatch: boolean
): void {
  if (!request.confirmed) {
    throw new ContainerControlError("Explicit confirmation is required");
  }

  if (requireNameMatch && request.containerName !== containerName) {
    throw new ContainerControlError("Container name confirmation does not match");
  }
}

export async function performContainerAction(
  action: ControlAction,
  containerId: string,
  user: SessionUser,
  request: ContainerActionRequest
): Promise<{ message: string }> {
  const container = await resolveContainer(containerId);
  const requireNameMatch = action === "container.stop" || action === "container.restart";

  validateContainerConfirmation(request, container.name, requireNameMatch);

  try {
    switch (action) {
      case "container.start":
        await startContainer(containerId);
        break;
      case "container.stop":
        await stopContainer(containerId);
        break;
      case "container.restart":
        await restartContainer(containerId);
        break;
    }

    const message = `${actionLabel(action)} completed for ${container.name}`;

    await writeAuditLog({
      user,
      action,
      target: container.id,
      targetName: container.name,
      success: true,
      message,
    });

    return { message };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : `${actionLabel(action)} failed`;

    await writeAuditLog({
      user,
      action,
      target: container.id,
      targetName: container.name,
      success: false,
      message,
    });

    throw new ContainerControlError(message, 500);
  }
}

export async function getContainerLogsForUser(
  containerId: string,
  user: SessionUser,
  tail: number
): Promise<{ containerId: string; containerName: string; logs: string }> {
  const container = await resolveContainer(containerId);

  try {
    const logs = await fetchContainerLogs(containerId, tail);

    await writeAuditLog({
      user,
      action: "container.logs",
      target: container.id,
      targetName: container.name,
      success: true,
      message: `Fetched last ${tail} log lines`,
    });

    return {
      containerId: container.id,
      containerName: container.name,
      logs,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch container logs";

    await writeAuditLog({
      user,
      action: "container.logs",
      target: container.id,
      targetName: container.name,
      success: false,
      message,
    });

    throw new ContainerControlError(message, 500);
  }
}

function actionLabel(action: ControlAction): string {
  switch (action) {
    case "container.start":
      return "Start";
    case "container.stop":
      return "Stop";
    case "container.restart":
      return "Restart";
  }
}
