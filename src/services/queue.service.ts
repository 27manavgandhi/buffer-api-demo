import { Job } from 'bull';
import { postQueue } from '../queues/post.queue';
import { JobData } from '../types/post.types';
import { logger } from '../utils/logger.util';

export class QueueService {
  async addJob(data: JobData, delay: number): Promise<Job<JobData>> {
    const job = await postQueue.add(data, {
      delay,
      jobId: `post-${data.postId}`,
    });

    logger.info('Job added to queue', {
      jobId: job.id,
      postId: data.postId,
      delay,
    });

    return job;
  }

  async removeJob(jobId: string): Promise<void> {
    const job = await postQueue.getJob(jobId);
    if (job) {
      await job.remove();
      logger.info('Job removed from queue', { jobId });
    }
  }

  async getQueueStats() {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      postQueue.getWaitingCount(),
      postQueue.getActiveCount(),
      postQueue.getCompletedCount(),
      postQueue.getFailedCount(),
      postQueue.getDelayedCount(),
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
      total: waiting + active + completed + failed + delayed,
    };
  }

  async pauseQueue(): Promise<void> {
    await postQueue.pause();
    logger.warn('Queue paused');
  }

  async resumeQueue(): Promise<void> {
    await postQueue.resume();
    logger.info('Queue resumed');
  }

  async cleanQueue(grace: number = 86400000): Promise<void> {
    await postQueue.clean(grace, 'completed');
    await postQueue.clean(grace, 'failed');
    logger.info('Queue cleaned', { grace });
  }
}

export const queueService = new QueueService();