import { recommendationService } from '../services/recommendation.service.js';
import { ApiResponse } from '../utils/api-response.js';
import { asyncHandler } from '../utils/async-handler.js';

export const getProjectRecommendations = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const recommendations = await recommendationService.getProjectRecommendations(projectId);
  return ApiResponse.success(res, recommendations, 'Recommendations fetched');
});

export const generateRecommendations = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const userGoals = req.body.goals || [];
  const recommendations = await recommendationService.generateProjectRecommendations(
    projectId,
    req.user._id,
    userGoals
  );
  return ApiResponse.created(res, recommendations, 'New recommendations generated');
});

export const updateRecommendationStatus = asyncHandler(async (req, res) => {
  const { recommendationId } = req.params;
  const updated = await recommendationService.updateStatus(recommendationId, req.body);
  return ApiResponse.success(res, updated, 'Recommendation status updated');
});
