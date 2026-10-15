import { appConfig } from "../config/app-config.js";
import { apiRequest } from "../core/api-client.js";

const key = "visiontwin-settings";
export const settingsService = {
  async get() {
    if (appConfig.mode !== "demo") return apiRequest(appConfig.endpoints.settings);
    try { return JSON.parse(localStorage.getItem(key) || '{"name":"Alex Morgan","email":"alex@example.com","tariff":9,"currency":"INR","units":"metric","notifications":true}'); }
    catch (error) { console.error("Unable to read local demo settings", error); throw new Error("Saved settings could not be read."); }
  },
  async save(settings) {
    if (appConfig.mode !== "demo") return apiRequest(appConfig.endpoints.settings, { method:"PUT", body:settings });
    localStorage.setItem(key, JSON.stringify(settings));
    localStorage.setItem("visiontwin-tariff", String(settings.tariff));
    return { ...settings, savedLocally: true };
  }
};
