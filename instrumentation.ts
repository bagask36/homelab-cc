export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startMetricsCollector } = await import("@/lib/db/collector");
    startMetricsCollector();
  }
}
