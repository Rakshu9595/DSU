import { Router } from 'express';
import * as digitalTwinController from '../controllers/digital-twin.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { validateRequest } from '../middleware/validate-request.js';
import { updateSceneSchema } from '../validators/digital-twin.validator.js';

const router = Router();

router.use(authenticate);

router.get('/project/:projectId', digitalTwinController.getScene);
router.get('/project/:projectId/scene', digitalTwinController.getScene);
router.put(
  '/project/:projectId',
  validateRequest({ body: updateSceneSchema }),
  digitalTwinController.updateScene
);
router.put(
  '/project/:projectId/scene',
  validateRequest({ body: updateSceneSchema }),
  digitalTwinController.updateScene
);
router.put(
  '/project/:projectId/dimensions',
  digitalTwinController.updateScene
);

export default router;
