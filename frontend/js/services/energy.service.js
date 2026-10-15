import { appConfig } from "../config/app-config.js";
import { apiRequest } from "../core/api-client.js";
import { deviceService } from "./device.service.js";
import { calculateEnergy } from "../energy/energy-calculator.js";

export const energyService = {
  async overview() {
    if (appConfig.mode !== "demo") return apiRequest(appConfig.endpoints.energy);
    const tariff = Number(localStorage.getItem("visiontwin-tariff") || 9);
    const multiplier=Number(localStorage.getItem("visiontwin-runtime-multiplier")||100)/100;
    const devices=await deviceService.list();
    const dailyKwh = devices.reduce((sum, device) => sum + calculateEnergy(device.watts, Math.min(24,device.hours*multiplier)), 0);
    return { dailyKwh, monthlyKwh: dailyKwh * 30, monthlyCost: dailyKwh * 30 * tariff, tariff, devices, demo: true };
  }
};
