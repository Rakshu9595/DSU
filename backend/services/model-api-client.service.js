import fs from 'fs';
import path from 'path';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { AppError } from '../utils/app-error.js';

export class ModelApiClientService {
  constructor(baseUrl = env.MODEL_API_BASE_URL, timeoutMs = env.MODEL_API_TIMEOUT_MS) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
    this.timeoutMs = timeoutMs;
  }

  /**
   * Health check on FastAPI model server
   */
  async checkHealth() {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(`${this.baseUrl}/api/health`, {
        signal: controller.signal
      });
      clearTimeout(timer);

      if (!res.ok) {
        return { isOnline: false, status: res.status, error: `HTTP ${res.status}` };
      }
      const data = await res.json();
      return { isOnline: true, ...data };
    } catch (err) {
      logger.warn(`FastAPI model server health check failed at ${this.baseUrl}: ${err.message}`);
      return { isOnline: false, error: err.message };
    }
  }

  /**
   * Submits a video file to FastAPI /api/analyze endpoint
   */
  async submitVideoAnalysis(videoFilePath, originalFilename) {
    if (!fs.existsSync(videoFilePath)) {
      throw new AppError(`Video file not found at ${videoFilePath}`, 404);
    }

    const fileBuffer = fs.readFileSync(videoFilePath);
    const blob = new Blob([fileBuffer]);
    const formData = new FormData();
    formData.append('video', blob, originalFilename || path.basename(videoFilePath));

    logger.info(`Submitting video to Model Server: ${this.baseUrl}/api/analyze`);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const res = await fetch(`${this.baseUrl}/api/analyze`, {
        method: 'POST',
        body: formData,
        signal: controller.signal
      });
      clearTimeout(timer);

      if (!res.ok) {
        const errorText = await res.text();
        throw new AppError(
          `Model server rejected video analysis (${res.status}): ${errorText}`,
          res.status >= 500 ? 502 : 400
        );
      }

      const data = await res.json();
      logger.info(`Model server accepted job ${data.job_id}`);
      return data; // { job_id, status: 'queued', status_url, summary_url, predictions_url }
    } catch (err) {
      clearTimeout(timer);
      if (err.name === 'AbortError') {
        throw new AppError('Model server request timed out during video upload.', 504);
      }
      if (err instanceof AppError) throw err;
      throw new AppError(`Failed to communicate with model server: ${err.message}`, 502);
    }
  }

  /**
   * Retrieves the current status of an analysis job
   */
  async getJobStatus(jobId) {
    try {
      const res = await fetch(`${this.baseUrl}/api/jobs/${jobId}`);
      if (res.status === 404) {
        throw new AppError(`Analysis job ${jobId} not found on model server.`, 404);
      }
      if (!res.ok) {
        const errText = await res.text();
        throw new AppError(`Model server error (${res.status}): ${errText}`, 502);
      }
      return await res.json();
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw new AppError(`Model server error fetching status for ${jobId}: ${err.message}`, 502);
    }
  }

  /**
   * Retrieves the summary of detections for a completed job
   */
  async getJobSummary(jobId) {
    try {
      const res = await fetch(`${this.baseUrl}/api/jobs/${jobId}/summary`);
      if (res.status === 202) {
        return { isProcessing: true };
      }
      if (!res.ok) {
        const errText = await res.text();
        throw new AppError(`Failed to fetch job summary (${res.status}): ${errText}`, 502);
      }
      const data = await res.json();
      return { isProcessing: false, ...data };
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw new AppError(`Model server error fetching summary for ${jobId}: ${err.message}`, 502);
    }
  }

  /**
   * Retrieves full frame-by-frame predictions for a completed job
   */
  async getJobPredictions(jobId) {
    try {
      const res = await fetch(`${this.baseUrl}/api/jobs/${jobId}/predictions`);
      if (res.status === 202) {
        return { isProcessing: true };
      }
      if (!res.ok) {
        const errText = await res.text();
        throw new AppError(`Failed to fetch job predictions (${res.status}): ${errText}`, 502);
      }
      const data = await res.json();
      return { isProcessing: false, ...data };
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw new AppError(`Model server error fetching predictions for ${jobId}: ${err.message}`, 502);
    }
  }
}

export const modelApiClient = new ModelApiClientService();
