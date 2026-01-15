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

    const isPaused = await postQueue.isPaused();

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
      paused: isPaused,
      total: waiting + active + completed + failed + delayed,
    };
  }

  async getJobs(status: string, limit: number = 10) {
    const validStatuses = ['waiting', 'active', 'completed', 'failed', 'delayed'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    const jobs = await postQueue.getJobs([status as any], 0, limit - 1);

    return jobs.map((job) => ({
      id: job.id,
      data: job.data,
      progress: job.progress(),
      attemptsMade: job.attemptsMade,
      processedOn: job.processedOn,
      finishedOn: job.finishedOn,
      failedReason: job.failedReason,
    }));
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

  async retryFailedJobs(): Promise<number> {
    const failedJobs = await postQueue.getFailed();
    let retriedCount = 0;

    for (const job of failedJobs) {
      try {
        await job.retry();
        retriedCount++;
      } catch (error) {
        logger.error('Failed to retry job', {
          jobId: job.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    logger.info('Retried failed jobs', { count: retriedCount });
    return retriedCount;
  }
}

export const queueService = new QueueService();