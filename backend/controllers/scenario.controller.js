import { scenarioSimulationService } from '../services/scenario-simulation.service.js';
import { ApiResponse } from '../utils/api-response.js';
import { asyncHandler } from '../utils/async-handler.js';

export const createScenario = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const scenario = await scenarioSimulationService.simulateScenario(projectId, req.user._id, req.body);
  return ApiResponse.created(res, scenario, 'Scenario simulated successfully');
});

export const getProjectScenarios = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const scenarios = await scenarioSimulationService.getScenariosByProject(projectId);
  return ApiResponse.success(res, scenarios, 'Scenarios fetched');
});

export const getScenario = asyncHandler(async (req, res) => {
  const { scenarioId } = req.params;
  const scenario = await scenarioSimulationService.getScenarioById(scenarioId);
  return ApiResponse.success(res, scenario, 'Scenario details fetched');
});

export const deleteScenario = asyncHandler(async (req, res) => {
  const { scenarioId } = req.params;
  const result = await scenarioSimulationService.deleteScenario(scenarioId);
  return ApiResponse.success(res, result, 'Scenario deleted');
});
