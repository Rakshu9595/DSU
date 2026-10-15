import fs from 'fs';
import path from 'path';
import { logger } from '../config/logger.js';

export function safeUnlink(filePath) {
  try {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      logger.debug(`Safely removed temporary file: ${filePath}`);
    }
  } catch (err) {
    logger.warn(`Failed to remove file ${filePath}: ${err.message}`);
  }
}
