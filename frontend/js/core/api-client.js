import { appConfig } from "../config/app-config.js";

export class ApiError extends Error {
  constructor(message, status = 0, details = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

function requestWithUploadProgress(url, { method, body, headers, signal, timeout, onUploadProgress }) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const cleanup = () => signal.removeEventListener("abort", abort);
    const abort = () => xhr.abort();
    signal.addEventListener("abort", abort, { once:true });
    xhr.open(method, url, true);
    xhr.withCredentials = true;
    xhr.timeout = timeout;
    headers.forEach((value, key) => xhr.setRequestHeader(key, value));
    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable && event.total > 0) onUploadProgress(Math.round(event.loaded / event.total * 100));
    });
    xhr.addEventListener("load", () => {
      cleanup();
      let data = null;
      if (xhr.responseText) {
        try { data = JSON.parse(xhr.responseText); } catch { data = xhr.responseText; }
      }
      if (xhr.status < 200 || xhr.status >= 300) {
        const message = data && typeof data === "object" && data.message ? data.message : `Request failed (${xhr.status})`;
        reject(new ApiError(message, xhr.status, data));
      } else resolve(data);
    }, { once:true });
    xhr.addEventListener("error", () => { cleanup(); reject(new ApiError("Unable to connect to the service.")); }, { once:true });
    xhr.addEventListener("timeout", () => { cleanup(); reject(new ApiError("The request timed out.")); }, { once:true });
    xhr.addEventListener("abort", () => {
      cleanup();
      reject(new ApiError(signal.reason?.message || "The request was cancelled."));
    }, { once:true });
    if (signal.aborted) abort();
    else xhr.send(body);
  });
}

export async function apiRequest(path, { method = "GET", body, headers = {}, signal, timeout = appConfig.requestTimeoutMs, onUploadProgress } = {}) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(new DOMException("Request timed out", "TimeoutError")), timeout);
  const relayAbort = () => controller.abort(signal.reason);
  signal?.addEventListener("abort", relayAbort, { once: true });
  const requestHeaders = new Headers(headers);
  let requestBody = body;
  if (body !== undefined && !(body instanceof FormData) && typeof body !== "string") {
    requestHeaders.set("Content-Type", "application/json");
    requestBody = JSON.stringify(body);
  }
  const base = appConfig.apiBaseUrl.replace(/\/+$/, "");
  const route = String(path).replace(/^\/+/, "");
  const url = /^https?:\/\//i.test(base) ? new URL(route, `${base}/`).toString() : `${base}/${route}`;
  try {
    if (requestBody instanceof FormData && onUploadProgress) {
      return await requestWithUploadProgress(url, { method, body:requestBody, headers:requestHeaders, signal:controller.signal, timeout, onUploadProgress });
    }
    const response = await fetch(url, {
      method, headers: requestHeaders, body: requestBody, credentials: "include", signal: controller.signal
    });
    const raw = await response.text();
    let data = null;
    if (raw) {
      try { data = JSON.parse(raw); } catch { data = raw; }
    }
    if (!response.ok) {
      const message = data && typeof data === "object" && data.message ? data.message : `Request failed (${response.status})`;
      throw new ApiError(message, response.status, data);
    }
    return data;
  } catch (error) {
    if (error.name === "AbortError" || error.name === "TimeoutError") throw new ApiError("The request was cancelled or timed out.", 0, error);
    if (error instanceof ApiError) throw error;
    throw new ApiError(error.message || "Unable to connect to the service.", 0, error);
  } finally {
    window.clearTimeout(timeoutId);
    signal?.removeEventListener("abort", relayAbort);
  }
}

export function liveRequest(path, options) {
  if (appConfig.mode !== "live") throw new Error("Live API requests are unavailable in demo mode.");
  return apiRequest(path, options);
}
