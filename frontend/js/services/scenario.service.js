import { appConfig } from "../config/app-config.js";
import { apiRequest } from "../core/api-client.js";
import { demoDevices } from "./device.service.js";

export const scenarioService = {
  async list() {
    if (appConfig.mode !== "demo") return apiRequest(appConfig.endpoints.scenarios);
    const current = demoDevices.reduce((sum, item) => sum + item.watts * item.hours / 1000, 0);
    return [
      { name:"Current estimate", dailyKwh:current, savings:0 },
      { name:"Shift AC setpoint +1°C", dailyKwh:current - .78, savings:.78 * 30 * Number(localStorage.getItem("visiontwin-tariff") || 9) },
      { name:"Replace evening lights with LEDs", dailyKwh:current - .16, savings:.16 * 30 * Number(localStorage.getItem("visiontwin-tariff") || 9) }
    ];
  }
};
