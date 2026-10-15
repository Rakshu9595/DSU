import { EnergyEstimate } from '../models/EnergyEstimate.js';

export const energyRepository = {
  findByProject: (projectId) => EnergyEstimate.findOne({ projectId }),
  upsertByProject: (projectId, data) =>
    EnergyEstimate.findOneAndUpdate({ projectId }, data, { upsert: true, returnDocument: 'after' })
};
