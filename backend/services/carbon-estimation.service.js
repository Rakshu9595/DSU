import { calculateCarbonEmissionsKg } from '../utils/energy-math.js';
import { DEFAULT_EMISSION_FACTOR } from '../config/constants.js';

export class CarbonEstimationService {
  estimateEmissions(monthlyKwh, emissionFactor = DEFAULT_EMISSION_FACTOR) {
    const emissionsKg = calculateCarbonEmissionsKg(monthlyKwh, emissionFactor);
    const treesEquivalent = Number((emissionsKg / 21.77).toFixed(1)); // Approx 21.77 kg CO2 absorbed per tree per year
    return {
      emissionsKg,
      emissionFactor,
      treesEquivalent
    };
  }
}

export const carbonEstimationService = new CarbonEstimationService();
