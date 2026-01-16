import { createRedisConnection } from '../config/redis';
import { logger } from '../utils/logger.util';

const redis = createRedisConnection();

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetTime: Date | null;
}

export async function getUserRateLimitInfo(userId: string): Promise<RateLimitInfo> {
  try {
    const key = `rl:user:${userId}`;
    const [current, ttl] = await Promise.all([
      redis.get(key),
      redis.ttl(key),
    ]);

    const limit = 100;
    const currentCount = current ? parseInt(current, 10) : 0;
    const remaining = Math.max(0, limit - currentCount);
    const resetTime = ttl > 0 ? new Date(Date.now() + ttl * 1000) : null;

    return { limit, remaining, resetTime };
  } catch (error) {
    logger.error('Failed to get rate limit info', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId,
    });
    return { limit: 100, remaining: 100, resetTime: null };
  }
}

export async function resetUserRateLimit(userId: string): Promise<void> {
  try {
    const key = `rl:user:${userId}`;
    await redis.del(key);
    logger.info('User rate limit reset', { userId });
  } catch (error) {
    logger.error('Failed to reset rate limit', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId,
    });
  }
}