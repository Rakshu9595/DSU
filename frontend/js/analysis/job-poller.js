export async function pollJobStatus(fetchStatus, { intervalMs = 1500, timeoutMs = 30000, signal } = {}) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (signal?.aborted) throw signal.reason || new DOMException("Polling cancelled", "AbortError");
    const status = await fetchStatus();
    if (["completed","failed","cancelled"].includes(status.status)) return status;
    await new Promise((resolve, reject) => {
      const timer = setTimeout(resolve, intervalMs);
      signal?.addEventListener("abort", () => { clearTimeout(timer); reject(signal.reason); }, { once:true });
    });
  }
  throw new Error("Analysis status polling timed out.");
}
