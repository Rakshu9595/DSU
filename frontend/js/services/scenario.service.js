import { appConfig } from "../config/app-config.js";
import { apiRequest } from "../core/api-client.js";
import { demoDevices } from "./device.service.js";

export const scenarioService = {
  async list() {
    if (appConfig.mode !== "demo") return apiRequest(appConfig.endpoints.scenarios);
    const current = demoDevices.reduce((sum, item) => sum + item.watts * Math.min(24,item.hours) / 1000, 0);
    return [
      { name:"Current estimate", dailyKwh:current, reductionPercent:0 },
      { name:"Shift AC setpoint +1°C", reductionPercent:10, affectedDeviceIds:["dev-1"] },
      { name:"Review evening lighting schedule", reductionPercent:15, affectedDeviceIds:["dev-4"] }
    ];
  }
};
