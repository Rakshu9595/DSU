import { Router } from 'express';
import * as deviceController from '../controllers/device.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { validateRequest } from '../middleware/validate-request.js';
import {
  updatePowerRatingSchema,
  createManualDeviceSchema,
  updateDeviceSchema
} from '../validators/device.validator.js';

const router = Router();

router.use(authenticate);

// IMPORTANT: User-editable power rating endpoints
router.patch(
  '/:deviceId/power-rating',
  validateRequest({ body: updatePowerRatingSchema }),
  deviceController.updatePowerRating
);

router.post(
  '/:deviceId/power-rating/reset',
  deviceController.resetPowerRating
);

// Device inventory management
router.get('/', deviceController.getDevices);
router.get('/project/:projectId', deviceController.getProjectDevices);
router.get('/:deviceId', deviceController.getDeviceById);
router.post('/', validateRequest({ body: createManualDeviceSchema }), deviceController.createDevice);
router.put('/:deviceId', validateRequest({ body: updateDeviceSchema }), deviceController.updateDevice);
router.delete('/:deviceId', deviceController.deleteDevice);

export default router;
