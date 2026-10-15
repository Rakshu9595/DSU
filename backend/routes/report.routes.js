import { Router } from 'express';
import * as reportController from '../controllers/report.controller.js';
import { authenticate } from '../middleware/authenticate.js';

const router = Router();

router.use(authenticate);

router.post('/project/:projectId/generate', reportController.generateReport);
router.get('/project/:projectId', reportController.getProjectReports);
router.get('/:reportId/download', reportController.downloadReport);

export default router;
