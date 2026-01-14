import { Job } from 'bull';
import { postQueue } from '../queues/post.queue';
import { postService } from '../services/post.service';
import { JobData } from '../types/post.types';
import { logger } from '../utils/logger.util';

export function setupPostWorker(): void {
  postQueue.process(async (job: Job<JobData>) => {
    const { postId, platform } = job.data;

    logger.info('Processing job', {
      jobId: job.id,
      postId,
      platform,
      attempt: job.attemptsMade + 1,
    });

    try {
      await postService.publishPost(postId);

      logger.info('Job processed successfully', {
        jobId: job.id,
        postId,
      });

      return { success: true, postId };
    } catch (error) {
      logger.error('Job processing failed', {
        jobId: job.id,
        postId,
        error: error instanceof Error ? error.message : 'Unknown error',
        attempt: job.attemptsMade + 1,
      });

      throw error;
    }
  });

  logger.info('Post worker initialized and ready to process jobs');
}