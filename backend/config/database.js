import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from './logger.js';

let mongoMemoryServerInstance = null;

export async function connectDatabase() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  const primaryUri = env.MONGODB_URI;
  try {
    logger.info(`Attempting MongoDB connection: ${primaryUri}...`);
    await mongoose.connect(primaryUri, {
      serverSelectionTimeoutMS: 3000,
      connectTimeoutMS: 3000
    });
    logger.info(`Connected to MongoDB at ${primaryUri}`);
    return mongoose.connection;
  } catch (err) {
    logger.warn(`Standard MongoDB connection failed (${err.message}). Starting embedded database...`);
    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      mongoMemoryServerInstance = await MongoMemoryServer.create({
        binary: { version: '6.0.14' }
      });
      const fallbackUri = mongoMemoryServerInstance.getUri();
      await mongoose.connect(fallbackUri);
      logger.info(`Connected to embedded MongoDB at ${fallbackUri}`);
      return mongoose.connection;
    } catch (fallbackErr) {
      logger.error('Failed to start embedded database:', fallbackErr);
      throw fallbackErr;
    }
  }
}

export async function disconnectDatabase() {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    if (mongoMemoryServerInstance) {
      await mongoMemoryServerInstance.stop();
      mongoMemoryServerInstance = null;
    }
    logger.info('Database disconnected cleanly.');
  } catch (err) {
    logger.error('Error during database disconnect:', err);
  }
}
