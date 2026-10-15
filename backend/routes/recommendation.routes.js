import { Router } from 'express';
import * as recommendationController from '../controllers/recommendation.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { validateRequest } from '../middleware/validate-request.js';
import { updateRecommendationSchema } from '../validators/recommendation.validator.js';

const router = Router();

router.use(authenticate);

router.get('/project/:projectId', recommendationController.getProjectRecommendations);
router.post('/project/:projectId/generate', recommendationController.generateRecommendations);
router.patch(
  '/:recommendationId',
  validateRequest({ body: updateRecommendationSchema }),
  recommendationController.updateRecommendationStatus
);

export default router;
