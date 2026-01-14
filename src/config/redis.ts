import Redis from 'ioredis';
import { config } from './env';
import { logger } from '../utils/logger.util';

export const createRedisConnection = (): Redis => {
  const redis = new Redis({
    host: config.redis.host,
    port: config.redis.port,
    password: config.redis.password,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    retryStrategy: (times: number) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
  });

  redis.on('connect', () => {
    logger.info('Redis connected successfully');
  });

  redis.on('error', (err) => {
    logger.error('Redis connection error', { error: err });
  });

  redis.on('close', () => {
    logger.warn('Redis connection closed');
  });

  return redis;
};