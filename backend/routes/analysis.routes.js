import { Router } from 'express';
import * as analysisController from '../controllers/analysis.controller.js';
import { authenticate } from '../middleware/authenticate.js';

const router = Router();

// Health check endpoint is public so navbar and landing page can check model status
router.get('/health', analysisController.checkModelServerHealth);

router.use(authenticate);

router.get('/jobs/:jobId', analysisController.getJobStatus);
router.get('/jobs/:jobId/status', analysisController.getJobStatus);
router.get('/job/:jobId/status', analysisController.getJobStatus);
router.get('/project/:projectId/jobs', analysisController.getProjectJobs);
router.post('/jobs/:jobId/retry', analysisController.retryAnalysis);

export default router;
