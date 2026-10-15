import { Router } from 'express';
import * as energyController from '../controllers/energy.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { validateRequest } from '../middleware/validate-request.js';
import { updateTariffSchema } from '../validators/energy.validator.js';

const router = Router();

router.use(authenticate);

router.get('/project/:projectId', energyController.getProjectEnergy);
router.post('/project/:projectId/recalculate', energyController.recalculateProjectEnergy);
router.put(
  '/project/:projectId/tariff',
  validateRequest({ body: updateTariffSchema }),
  energyController.updateProjectTariff
);
router.get('/project/:projectId/waste', energyController.getEnergyWasteAnalysis);

export default router;
