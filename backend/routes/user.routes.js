import { Router } from 'express';
import * as userController from '../controllers/user.controller.js';
import { authenticate } from '../middleware/authenticate.js';

const router = Router();

router.use(authenticate);

router.get('/profile', userController.getProfile);

export default router;
