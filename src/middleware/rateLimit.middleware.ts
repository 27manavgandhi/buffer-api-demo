import rateLimit from 'express-rate-limit';
import { Request } from 'express';
import { createRedisConnection } from '../config/redis';
import { RedisStore } from '../utils/rateLimitStore.util';

const redis = createRedisConnection();

export const apiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore(redis, {
    prefix: 'rl:api:',
    expiry: 3600,
  }),
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later',
  },
  skip: (req: Request) => req.path === '/health',
});

export const userLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore(redis, {
    prefix: 'rl:user:',
    expiry: 3600,
  }),
  keyGenerator: (req: Request) => {
    return req.user?.userId || req.ip || 'unknown';
  },
  message: {
    success: false,
    message: 'Too many requests from this user, please try again later',
  },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore(redis, {
    prefix: 'rl:auth:',
    expiry: 900,
  }),
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again after 15 minutes',
  },
  skipSuccessfulRequests: true,
});

export const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore(redis, {
    prefix: 'rl:strict:',
    expiry: 3600,
  }),
  keyGenerator: (req: Request) => {
    return req.user?.userId || req.ip || 'unknown';
  },
  message: {
    success: false,
    message: 'Too many admin requests, please try again later',
  },
});