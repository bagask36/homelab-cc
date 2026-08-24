const DEFAULT_POLL_INTERVAL = 3000;

export function getPollInterval(): number {
  const value = Number(process.env.NEXT_PUBLIC_METRICS_POLL_INTERVAL);
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_POLL_INTERVAL;
}

type MonitoringResponse = {
  status: "ok" | "partial" | "unavailable";
  errors?: string[];
};

export async function fetchMonitoring<T extends MonitoringResponse>(
  url: string
): Promise<T> {
  const response = await fetch(url);

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as T | null;

    if (body && body.status === "partial") {
      return body;
    }

    throw new Error(body?.errors?.[0] ?? `Failed to fetch ${url}`);
  }

  return response.json() as Promise<T>;
}
