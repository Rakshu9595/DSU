import { Router } from 'express';
import * as scenarioController from '../controllers/scenario.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { validateRequest } from '../middleware/validate-request.js';
import { createScenarioSchema } from '../validators/scenario.validator.js';

const router = Router();

router.use(authenticate);

router.post(
  '/project/:projectId',
  validateRequest({ body: createScenarioSchema }),
  scenarioController.createScenario
);
router.get('/project/:projectId', scenarioController.getProjectScenarios);
router.get('/:scenarioId', scenarioController.getScenario);
router.delete('/:scenarioId', scenarioController.deleteScenario);

export default router;
