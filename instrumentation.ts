export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { ensureBootstrapUser } = await import("@/lib/auth/users");
    const { startMetricsCollector } = await import("@/lib/db/collector");

    await ensureBootstrapUser();
    startMetricsCollector();
  }
}
