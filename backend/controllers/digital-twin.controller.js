import { digitalTwinService } from '../services/digital-twin.service.js';
import { ApiResponse } from '../utils/api-response.js';
import { asyncHandler } from '../utils/async-handler.js';

export const getScene = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const scene = await digitalTwinService.getOrCreateScene(projectId, req.user._id);
  return ApiResponse.success(res, scene, 'Digital Twin scene fetched');
});

export const updateScene = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const scene = await digitalTwinService.updateScene(projectId, req.body);
  return ApiResponse.success(res, scene, 'Digital Twin scene updated');
});
