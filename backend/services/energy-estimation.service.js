import { Device } from '../models/Device.js';
import { Project } from '../models/Project.js';
import { EnergyEstimate } from '../models/EnergyEstimate.js';
import { computeDeviceEnergyMetrics } from '../utils/energy-math.js';
import { DEFAULT_TARIFF_INR, DEFAULT_EMISSION_FACTOR } from '../config/constants.js';
import { AppError } from '../utils/app-error.js';

export class EnergyEstimationService {
  /**
   * Recalculates and persists energy estimates for a given project
   */
  async recalculateProjectEnergy(projectId) {
    const project = await Project.findById(projectId);
    if (!project) {
      throw new AppError(`Project not found: ${projectId}`, 404);
    }

    const defaultTariff = project.electricityTariff || DEFAULT_TARIFF_INR;
    const defaultEmissionFactor = project.emissionFactor || DEFAULT_EMISSION_FACTOR;

    // Fetch all active devices for this project
    const devices = await Device.find({ projectId, isActive: true });

    let totalDailyKwh = 0;
    let totalMonthlyKwh = 0;
    let totalMonthlyCost = 0;
    let totalCarbonKg = 0;
    let appliancesCount = 0;
    let fittingsCount = 0;

    const deviceBreakdown = [];

    // Calculate individual metrics
    for (const dev of devices) {
      if (dev.isFitting) {
        fittingsCount++;
        continue;
      }

      appliancesCount++;
      const metrics = computeDeviceEnergyMetrics(dev, defaultTariff, defaultEmissionFactor);

      totalDailyKwh += metrics.dailyEnergyKwh;
      totalMonthlyKwh += metrics.monthlyEnergyKwh;
      totalMonthlyCost += metrics.monthlyCost;
      totalCarbonKg += metrics.carbonEmissionsKg;

      deviceBreakdown.push({
        deviceId: dev._id,
        name: dev.displayName,
        category: dev.category,
        powerRatingWatts: dev.powerRatingWatts,
        powerRatingSource: dev.powerRatingSource,
        dailyUsageHours: dev.dailyUsageHours,
        daysUsedPerMonth: dev.daysUsedPerMonth,
        dailyEnergyKwh: metrics.dailyEnergyKwh,
        monthlyEnergyKwh: metrics.monthlyEnergyKwh,
        monthlyCost: metrics.monthlyCost,
        carbonEmissionsKg: metrics.carbonEmissionsKg,
        percentOfTotalEnergy: 0 // populated below
      });
    }

    // Populate percentage shares
    if (totalMonthlyKwh > 0) {
      deviceBreakdown.forEach((item) => {
        item.percentOfTotalEnergy = Number(((item.monthlyEnergyKwh / totalMonthlyKwh) * 100).toFixed(1));
      });
      // Sort breakdown descending by monthly energy consumption
      deviceBreakdown.sort((a, b) => b.monthlyEnergyKwh - a.monthlyEnergyKwh);
    }

    totalDailyKwh = Number(totalDailyKwh.toFixed(4));
    totalMonthlyKwh = Number(totalMonthlyKwh.toFixed(4));
    totalMonthlyCost = Number(totalMonthlyCost.toFixed(2));
    totalCarbonKg = Number(totalCarbonKg.toFixed(3));

    // Update or create EnergyEstimate
    const estimate = await EnergyEstimate.findOneAndUpdate(
      { projectId },
      {
        projectId,
        totalAppliancesCount: appliancesCount,
        totalFittingsCount: fittingsCount,
        totalDailyEnergyKwh: totalDailyKwh,
        totalMonthlyEnergyKwh: totalMonthlyKwh,
        totalMonthlyCost,
        totalCarbonEmissionsKg: totalCarbonKg,
        tariffApplied: defaultTariff,
        emissionFactorApplied: defaultEmissionFactor,
        deviceBreakdown,
        calculatedAt: new Date()
      },
      { upsert: true, returnDocument: 'after' }
    );

    return estimate;
  }

  /**
   * Retrieves latest energy estimate for a project
   */
  async getProjectEnergyEstimate(projectId) {
    let estimate = await EnergyEstimate.findOne({ projectId });
    if (!estimate) {
      estimate = await this.recalculateProjectEnergy(projectId);
    }
    return estimate;
  }
}

export const energyEstimationService = new EnergyEstimationService();
