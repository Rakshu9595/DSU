import { uploadService } from '../services/upload.service.js';
import { ApiResponse } from '../utils/api-response.js';
import { asyncHandler } from '../utils/async-handler.js';
import { AppError } from '../utils/app-error.js';

export const uploadRoomVideo = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new AppError('No video file uploaded', 400);
  }

  const { projectId } = req.body;
  if (!projectId) {
    throw new AppError('Project ID is required', 400);
  }

  const result = await uploadService.handleVideoUpload(req.file, projectId, req.user._id);

  return ApiResponse.created(
    res,
    result,
    'Video uploaded successfully. Analysis job has been queued.'
  );
});

export const getProjectVideos = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const videos = await uploadService.getVideosByProject(projectId);
  return ApiResponse.success(res, videos, 'Videos fetched');
});
