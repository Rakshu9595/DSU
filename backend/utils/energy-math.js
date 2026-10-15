import { DEFAULT_TARIFF_INR, DEFAULT_EMISSION_FACTOR } from '../config/constants.js';

/**
 * Calculates daily energy consumption in kWh
 * Formula: Power rating (W) * Daily usage hours / 1000
 */
export function calculateDailyEnergyKwh(powerRatingWatts, dailyUsageHours) {
  if (!powerRatingWatts || powerRatingWatts <= 0 || !dailyUsageHours || dailyUsageHours <= 0) {
    return 0;
  }
  return Number(((powerRatingWatts * dailyUsageHours) / 1000).toFixed(4));
}

/**
 * Calculates monthly energy consumption in kWh
 * Formula: Daily energy (kWh) * Days used per month
 */
export function calculateMonthlyEnergyKwh(dailyEnergyKwh, daysUsedPerMonth = 30) {
  if (!dailyEnergyKwh || dailyEnergyKwh <= 0 || !daysUsedPerMonth || daysUsedPerMonth <= 0) {
    return 0;
  }
  return Number((dailyEnergyKwh * daysUsedPerMonth).toFixed(4));
}

/**
 * Calculates monthly electricity cost
 * Formula: Monthly energy (kWh) * Electricity tariff per kWh
 */
export function calculateMonthlyCost(monthlyEnergyKwh, tariffPerKwh = DEFAULT_TARIFF_INR) {
  if (!monthlyEnergyKwh || monthlyEnergyKwh <= 0 || !tariffPerKwh || tariffPerKwh <= 0) {
    return 0;
  }
  return Number((monthlyEnergyKwh * tariffPerKwh).toFixed(2));
}

/**
 * Calculates carbon emissions in kg CO2e
 * Formula: Monthly energy (kWh) * emission factor (kg CO2e / kWh)
 */
export function calculateCarbonEmissionsKg(monthlyEnergyKwh, emissionFactor = DEFAULT_EMISSION_FACTOR) {
  if (!monthlyEnergyKwh || monthlyEnergyKwh <= 0 || !emissionFactor || emissionFactor <= 0) {
    return 0;
  }
  return Number((monthlyEnergyKwh * emissionFactor).toFixed(3));
}

/**
 * Calculates potential energy and cost savings between baseline and proposed scenarios
 */
export function calculateScenarioSavings(baselineMonthlyKwh, scenarioMonthlyKwh, tariffPerKwh = DEFAULT_TARIFF_INR) {
  const energySavingsKwh = Number((baselineMonthlyKwh - scenarioMonthlyKwh).toFixed(4));
  const costSavings = Number((energySavingsKwh * tariffPerKwh).toFixed(2));
  const percentSavings = baselineMonthlyKwh > 0
    ? Number(((energySavingsKwh / baselineMonthlyKwh) * 100).toFixed(1))
    : 0;

  return {
    energySavingsKwh: Math.max(0, energySavingsKwh),
    costSavings: Math.max(0, costSavings),
    percentSavings: Math.max(0, percentSavings)
  };
}

/**
 * Calculates all energy metrics for a device given its parameters
 */
export function computeDeviceEnergyMetrics(device, fallbackTariff = DEFAULT_TARIFF_INR, emissionFactor = DEFAULT_EMISSION_FACTOR) {
  const watts = Number(device.powerRatingWatts || 0);
  const hours = Number(device.dailyUsageHours || 0);
  const days = Number(device.daysUsedPerMonth || 30);
  const tariff = Number(device.electricityTariffPerKwh ?? fallbackTariff);

  const dailyKwh = calculateDailyEnergyKwh(watts, hours);
  const monthlyKwh = calculateMonthlyEnergyKwh(dailyKwh, days);
  const monthlyCost = calculateMonthlyCost(monthlyKwh, tariff);
  const carbonKg = calculateCarbonEmissionsKg(monthlyKwh, emissionFactor);

  return {
    dailyEnergyKwh: dailyKwh,
    monthlyEnergyKwh: monthlyKwh,
    monthlyCost,
    carbonEmissionsKg: carbonKg,
    tariffApplied: tariff
  };
}
