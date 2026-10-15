import { Device } from '../models/Device.js';
import { calculateDailyEnergyKwh, calculateMonthlyEnergyKwh, calculateMonthlyCost } from '../utils/energy-math.js';

export class WasteAnalysisService {
  /**
   * Identifies excessive operating hours, inefficient appliances, and potential standby waste
   */
  async analyzeEnergyWaste(projectId, tariff = 8.0) {
    const devices = await Device.find({ projectId, isActive: true, isFitting: false });
    const wastePatterns = [];

    devices.forEach((dev) => {
      // 1. Excessive operating hours (> 12 hours for non-refrigerator / non-router)
      if (
        dev.dailyUsageHours > 12 &&
        dev.canonicalName !== 'refrigerator' &&
        dev.canonicalName !== 'router'
      ) {
        const excessHours = dev.dailyUsageHours - 8;
        const excessKwh = calculateMonthlyEnergyKwh(
          calculateDailyEnergyKwh(dev.powerRatingWatts, excessHours),
          dev.daysUsedPerMonth
        );

        wastePatterns.push({
          type: 'excessive_hours',
          severity: excessKwh > 50 ? 'high' : 'medium',
          deviceId: dev._id,
          deviceName: dev.displayName,
          message: `${dev.displayName} is assumed running ${dev.dailyUsageHours}h daily. Reducing by ${excessHours}h saves ~${excessKwh} kWh/mo.`,
          potentialMonthlyWasteKwh: excessKwh,
          potentialMonthlyWasteCost: calculateMonthlyCost(excessKwh, tariff)
        });
      }

      // 2. High wattage lighting
      if (dev.category === 'lighting' && dev.powerRatingWatts > 35) {
        const modernLedWatts = 12;
        const diffWatts = dev.powerRatingWatts - modernLedWatts;
        const excessKwh = calculateMonthlyEnergyKwh(
          calculateDailyEnergyKwh(diffWatts, dev.dailyUsageHours),
          dev.daysUsedPerMonth
        );

        wastePatterns.push({
          type: 'inefficient_lighting',
          severity: 'medium',
          deviceId: dev._id,
          deviceName: dev.displayName,
          message: `${dev.displayName} rating is ${dev.powerRatingWatts}W. Upgrading to a 12W LED bulb saves ~${excessKwh} kWh/mo.`,
          potentialMonthlyWasteKwh: excessKwh,
          potentialMonthlyWasteCost: calculateMonthlyCost(excessKwh, tariff)
        });
      }
    });

    return wastePatterns;
  }
}

export const wasteAnalysisService = new WasteAnalysisService();
