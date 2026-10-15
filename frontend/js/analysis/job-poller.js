export async function pollJobStatus(fetchStatus, { intervalMs = 1500, timeoutMs = 30000, signal } = {}) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (signal?.aborted) throw signal.reason || new DOMException("Polling cancelled", "AbortError");
    const status = await fetchStatus();
    if (["completed","complete","succeeded","success","failed","error","cancelled"].includes(String(status?.status).toLowerCase())) return status;
    await new Promise((resolve, reject) => {
      const cleanup=()=>signal?.removeEventListener("abort",abort);
      const timer=setTimeout(()=>{cleanup();resolve();},intervalMs);
      const abort=()=>{clearTimeout(timer);cleanup();reject(signal.reason||new DOMException("Polling cancelled","AbortError"));};
      signal?.addEventListener("abort",abort,{once:true});
    });
  }
  throw new Error("Analysis status polling timed out.");
}
