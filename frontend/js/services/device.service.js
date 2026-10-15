import { appConfig } from "../config/app-config.js";
import { apiRequest } from "../core/api-client.js";

export const demoDevices = [
  { id:"dev-1", name:"Split air conditioner", category:"Climate", watts:1200, hours:6.5, confidence:91, status:"Review suggested", icon:"snow" },
  { id:"dev-2", name:"LED television", category:"Entertainment", watts:110, hours:4, confidence:96, status:"Verified", icon:"tv" },
  { id:"dev-3", name:"Refrigerator", category:"Kitchen", watts:180, hours:24, confidence:94, status:"Verified", icon:"refrigerator" },
  { id:"dev-4", name:"Ceiling lights", category:"Lighting", watts:36, hours:5, confidence:89, status:"Review suggested", icon:"lightbulb" },
  { id:"dev-5", name:"Laptop", category:"Electronics", watts:65, hours:7, confidence:87, status:"Verified", icon:"laptop" }
];
export const deviceService = {
  async list() {
    if (appConfig.mode !== "demo") return apiRequest(appConfig.endpoints.devices);
    let overrides = {};
    try { overrides = JSON.parse(localStorage.getItem("visiontwin-device-overrides") || "{}"); }
    catch (error) { console.error("Invalid local device overrides", error); }
    return demoDevices.map((item) => ({ ...item, ...(overrides[item.id] || {}) }));
  },
  async update(id, changes) {
    if (appConfig.mode === "demo") return { id, ...changes, demo: true };
    return apiRequest(`${appConfig.endpoints.devices}/${encodeURIComponent(id)}`, { method: "PATCH", body: changes });
  }
};
