import { Router } from 'express';
import authRoutes from './auth.routes.js';
import projectRoutes from './project.routes.js';
import deviceRoutes from './device.routes.js';
import uploadRoutes from './upload.routes.js';
import analysisRoutes from './analysis.routes.js';
import energyRoutes from './energy.routes.js';
import digitalTwinRoutes from './digital-twin.routes.js';
import scenarioRoutes from './scenario.routes.js';
import recommendationRoutes from './recommendation.routes.js';
import reportRoutes from './report.routes.js';
import settingsRoutes from './settings.routes.js';
import userRoutes from './user.routes.js';
import healthRoutes from './health.routes.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/projects', projectRoutes);
router.use('/devices', deviceRoutes);
router.use('/upload', uploadRoutes);
router.use('/analysis', analysisRoutes);
router.use('/energy', energyRoutes);
router.use('/digital-twin', digitalTwinRoutes);
router.use('/scenarios', scenarioRoutes);
router.use('/recommendations', recommendationRoutes);
router.use('/reports', reportRoutes);
router.use('/settings', settingsRoutes);
router.use('/users', userRoutes);

export default router;
