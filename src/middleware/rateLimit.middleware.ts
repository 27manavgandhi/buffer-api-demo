import rateLimit from 'express-rate-limit';
import { Request } from 'express';
import { createRedisConnection } from '../config/redis';
import { RedisStore } from '../utils/rateLimitStore.util';
import { config } from '../config/env';

const redis = createRedisConnection();

const isTestEnvironment = config.isTest;

export const apiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: isTestEnvironment ? 10000 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore('rl:api:', redis, { expiry: 3600 }),
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later',
  },
  skip: (req: Request) => req.path === '/health' || isTestEnvironment,
});

export const userLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: isTestEnvironment ? 10000 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore('rl:user:', redis, { expiry: 3600 }),
  keyGenerator: (req: Request) => {
    return req.user?.userId || req.ip || 'unknown';
  },
  message: {
    success: false,
    message: 'Too many requests from this user, please try again later',
  },
  skip: () => isTestEnvironment,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isTestEnvironment ? 10000 : 5,
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore('rl:auth:', redis, { expiry: 900 }),
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again after 15 minutes',
  },
  skipSuccessfulRequests: true,
  skip: () => isTestEnvironment,
});

export const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: isTestEnvironment ? 10000 : 10,
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore('rl:strict:', redis, { expiry: 3600 }),
  keyGenerator: (req: Request) => {
    return req.user?.userId || req.ip || 'unknown';
  },
  message: {
    success: false,
    message: 'Too many admin requests, please try again later',
  },
  skip: () => isTestEnvironment,
});