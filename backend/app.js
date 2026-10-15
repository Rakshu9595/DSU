import fs from 'fs';
import express from 'express';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import { configureCors } from './config/cors.js';
import { configureSession } from './config/session.js';
import { apiLimiter } from './middleware/rate-limit.js';
import { notFound } from './middleware/not-found.js';
import { errorHandler } from './middleware/error-handler.js';
import apiRoutes from './routes/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createApp() {
  const app = express();

  // Security Headers
  app.use(
    helmet({
      contentSecurityPolicy: false, // Disabled for flexible loading of Three.js CDNs, Chart.js, Google fonts
      crossOriginEmbedderPolicy: false
    })
  );

  // CORS
  app.use(configureCors());

  // Body Parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Sessions
  app.use(configureSession());

  // Rate Limiting for API routes
  app.use('/api', apiLimiter);

  // Mount API
  app.use('/api', apiRoutes);

  // Serve Frontend Static Assets
  const frontendPath = path.resolve(__dirname, '../frontend');
  app.use(express.static(frontendPath, {
    etag: false,
    maxAge: 0,
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.js') || filePath.endsWith('.html') || filePath.endsWith('.css')) {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      }
    }
  }));

  // Serve Single Page Application entry / fallback for non-API routes
  app.get(/^(?!\/api).*/, (req, res, next) => {
    // If requesting static file that doesn't exist, proceed to notFound
    if (path.extname(req.path)) {
      return next();
    }
    const cleanPath = req.path.replace(/^\//, '');
    const htmlFile = path.join(frontendPath, `${cleanPath}.html`);
    if (cleanPath && fs.existsSync(htmlFile)) {
      return res.sendFile(htmlFile);
    }
    res.sendFile(path.join(frontendPath, 'index.html'));
  });

  // 404 Handler
  app.use(notFound);

  // Error Handler
  app.use(errorHandler);

  return app;
}
