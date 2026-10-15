import { Router } from 'express';
import mongoose from 'mongoose';
import { modelApiClient } from '../services/model-api-client.service.js';
import { connectDatabase } from '../config/database.js';
import { ApiResponse } from '../utils/api-response.js';

const router = Router();

router.get('/', async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    try {
      await connectDatabase();
    } catch (e) {
      // Handled by dbStatus check below
    }
  }
  const modelHealth = await modelApiClient.checkHealth();
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

  return ApiResponse.success(res, {
    status: 'ok',
    service: 'VisionTwin Backend API',
    version: '1.0.0',
    database: dbStatus,
    modelServer: modelHealth,
    timestamp: new Date().toISOString()
  });
});

export default router;
