import { appConfig } from "../config/app-config.js";
import { apiRequest } from "../core/api-client.js";

const samples = [
  { id:"rec-1", title:"Try a slightly higher AC setpoint", category:"Cooling", priority:"High impact", reductionPercent:10, affectedDeviceIds:["dev-1"], detail:"A small setpoint adjustment may reduce cooling energy while maintaining comfort.", icon:"snow" },
  { id:"rec-2", title:"Review evening lighting schedule", category:"Lighting", priority:"Easy win", reductionPercent:15, affectedDeviceIds:["dev-4"], detail:"Check whether lights can be switched off in unoccupied rooms.", icon:"lightbulb" },
  { id:"rec-3", title:"Check standby use on entertainment devices", category:"Standby", priority:"Explore", reductionPercent:5, affectedDeviceIds:["dev-2"], detail:"Consider a switched power strip for devices that are not used overnight.", icon:"tv" }
];
export const recommendationService = {
  async list() { return appConfig.mode === "demo" ? samples : apiRequest(appConfig.endpoints.recommendations); },
  async feedback(id, helpful) {
    if (appConfig.mode === "demo") return { recorded: false, demo: true, id, helpful };
    return apiRequest(`${appConfig.endpoints.recommendations}/${encodeURIComponent(id)}/feedback`, { method:"POST", body:{ helpful } });
  }
};
