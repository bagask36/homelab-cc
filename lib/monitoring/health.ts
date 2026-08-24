import net from "net";

const DEFAULT_TIMEOUT_MS = 5000;

export type ProbeResult = {
  ok: boolean;
  responseTimeMs: number;
  message: string;
};

export async function probeHttp(
  url: string,
  timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<ProbeResult> {
  const start = Date.now();

  try {
    const response = await fetch(url, {
      method: "GET",
      signal: AbortSignal.timeout(timeoutMs),
      cache: "no-store",
    });

    const responseTimeMs = Date.now() - start;

    if (response.ok || response.status === 401 || response.status === 403) {
      return {
        ok: true,
        responseTimeMs,
        message: `HTTP ${response.status}`,
      };
    }

    return {
      ok: false,
      responseTimeMs,
      message: `HTTP ${response.status}`,
    };
  } catch (error) {
    return {
      ok: false,
      responseTimeMs: Date.now() - start,
      message: error instanceof Error ? error.message : "HTTP probe failed",
    };
  }
}

export async function probeTcp(
  host: string,
  port: number,
  timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<ProbeResult> {
  const start = Date.now();

  return new Promise((resolve) => {
    const socket = net.connect({ host, port });
    let settled = false;

    const finish = (result: ProbeResult) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve(result);
    };

    const timer = setTimeout(() => {
      finish({
        ok: false,
        responseTimeMs: Date.now() - start,
        message: "Connection timed out",
      });
    }, timeoutMs);

    socket.on("connect", () => {
      clearTimeout(timer);
      finish({
        ok: true,
        responseTimeMs: Date.now() - start,
        message: "Port open",
      });
    });

    socket.on("error", (error) => {
      clearTimeout(timer);
      finish({
        ok: false,
        responseTimeMs: Date.now() - start,
        message: error.message,
      });
    });
  });
}

export async function probeRedis(
  host: string,
  port: number,
  timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<ProbeResult> {
  const start = Date.now();

  return new Promise((resolve) => {
    const socket = net.connect({ host, port });
    let settled = false;

    const finish = (result: ProbeResult) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve(result);
    };

    const timer = setTimeout(() => {
      finish({
        ok: false,
        responseTimeMs: Date.now() - start,
        message: "Redis probe timed out",
      });
    }, timeoutMs);

    socket.on("connect", () => {
      socket.write("*1\r\n$4\r\nPING\r\n");
    });

    socket.on("data", (chunk) => {
      clearTimeout(timer);
      const payload = chunk.toString();
      finish({
        ok: payload.includes("PONG"),
        responseTimeMs: Date.now() - start,
        message: payload.includes("PONG") ? "PONG" : "Invalid Redis response",
      });
    });

    socket.on("error", (error) => {
      clearTimeout(timer);
      finish({
        ok: false,
        responseTimeMs: Date.now() - start,
        message: error.message,
      });
    });
  });
}
