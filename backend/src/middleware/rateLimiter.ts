import rateLimit from 'express-rate-limit';
import { RateLimitError } from '../utils/errors';
import env from '../config/env';

export const createRateLimiter = (options: {
  windowMs?: number;
  max?: number;
  message?: string;
  keyGenerator?: (req: Request) => string;
}) => {
  return rateLimit({
    windowMs: options.windowMs || env.RATE_LIMIT_WINDOW_MS,
    max: options.max || env.RATE_LIMIT_MAX_REQUESTS,
    message: { success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: options.message || 'Too many requests' } },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: options.keyGenerator || ((req) => req.ip || 'unknown'),
    handler: (_req, res) => {
      throw new RateLimitError(options.message || 'Too many requests');
    },
  });
};

export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window
  message: 'Too many authentication attempts, please try again later',
});

export const apiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
});

export const publicFormRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 submissions per minute per IP
  message: 'Too many form submissions, please try again later',
});

export const trackingRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 events per minute per IP
  message: 'Too many tracking events',
  keyGenerator: (req) => req.ip || 'unknown',
});