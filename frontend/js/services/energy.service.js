import { appConfig } from "../config/app-config.js";
import { apiRequest } from "../core/api-client.js";
import { demoDevices } from "./device.service.js";
import { calculateEnergy } from "../energy/energy-calculator.js";

export const energyService = {
  async overview() {
    if (appConfig.mode !== "demo") return apiRequest(appConfig.endpoints.energy);
    const tariff = Number(localStorage.getItem("visiontwin-tariff") || 9);
    const dailyKwh = demoDevices.reduce((sum, device) => sum + calculateEnergy(device.watts, device.hours), 0);
    return { dailyKwh, monthlyKwh: dailyKwh * 30, monthlyCost: dailyKwh * 30 * tariff, tariff, devices: demoDevices, demo: true };
  }
};
