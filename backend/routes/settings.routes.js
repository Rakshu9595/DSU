import { Router } from 'express';
import * as settingsController from '../controllers/settings.controller.js';
import { authenticate } from '../middleware/authenticate.js';

const router = Router();

router.use(authenticate);

router.get('/', settingsController.getSettings);
router.put('/', settingsController.updateSettings);

export default router;
