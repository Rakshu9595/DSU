import { describe, it, expect } from 'vitest';
import { calculateScenarioSavings } from '../../utils/energy-math.js';

describe('Scenario Simulation Unit Tests', () => {
  it('correctly calculates difference between baseline and scenario usage', () => {
    // Ceiling fan 8h -> 6h: 75W * 2h * 30d / 1000 = 4.5 kWh saved
    const baselineMonthlyKwh = 18.0; // 75W * 8h * 30d / 1000
    const scenarioMonthlyKwh = 13.5; // 75W * 6h * 30d / 1000
    const tariff = 8.0;

    const result = calculateScenarioSavings(baselineMonthlyKwh, scenarioMonthlyKwh, tariff);

    expect(result.energySavingsKwh).toBe(4.5);
    expect(result.costSavings).toBe(36.0); // 4.5 * 8 = ₹36
    expect(result.percentSavings).toBe(25.0); // (4.5 / 18) * 100 = 25%
  });

  it('handles negative or zero savings gracefully without negative metrics', () => {
    const result = calculateScenarioSavings(10, 15, 8.0);
    expect(result.energySavingsKwh).toBe(0);
    expect(result.costSavings).toBe(0);
    expect(result.percentSavings).toBe(0);
  });
});
