import { VideoAsset } from '../models/VideoAsset.js';
import { Project } from '../models/Project.js';
import { analysisOrchestrator } from './analysis-orchestrator.service.js';
import { AppError } from '../utils/app-error.js';

export class UploadService {
  async handleVideoUpload(file, projectId, userId) {
    if (!file) throw new AppError('No video file provided', 400);

    const project = await Project.findOne({ _id: projectId, userId });
    if (!project) throw new AppError('Project not found or unauthorized', 404);

    const videoAsset = await VideoAsset.create({
      projectId,
      userId,
      originalFilename: file.originalname,
      storedFilename: file.filename,
      filePath: file.path,
      fileSize: file.size,
      mimeType: file.mimetype,
      status: 'uploaded'
    });

    // Automatically trigger analysis orchestration
    const analysisJob = await analysisOrchestrator.startAnalysis(
      videoAsset._id,
      projectId,
      userId
    );

    return {
      videoAsset,
      analysisJob
    };
  }

  async getVideosByProject(projectId) {
    return VideoAsset.find({ projectId }).sort({ createdAt: -1 });
  }
}

export const uploadService = new UploadService();
