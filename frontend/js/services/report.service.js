import { appConfig } from "../config/app-config.js";
import { apiRequest } from "../core/api-client.js";
import { downloadText } from "../utils/download.js";

export const reportService = {
  async list() { return appConfig.mode === "demo" ? [{ id:"rpt-demo-01", name:"Willow Creek · Energy overview", createdAt:"2026-10-12", status:"Sample", kind:"Energy summary" }] : apiRequest(appConfig.endpoints.reports); },
  async download(id, format = "pdf") {
    if (appConfig.mode !== "demo") {
      const result = await apiRequest(`${appConfig.endpoints.reports}/${encodeURIComponent(id)}/download?format=${encodeURIComponent(format)}`);
      if (result?.url) location.assign(result.url);
      else throw new Error("Backend response did not contain a downloadable URL.");
      return;
    }
    if (format.toLowerCase() !== "csv") throw new Error("PDF files are not generated in demo mode. Connect the reports backend to download a real PDF.");
    downloadText("visiontwin-demo-energy.csv", "data:text/csv;charset=utf-8," + encodeURIComponent("data_type,device,estimated_watts,demo\nsample,Split air conditioner,1200,true\nsample,LED television,110,true\nsample,Refrigerator,180,true"));
  }
};
