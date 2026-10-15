import { appConfig } from "../config/app-config.js";
import { apiRequest } from "../core/api-client.js";

export const demoAnalysis = {
  id: "demo-analysis-041", status: "Completed · demo", createdAt: "2026-10-12T09:30:00Z",
  summary: { applianceCount: 3, fittingsCount: 4, avgConfidence: 91 },
  detections: [
    { name:"Split air conditioner", category:"Appliance", count:1, confidence:.91, watts:1200, box:{x:.14,y:.12,width:.35,height:.22} },
    { name:"LED television", category:"Appliance", count:1, confidence:.96, watts:110, box:{x:.57,y:.48,width:.25,height:.27} },
    { name:"Refrigerator", category:"Appliance", count:1, confidence:.94, watts:180, box:{x:.73,y:.19,width:.16,height:.47} },
    { name:"Ceiling light", category:"Lighting", count:4, confidence:.89, watts:9, box:{x:.41,y:.08,width:.18,height:.1} }
  ]
};
export const analysisService = {
  async get(id) {
    if (appConfig.mode === "demo") return { ...demoAnalysis, id: id || demoAnalysis.id, demo: true };
    if (!id) throw new Error("An analysis job identifier is required.");
    return apiRequest(`${appConfig.endpoints.analyses}/${encodeURIComponent(id)}`);
  },
  async getStatus(id, options = {}) {
    if (appConfig.mode !== "live") throw new Error("Live analysis status is unavailable in demo mode.");
    if (!id) throw new Error("An analysis job identifier is required.");
    return apiRequest(`${appConfig.endpoints.analyses}/${encodeURIComponent(id)}`, options);
  },
  async start(uploadId) {
    if (appConfig.mode === "demo") throw new Error("Analysis jobs require an uploaded video and connected backend. The displayed analysis is labeled sample data.");
    return apiRequest(appConfig.endpoints.analyses, { method: "POST", body: { uploadId } });
  }
};
