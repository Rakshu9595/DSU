import { logger } from '../config/logger.js';
import { env } from '../config/env.js';

export function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let details = err.details || null;

  // Handle Mongoose CastError (e.g. invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid format for field: ${err.path}`;
  }

  // Handle Mongoose duplicate key error
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `A record with this ${field} already exists.`;
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map((e) => e.message).join(', ');
  }

  // Log error
  if (statusCode >= 500) {
    logger.error(`[Unhandled Error] ${req.method} ${req.originalUrl}:`, err);
  } else {
    logger.warn(`[Client Error] ${req.method} ${req.originalUrl} (${statusCode}): ${message}`);
  }

  // Return clean JSON without leaking stack traces to clients
  res.status(statusCode).json({
    status: `${statusCode}`.startsWith('4') ? 'fail' : 'error',
    message,
    ...(details ? { details } : {}),
    ...(env.NODE_ENV === 'development' && statusCode >= 500 ? { stack: err.stack } : {})
  });
}
