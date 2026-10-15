import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend root or workspace root
dotenv.config({ path: path.resolve(__dirname, '../.env') });

export const env = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/visiontwin',
  MODEL_API_BASE_URL: process.env.MODEL_API_BASE_URL || 'http://127.0.0.1:8000',
  MODEL_API_TIMEOUT_MS: parseInt(process.env.MODEL_API_TIMEOUT_MS || '120000', 10),
  SESSION_SECRET: process.env.SESSION_SECRET || 'visiontwin_super_secret_session_key_2026',
  GENAI_PROVIDER: process.env.GENAI_PROVIDER || 'builtin',
  GENAI_API_KEY: process.env.GENAI_API_KEY || '',
  GENAI_MODEL: process.env.GENAI_MODEL || 'gemini-1.5-flash',
  UPLOAD_DIR: path.resolve(__dirname, '../../data/uploads'),
  PREDICTION_DIR: path.resolve(__dirname, '../../data/raw-predictions'),
  REPORT_DIR: path.resolve(__dirname, '../../data/reports'),
  MAX_VIDEO_SIZE_MB: parseInt(process.env.MAX_VIDEO_SIZE_MB || '500', 10)
};
