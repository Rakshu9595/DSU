import { EnergyScenario } from '../models/EnergyScenario.js';

export const scenarioRepository = {
  findByProject: (projectId) => EnergyScenario.find({ projectId }).sort({ createdAt: -1 }),
  findById: (id) => EnergyScenario.findById(id),
  create: (data) => EnergyScenario.create(data),
  deleteById: (id) => EnergyScenario.findByIdAndDelete(id)
};
