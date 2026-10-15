import { Device } from '../models/Device.js';

export class PredictionSummaryService {
  async getProjectDetectionSummary(projectId) {
    const devices = await Device.find({ projectId, isActive: true });

    const appliances = devices.filter((d) => !d.isFitting);
    const fittings = devices.filter((d) => d.isFitting);

    const countsByClass = {};
    appliances.forEach((d) => {
      countsByClass[d.canonicalName] = (countsByClass[d.canonicalName] || 0) + 1;
    });

    const fittingCounts = {
      switches: fittings.filter((f) => f.fittingType === 'switch').length,
      sockets: fittings.filter((f) => f.fittingType === 'socket').length,
      other: fittings.filter((f) => f.fittingType === 'other').length
    };

    return {
      totalAppliances: appliances.length,
      totalFittings: fittings.length,
      countsByClass,
      fittingCounts
    };
  }
}

export const predictionSummaryService = new PredictionSummaryService();
