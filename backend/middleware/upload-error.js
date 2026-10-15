import multer from 'multer';
import { AppError } from '../utils/app-error.js';
import { SAFETY_LIMITS } from '../config/constants.js';

export function handleUploadError(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return next(
        new AppError(
          `Video file exceeds maximum allowed size of ${SAFETY_LIMITS.MAX_VIDEO_SIZE_MB}MB.`,
          413
        )
      );
    }
    return next(new AppError(`Upload error: ${err.message}`, 400));
  }
  next(err);
}
