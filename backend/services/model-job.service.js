import { AnalysisJob } from '../models/AnalysisJob.js';
import { modelApiClient } from './model-api-client.service.js';
import { AppError } from '../utils/app-error.js';

export class ModelJobService {
  async getJobStatus(jobId) {
    const job = await AnalysisJob.findById(jobId);
    if (!job) throw new AppError('Job not found', 404);

    // If still in-flight, query model server for live updates
    if (job.status === 'queued' || job.status === 'processing') {
      try {
        const liveStatus = await modelApiClient.getJobStatus(job.externalJobId);
        if (liveStatus.status && liveStatus.status !== job.status) {
          job.status = liveStatus.status;
          await job.save();
        }
      } catch (err) {
        // Fall back to stored status
      }
    }

    return job;
  }
}

export const modelJobService = new ModelJobService();
