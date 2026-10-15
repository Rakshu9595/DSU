import { createApp } from './app.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';

async function bootstrap() {
  try {
    // Connect to database
    await connectDatabase();

    const app = createApp();

    const server = app.listen(env.PORT, () => {
      logger.info(`=======================================================`);
      logger.info(` VisionTwin Platform running on http://127.0.0.1:${env.PORT}`);
      logger.info(` Environment: ${env.NODE_ENV}`);
      logger.info(` Model Server Base URL: ${env.MODEL_API_BASE_URL}`);
      logger.info(`=======================================================`);
    });

    // Graceful shutdown
    const handleShutdown = async (signal) => {
      logger.info(`Received ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        await disconnectDatabase();
        logger.info('Server closed. Process terminated.');
        process.exit(0);
      });
    };

    process.on('SIGINT', () => handleShutdown('SIGINT'));
    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  } catch (err) {
    logger.error('Failed to bootstrap VisionTwin backend server:', err);
    process.exit(1);
  }
}

bootstrap();
