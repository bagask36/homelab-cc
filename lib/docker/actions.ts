import { getDockerClient } from "@/lib/docker/client";

export type ContainerReference = {
  id: string;
  name: string;
};

export async function resolveContainer(
  containerId: string
): Promise<ContainerReference> {
  const docker = getDockerClient();
  const container = docker.getContainer(containerId);
  const inspect = await container.inspect();

  const name = inspect.Name?.replace(/^\//, "") ?? containerId;

  return {
    id: inspect.Id.slice(0, 12),
    name,
  };
}

export async function startContainer(containerId: string): Promise<void> {
  const container = getDockerClient().getContainer(containerId);
  await container.start();
}

export async function stopContainer(containerId: string): Promise<void> {
  const container = getDockerClient().getContainer(containerId);
  await container.stop({ t: 10 });
}

export async function restartContainer(containerId: string): Promise<void> {
  const container = getDockerClient().getContainer(containerId);
  await container.restart({ t: 10 });
}

export async function fetchContainerLogs(
  containerId: string,
  tail = 100
): Promise<string> {
  const container = getDockerClient().getContainer(containerId);
  const buffer = (await container.logs({
    stdout: true,
    stderr: true,
    tail,
    timestamps: true,
    follow: false,
  })) as Buffer;

  return demuxDockerLogs(buffer);
}

function demuxDockerLogs(buffer: Buffer): string {
  const lines: string[] = [];
  let offset = 0;

  while (offset < buffer.length) {
    if (offset + 8 > buffer.length) {
      lines.push(buffer.subarray(offset).toString("utf8"));
      break;
    }

    const length = buffer.readUInt32BE(offset + 4);
    offset += 8;

    if (length <= 0 || offset + length > buffer.length) {
      break;
    }

    lines.push(buffer.subarray(offset, offset + length).toString("utf8"));
    offset += length;
  }

  return lines.join("").trimEnd();
}
