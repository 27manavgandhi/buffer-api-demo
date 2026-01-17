// src/middleware/rateLimit.middleware.ts
import rateLimit from 'express-rate-limit';
import { Request } from 'express';
import { createRedisConnection } from '../config/redis';
import { RedisStore } from '../utils/rateLimitStore.util';

const redis = createRedisConnection();

// Disable rate limiting in test environment but KEEP headers
const isTestEnvironment = process.env.NODE_ENV === 'test';

export const apiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: isTestEnvironment ? 10000 : 100, // Very high limit in tests
  standardHeaders: true,
  legacyHeaders: false,
  store: isTestEnvironment ? undefined : new RedisStore('rl:api:', redis, { expiry: 3600 }),
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later',
  },
  // FIX: Don't skip in test mode - we need headers for tests
  skip: (req: Request) => req.path === '/health',
});

export const userLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: isTestEnvironment ? 10000 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  store: isTestEnvironment ? undefined : new RedisStore('rl:user:', redis, { expiry: 3600 }),
  keyGenerator: (req: Request) => {
    return req.user?.userId || req.ip || 'unknown';
  },
  message: {
    success: false,
    message: 'Too many requests from this user, please try again later',
  },
  // FIX: Remove skip in test mode
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isTestEnvironment ? 10000 : 5, // Very high limit in tests
  standardHeaders: true,
  legacyHeaders: false,
  store: isTestEnvironment ? undefined : new RedisStore('rl:auth:', redis, { expiry: 900 }),
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again after 15 minutes',
  },
  skipSuccessfulRequests: true,
  // FIX: Remove skip in test mode
});

export const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: isTestEnvironment ? 10000 : 10,
  standardHeaders: true,
  legacyHeaders: false,
  store: isTestEnvironment ? undefined : new RedisStore('rl:strict:', redis, { expiry: 3600 }),
  keyGenerator: (req: Request) => {
    return req.user?.userId || req.ip || 'unknown';
  },
  message: {
    success: false,
    message: 'Too many admin requests, please try again later',
  },
  // FIX: Remove skip in test mode
});