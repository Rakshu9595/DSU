import { Recommendation } from '../models/Recommendation.js';
import { Project } from '../models/Project.js';
import { Device } from '../models/Device.js';
import { energyEstimationService } from './energy-estimation.service.js';
import { genAiService } from './genai.service.js';
import { AppError } from '../utils/app-error.js';

export class RecommendationService {
  /**
   * Generates new recommendations for a project
   */
  async generateProjectRecommendations(projectId, userId, userGoals = []) {
    const project = await Project.findById(projectId);
    if (!project) throw new AppError('Project not found', 404);

    const devices = await Device.find({ projectId, isActive: true });
    const energyEstimate = await energyEstimationService.getProjectEnergyEstimate(projectId);

    const recsData = await genAiService.generateRecommendations(
      project,
      devices,
      energyEstimate,
      userGoals
    );

    // Save generated recommendations
    const savedRecs = [];
    for (const item of recsData) {
      const rec = await Recommendation.create({
        projectId,
        userId,
        ...item
      });
      savedRecs.push(rec);
    }

    return savedRecs;
  }

  /**
   * Gets recommendations for a project
   */
  async getProjectRecommendations(projectId) {
    let recs = await Recommendation.find({ projectId, isDismissed: false }).sort({ priority: 1, createdAt: -1 });
    if (recs.length === 0) {
      // Auto generate if none exist yet
      const project = await Project.findById(projectId);
      if (project) {
        recs = await this.generateProjectRecommendations(projectId, project.userId);
      }
    }
    return recs;
  }

  /**
   * Updates recommendation status (applied/dismissed)
   */
  async updateStatus(recommendationId, updateData) {
    const rec = await Recommendation.findById(recommendationId);
    if (!rec) throw new AppError('Recommendation not found', 404);

    if (updateData.isApplied !== undefined) rec.isApplied = updateData.isApplied;
    if (updateData.isDismissed !== undefined) rec.isDismissed = updateData.isDismissed;

    await rec.save();
    return rec;
  }
}

export const recommendationService = new RecommendationService();
