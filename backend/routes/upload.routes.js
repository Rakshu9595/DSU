import { Router } from 'express';
import * as uploadController from '../controllers/upload.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { uploadVideo } from '../config/upload.js';
import { handleUploadError } from '../middleware/upload-error.js';
import { uploadLimiter } from '../middleware/rate-limit.js';

const router = Router();

router.use(authenticate);

router.post(
  '/',
  uploadLimiter,
  uploadVideo.single('video'),
  handleUploadError,
  uploadController.uploadRoomVideo
);

router.get('/project/:projectId', uploadController.getProjectVideos);

export default router;
