import { appConfig } from "../config/app-config.js";
import { apiRequest } from "../core/api-client.js";

export const uploadService = {
  async upload(file, { projectId, signal, onProgress } = {}) {
    if (appConfig.mode === "demo") throw new Error("Video uploads require a connected backend. This demo validates and previews files locally but does not upload them.");
    const form = new FormData();
    form.append("video", file);
    if (projectId) form.append("projectId", projectId);
    return apiRequest(appConfig.endpoints.uploads, {
      method: "POST", body: form, signal,
      onUploadProgress: onProgress
    });
  }
};
