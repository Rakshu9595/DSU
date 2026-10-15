import { analysisOrchestrator } from '../services/analysis-orchestrator.service.js';
import { modelApiClient } from '../services/model-api-client.service.js';
import { AnalysisJob } from '../models/AnalysisJob.js';
import { ApiResponse } from '../utils/api-response.js';
import { asyncHandler } from '../utils/async-handler.js';
import { AppError } from '../utils/app-error.js';

export const getJobStatus = asyncHandler(async (req, res) => {
  const { jobId } = req.params;
  const job = await analysisOrchestrator.getJob(jobId);
  return ApiResponse.success(res, job, 'Job status fetched');
});

export const getProjectJobs = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const jobs = await AnalysisJob.find({ projectId }).sort({ createdAt: -1 });
  return ApiResponse.success(res, jobs, 'Project analysis jobs fetched');
});

export const checkModelServerHealth = asyncHandler(async (req, res) => {
  const health = await modelApiClient.checkHealth();
  return ApiResponse.success(res, health, 'Model server health status');
});

export const retryAnalysis = asyncHandler(async (req, res) => {
  const { jobId } = req.params;
  const job = await AnalysisJob.findById(jobId);
  if (!job) throw new AppError('Job not found', 404);

  const newJob = await analysisOrchestrator.startAnalysis(job.videoId, job.projectId, req.user._id);
  return ApiResponse.created(res, newJob, 'Analysis re-queued successfully');
});
