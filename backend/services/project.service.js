import { Project } from '../models/Project.js';
import { Device } from '../models/Device.js';
import { VideoAsset } from '../models/VideoAsset.js';
import { AnalysisJob } from '../models/AnalysisJob.js';
import { DigitalTwinScene } from '../models/DigitalTwinScene.js';
import { EnergyEstimate } from '../models/EnergyEstimate.js';
import { EnergyScenario } from '../models/EnergyScenario.js';
import { Recommendation } from '../models/Recommendation.js';
import { Report } from '../models/Report.js';
import { energyEstimationService } from './energy-estimation.service.js';
import { digitalTwinService } from './digital-twin.service.js';
import { AppError } from '../utils/app-error.js';

export class ProjectService {
  async createProject(projectData, userId) {
    if (projectData.electricityTariffPerKwh !== undefined && projectData.electricityTariff === undefined) {
      projectData.electricityTariff = projectData.electricityTariffPerKwh;
    }
    const project = await Project.create({
      ...projectData,
      userId
    });

    // Initialize blank 3D scene and energy estimate
    await digitalTwinService.getOrCreateScene(project._id, userId);
    await energyEstimationService.recalculateProjectEnergy(project._id);

    return project;
  }

  async getProjectsByUser(userId) {
    return Project.find({ userId }).sort({ updatedAt: -1 });
  }

  async getProjectById(projectId, userId) {
    const project = await Project.findOne({ _id: projectId, userId });
    if (!project) throw new AppError('Project not found or access denied', 404);
    return project;
  }

  async updateProject(projectId, updateData, userId) {
    const project = await Project.findOne({ _id: projectId, userId });
    if (!project) throw new AppError('Project not found or access denied', 404);

    if (updateData.electricityTariffPerKwh !== undefined && updateData.electricityTariff === undefined) {
      updateData.electricityTariff = updateData.electricityTariffPerKwh;
    }

    const tariffChanged = updateData.electricityTariff && updateData.electricityTariff !== project.electricityTariff;
    const factorChanged = updateData.emissionFactor && updateData.emissionFactor !== project.emissionFactor;

    Object.assign(project, updateData);
    await project.save();

    if (tariffChanged || factorChanged) {
      await energyEstimationService.recalculateProjectEnergy(projectId);
    }

    if (updateData.roomDimensions) {
      await digitalTwinService.updateScene(projectId, { roomDimensions: updateData.roomDimensions });
    }

    return project;
  }

  async deleteProject(projectId, userId) {
    const project = await Project.findOne({ _id: projectId, userId });
    if (!project) throw new AppError('Project not found or access denied', 404);

    // Delete cascading project data
    await Device.deleteMany({ projectId });
    await VideoAsset.deleteMany({ projectId });
    await AnalysisJob.deleteMany({ projectId });
    await DigitalTwinScene.deleteMany({ projectId });
    await EnergyEstimate.deleteMany({ projectId });
    await EnergyScenario.deleteMany({ projectId });
    await Recommendation.deleteMany({ projectId });
    await Report.deleteMany({ projectId });
    await Project.findByIdAndDelete(projectId);

    return { message: 'Project and all associated data deleted successfully' };
  }
}

export const projectService = new ProjectService();
