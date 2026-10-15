import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { env } from './env.js';
import { ALLOWED_VIDEO_EXTENSIONS, SAFETY_LIMITS } from './constants.js';
import { AppError } from '../utils/app-error.js';

// Ensure directories exist
if (!fs.existsSync(env.UPLOAD_DIR)) {
  fs.mkdirSync(env.UPLOAD_DIR, { recursive: true });
}
if (!fs.existsSync(env.PREDICTION_DIR)) {
  fs.mkdirSync(env.PREDICTION_DIR, { recursive: true });
}
if (!fs.existsSync(env.REPORT_DIR)) {
  fs.mkdirSync(env.REPORT_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, env.UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
    const ext = path.extname(file.originalname).toLowerCase();
    const sanitizedBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    cb(null, `${sanitizedBase}_${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_VIDEO_EXTENSIONS.includes(ext)) {
    return cb(
      new AppError(
        `Unsupported video format '${ext}'. Allowed formats: ${ALLOWED_VIDEO_EXTENSIONS.join(', ')}`,
        400
      ),
      false
    );
  }
  cb(null, true);
};

export const uploadVideo = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: SAFETY_LIMITS.MAX_VIDEO_SIZE_MB * 1024 * 1024
  }
});
