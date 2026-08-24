import Docker from "dockerode";

let dockerClient: Docker | null = null;

export function getDockerSocketPath(): string {
  return process.env.DOCKER_SOCKET ?? "/var/run/docker.sock";
}

export function getDockerClient(): Docker {
  if (!dockerClient) {
    dockerClient = new Docker({ socketPath: getDockerSocketPath() });
  }

  return dockerClient;
}

export async function isDockerAvailable(): Promise<boolean> {
  try {
    await getDockerClient().ping();
    return true;
  } catch {
    return false;
  }
}
