import { appConfig } from "../config/app-config.js";
import { apiRequest } from "../core/api-client.js";

export const demoAnalysis = {
  id: "demo-analysis-041", status: "Completed · demo", createdAt: "2026-10-12T09:30:00Z",
  summary: { applianceCount: 5, fittingsCount: 6, avgConfidence: 91 },
  detections: [
    { name:"Split air conditioner", category:"Appliance", count:1, confidence:.91, watts:1200 },
    { name:"LED television", category:"Appliance", count:1, confidence:.96, watts:110 },
    { name:"Refrigerator", category:"Appliance", count:1, confidence:.94, watts:180 },
    { name:"Ceiling light", category:"Lighting", count:4, confidence:.89, watts:9 }
  ]
};
export const analysisService = {
  async get(id) { return appConfig.mode === "demo" ? { ...demoAnalysis, id: id || demoAnalysis.id, demo: true } : apiRequest(`${appConfig.endpoints.analyses}/${encodeURIComponent(id)}`); },
  async start(uploadId) {
    if (appConfig.mode === "demo") throw new Error("Analysis jobs require an uploaded video and connected backend. The displayed analysis is labeled sample data.");
    return apiRequest(appConfig.endpoints.analyses, { method: "POST", body: { uploadId } });
  }
};
