import { describe, it, expect } from 'vitest';
import {
  calculateDailyEnergyKwh,
  calculateMonthlyEnergyKwh,
  calculateMonthlyCost,
  calculateCarbonEmissionsKg,
  calculateScenarioSavings,
  computeDeviceEnergyMetrics
} from '../../utils/energy-math.js';

describe('Energy Math Calculation Engine', () => {
  it('calculates daily energy, monthly energy, and monthly cost matching the specification example', () => {
    // 75W fan, 8 hours per day
    const dailyKwh = calculateDailyEnergyKwh(75, 8);
    expect(dailyKwh).toBe(0.6); // 75 * 8 / 1000 = 0.6 kWh

    // 30 days per month
    const monthlyKwh = calculateMonthlyEnergyKwh(dailyKwh, 30);
    expect(monthlyKwh).toBe(18); // 0.6 * 30 = 18 kWh

    // ₹8 per kWh tariff
    const monthlyCost = calculateMonthlyCost(monthlyKwh, 8.0);
    expect(monthlyCost).toBe(144); // 18 * 8 = ₹144

    // Carbon emissions with 0.82 kg CO2e/kWh
    const carbonKg = calculateCarbonEmissionsKg(monthlyKwh, 0.82);
    expect(carbonKg).toBe(14.76); // 18 * 0.82 = 14.76 kg CO2e
  });

  it('rejects or safely returns 0 for zero or negative values', () => {
    expect(calculateDailyEnergyKwh(0, 8)).toBe(0);
    expect(calculateDailyEnergyKwh(-50, 8)).toBe(0);
    expect(calculateDailyEnergyKwh(75, 0)).toBe(0);
    expect(calculateDailyEnergyKwh(75, -2)).toBe(0);
    expect(calculateMonthlyEnergyKwh(0, 30)).toBe(0);
    expect(calculateMonthlyCost(0, 8)).toBe(0);
    expect(calculateCarbonEmissionsKg(0, 0.82)).toBe(0);
  });

  it('calculates scenario energy and financial savings correctly', () => {
    // Baseline: 100 kWh, Proposed: 75 kWh, Tariff: ₹8
    const savings = calculateScenarioSavings(100, 75, 8.0);
    expect(savings.energySavingsKwh).toBe(25);
    expect(savings.costSavings).toBe(200); // 25 * 8 = ₹200
    expect(savings.percentSavings).toBe(25.0);
  });

  it('computes full device energy metrics including custom device-level tariff override', () => {
    const mockDevice = {
      powerRatingWatts: 1500, // 1.5 kW AC
      dailyUsageHours: 6,
      daysUsedPerMonth: 30,
      electricityTariffPerKwh: 10.0 // Custom override
    };

    const metrics = computeDeviceEnergyMetrics(mockDevice, 8.0, 0.82);
    expect(metrics.dailyEnergyKwh).toBe(9.0); // 1500 * 6 / 1000
    expect(metrics.monthlyEnergyKwh).toBe(270.0); // 9.0 * 30
    expect(metrics.monthlyCost).toBe(2700.0); // 270 * 10
    expect(metrics.tariffApplied).toBe(10.0);
  });
});
