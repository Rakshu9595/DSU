import { EnergyScenario } from '../models/EnergyScenario.js';
import { Project } from '../models/Project.js';
import { Device } from '../models/Device.js';
import { calculateDailyEnergyKwh, calculateMonthlyEnergyKwh, calculateMonthlyCost, calculateCarbonEmissionsKg } from '../utils/energy-math.js';
import { DEFAULT_TARIFF_INR, DEFAULT_EMISSION_FACTOR } from '../config/constants.js';
import { AppError } from '../utils/app-error.js';

export class ScenarioSimulationService {
  /**
   * Simulates an energy optimization scenario based on device adjustments
   */
  async simulateScenario(projectId, userId, scenarioData) {
    const project = await Project.findById(projectId);
    if (!project) throw new AppError('Project not found', 404);

    const tariff = project.electricityTariff || DEFAULT_TARIFF_INR;
    const emissionFactor = project.emissionFactor || DEFAULT_EMISSION_FACTOR;

    const devices = await Device.find({ projectId, isActive: true, isFitting: false });

    let baselineTotalMonthlyKwh = 0;
    let proposedTotalMonthlyKwh = 0;
    const detailedAdjustments = [];

    // Map adjustments by device ID
    const adjMap = new Map();
    (scenarioData.deviceAdjustments || []).forEach((adj) => {
      adjMap.set(adj.deviceId.toString(), adj);
    });

    for (const dev of devices) {
      const devIdStr = dev._id.toString();
      const adjustment = adjMap.get(devIdStr);

      const watts = adjustment?.proposedWatts !== undefined ? Number(adjustment.proposedWatts) : dev.powerRatingWatts;
      const baselineWatts = dev.powerRatingWatts;

      const baselineHours = dev.dailyUsageHours;
      const proposedHours = adjustment?.proposedDailyHours !== undefined
        ? Number(adjustment.proposedDailyHours)
        : baselineHours;

      const baselineDays = dev.daysUsedPerMonth;
      const proposedDays = adjustment?.proposedDaysPerMonth !== undefined
        ? Number(adjustment.proposedDaysPerMonth)
        : baselineDays;

      // Baseline math
      const baseDailyKwh = calculateDailyEnergyKwh(baselineWatts, baselineHours);
      const baseMonthlyKwh = calculateMonthlyEnergyKwh(baseDailyKwh, baselineDays);

      // Proposed math
      const propDailyKwh = calculateDailyEnergyKwh(watts, proposedHours);
      const propMonthlyKwh = calculateMonthlyEnergyKwh(propDailyKwh, proposedDays);

      const itemSavingsKwh = Number((baseMonthlyKwh - propMonthlyKwh).toFixed(4));
      const itemSavingsCost = Number((itemSavingsKwh * (dev.electricityTariffPerKwh || tariff)).toFixed(2));

      baselineTotalMonthlyKwh += baseMonthlyKwh;
      proposedTotalMonthlyKwh += propMonthlyKwh;

      detailedAdjustments.push({
        deviceId: dev._id,
        deviceName: dev.displayName,
        powerRatingWatts: watts,
        baselineDailyHours: baselineHours,
        proposedDailyHours: proposedHours,
        baselineDaysPerMonth: baselineDays,
        proposedDaysPerMonth: proposedDays,
        baselineMonthlyKwh: baseMonthlyKwh,
        proposedMonthlyKwh: propMonthlyKwh,
        monthlySavingsKwh: itemSavingsKwh,
        monthlySavingsCost: itemSavingsCost
      });
    }

    baselineTotalMonthlyKwh = Number(baselineTotalMonthlyKwh.toFixed(4));
    proposedTotalMonthlyKwh = Number(proposedTotalMonthlyKwh.toFixed(4));

    const totalEnergySavingsKwh = Number(Math.max(0, baselineTotalMonthlyKwh - proposedTotalMonthlyKwh).toFixed(4));
    const totalCostSavings = Number((totalEnergySavingsKwh * tariff).toFixed(2));
    const percentSavings = baselineTotalMonthlyKwh > 0
      ? Number(((totalEnergySavingsKwh / baselineTotalMonthlyKwh) * 100).toFixed(1))
      : 0;
    const carbonSavingsKg = Number(calculateCarbonEmissionsKg(totalEnergySavingsKwh, emissionFactor).toFixed(3));

    const scenario = await EnergyScenario.create({
      projectId,
      userId,
      name: scenarioData.name,
      description: scenarioData.description || '',
      baselineMetrics: {
        monthlyEnergyKwh: baselineTotalMonthlyKwh,
        monthlyCost: Number(calculateMonthlyCost(baselineTotalMonthlyKwh, tariff).toFixed(2)),
        carbonEmissionsKg: calculateCarbonEmissionsKg(baselineTotalMonthlyKwh, emissionFactor)
      },
      scenarioMetrics: {
        monthlyEnergyKwh: proposedTotalMonthlyKwh,
        monthlyCost: Number(calculateMonthlyCost(proposedTotalMonthlyKwh, tariff).toFixed(2)),
        carbonEmissionsKg: calculateCarbonEmissionsKg(proposedTotalMonthlyKwh, emissionFactor)
      },
      potentialSavings: {
        energySavingsKwh: totalEnergySavingsKwh,
        costSavings: totalCostSavings,
        percentSavings,
        carbonSavingsKg
      },
      deviceAdjustments: detailedAdjustments
    });

    return scenario;
  }

  /**
   * Lists scenarios for a project
   */
  async getScenariosByProject(projectId) {
    return EnergyScenario.find({ projectId }).sort({ createdAt: -1 });
  }

  /**
   * Gets a specific scenario
   */
  async getScenarioById(scenarioId) {
    const scenario = await EnergyScenario.findById(scenarioId);
    if (!scenario) throw new AppError('Scenario not found', 404);
    return scenario;
  }

  /**
   * Deletes a scenario
   */
  async deleteScenario(scenarioId) {
    await EnergyScenario.findByIdAndDelete(scenarioId);
    return { message: 'Scenario deleted successfully' };
  }
}

export const scenarioSimulationService = new ScenarioSimulationService();
