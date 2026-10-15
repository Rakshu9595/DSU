import { energyEstimationService } from '../services/energy-estimation.service.js';
import { wasteAnalysisService } from '../services/waste-analysis.service.js';
import { Project } from '../models/Project.js';
import { ApiResponse } from '../utils/api-response.js';
import { asyncHandler } from '../utils/async-handler.js';
import { AppError } from '../utils/app-error.js';

export const getProjectEnergy = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const estimate = await energyEstimationService.getProjectEnergyEstimate(projectId);
  return ApiResponse.success(res, estimate, 'Energy estimates fetched');
});

export const recalculateProjectEnergy = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const estimate = await energyEstimationService.recalculateProjectEnergy(projectId);
  return ApiResponse.success(res, estimate, 'Energy estimates recalculated');
});

export const updateProjectTariff = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { electricityTariff, emissionFactor } = req.body;

  const project = await Project.findById(projectId);
  if (!project) throw new AppError('Project not found', 404);

  if (electricityTariff !== undefined) project.electricityTariff = electricityTariff;
  if (emissionFactor !== undefined) project.emissionFactor = emissionFactor;
  await project.save();

  const updatedEstimate = await energyEstimationService.recalculateProjectEnergy(projectId);

  return ApiResponse.success(
    res,
    { project, energyEstimate: updatedEstimate },
    'Electricity tariff updated and metrics recalculated'
  );
});

export const getEnergyWasteAnalysis = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const project = await Project.findById(projectId);
  if (!project) throw new AppError('Project not found', 404);

  const waste = await wasteAnalysisService.analyzeEnergyWaste(projectId, project.electricityTariff);
  return ApiResponse.success(res, waste, 'Energy waste patterns identified');
});
