import { connectDatabase } from './config/database';
import { createRedisConnection } from './config/redis';
import { setupPostWorker } from './workers/post.worker';
import { logger } from './utils/logger.util';
import { postQueue } from './queues/post.queue';

async function startWorker(): Promise<void> {
  try {
    await connectDatabase();

    const redis = createRedisConnection();

    setupPostWorker();

    logger.info('Worker process started successfully');

    const gracefulShutdown = async (signal: string): Promise<void> => {
      logger.info(`${signal} received, shutting down worker gracefully`);

      await postQueue.close();
      logger.info('Queue closed');

      redis.disconnect();
      logger.info('Redis disconnected');

      process.exit(0);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (error) {
    logger.error('Failed to start worker', { error });
    process.exit(1);
  }
}

startWorker();