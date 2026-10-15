import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { validateRequest } from '../middleware/validate-request.js';
import { registerSchema, loginSchema } from '../validators/auth.validator.js';
import { authenticate } from '../middleware/authenticate.js';
import { authLimiter } from '../middleware/rate-limit.js';

const router = Router();

router.post('/register', authLimiter, validateRequest({ body: registerSchema }), authController.register);
router.post('/login', authLimiter, validateRequest({ body: loginSchema }), authController.login);
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.getMe);

export default router;
