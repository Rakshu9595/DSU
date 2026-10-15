import { appConfig } from "../config/app-config.js";
import { apiRequest } from "../core/api-client.js";

export const digitalTwinService = {
  async getScene(id = "demo-room") {
    if (appConfig.mode !== "demo") return apiRequest(`${appConfig.endpoints.digitalTwin}/${encodeURIComponent(id)}`);
    return { id, name:"Willow Creek · Living room", dimensions:{ width:6, depth:4.5, height:2.8 }, demo:true };
  },
  async saveScene(scene) {
    if (appConfig.mode === "demo") throw new Error("Saving a digital twin requires a connected backend. The current scene is available only for this session.");
    return apiRequest(`${appConfig.endpoints.digitalTwin}/${encodeURIComponent(scene.id)}`, { method:"PUT", body:scene });
  }
};
