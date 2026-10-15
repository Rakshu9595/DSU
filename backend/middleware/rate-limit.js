import rateLimit from 'express-rate-limit';

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50,
  message: {
    status: 'fail',
    message: 'Too many authentication attempts. Please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

export const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 300,
  message: {
    status: 'fail',
    message: 'Too many requests. Please slow down.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

export const uploadLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 20,
  message: {
    status: 'fail',
    message: 'Too many video upload requests. Please try again shortly.'
  },
  standardHeaders: true,
  legacyHeaders: false
});
