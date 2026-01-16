import { Store } from 'express-rate-limit';
import Redis from 'ioredis';
import { logger } from './logger.util';

export interface RateLimitStoreOptions {
  expiry: number;
}

export class RedisStore implements Store {
  private redis: Redis;
  public prefix: string;
  private expiry: number;

  constructor(prefix: string, redis: Redis, options: RateLimitStoreOptions) {
    this.prefix = prefix;
    this.redis = redis;
    this.expiry = options.expiry;
  }

  async increment(key: string): Promise<{ totalHits: number; resetTime: Date | undefined }> {
    const redisKey = `${this.prefix}${key}`;

    try {
      const result = await this.redis
        .multi()
        .incr(redisKey)
        .ttl(redisKey)
        .exec();

      if (!result) {
        throw new Error('Redis transaction failed');
      }

      const [[incrErr, totalHits], [ttlErr, ttl]] = result as [
        [Error | null, number],
        [Error | null, number]
      ];

      if (incrErr || ttlErr) {
        throw incrErr || ttlErr;
      }

      if (ttl === -1) {
        await this.redis.expire(redisKey, this.expiry);
      }

      const resetTime = ttl > 0 ? new Date(Date.now() + ttl * 1000) : undefined;

      return { totalHits, resetTime };
    } catch (error) {
      logger.error('Redis rate limit error, failing open', {
        error: error instanceof Error ? error.message : 'Unknown error',
        key: redisKey,
      });
      return { totalHits: 0, resetTime: undefined };
    }
  }

  async decrement(key: string): Promise<void> {
    const redisKey = `${this.prefix}${key}`;
    try {
      await this.redis.decr(redisKey);
    } catch (error) {
      logger.error('Redis decrement error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        key: redisKey,
      });
    }
  }

  async resetKey(key: string): Promise<void> {
    const redisKey = `${this.prefix}${key}`;
    try {
      await this.redis.del(redisKey);
    } catch (error) {
      logger.error('Redis reset key error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        key: redisKey,
      });
    }
  }
}