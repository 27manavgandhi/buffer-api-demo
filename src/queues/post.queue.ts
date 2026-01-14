import Bull, { Queue, Job } from 'bull';
import { config } from '../config/env';
import { logger } from '../utils/logger.util';
import { JobData } from '../types/post.types';

export const postQueue: Queue<JobData> = new Bull('post-publishing', {
  redis: {
    host: config.redis.host,
    port: config.redis.port,
    password: config.redis.password,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: false,
    removeOnFail: false,
  },
});

postQueue.on('error', (error) => {
  logger.error('Queue error', { error: error.message });
});

postQueue.on('waiting', (jobId) => {
  logger.debug('Job waiting', { jobId });
});

postQueue.on('active', (job: Job<JobData>) => {
  logger.info('Job active', {
    jobId: job.id,
    postId: job.data.postId,
    platform: job.data.platform,
  });
});

postQueue.on('completed', (job: Job<JobData>) => {
  logger.info('Job completed', {
    jobId: job.id,
    postId: job.data.postId,
    platform: job.data.platform,
  });
});

postQueue.on('failed', (job: Job<JobData>, error: Error) => {
  logger.error('Job failed', {
    jobId: job.id,
    postId: job.data.postId,
    error: error.message,
    attempts: job.attemptsMade,
  });
});