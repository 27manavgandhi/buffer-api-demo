import { Request, Response } from 'express';
import { queueService } from '../services/queue.service';
import { asyncHandler } from '../utils/asyncHandler.util';
import { BadRequestError } from '../utils/errors.util';

export class QueueController {
  getStats = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const stats = await queueService.getQueueStats();

    res.status(200).json({
      success: true,
      data: stats,
    });
  });

  getJobs = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const status = (req.query.status as string) || 'waiting';
    const limit = parseInt(req.query.limit as string) || 10;

    if (limit < 1 || limit > 100) {
      throw new BadRequestError('Limit must be between 1 and 100');
    }

    const jobs = await queueService.getJobs(status, limit);

    res.status(200).json({
      success: true,
      data: {
        jobs,
        status,
        count: jobs.length,
      },
    });
  });

  pauseQueue = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    await queueService.pauseQueue();

    res.status(200).json({
      success: true,
      message: 'Queue paused successfully',
    });
  });

  resumeQueue = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    await queueService.resumeQueue();

    res.status(200).json({
      success: true,
      message: 'Queue resumed successfully',
    });
  });

  cleanQueue = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const grace = parseInt(req.query.grace as string) || 0;
    const limit = parseInt(req.query.limit as string) || 1000;

    await queueService.cleanQueue(grace);

    res.status(200).json({
      success: true,
      message: 'Queue cleaned successfully',
      data: { grace, limit },
    });
  });

  retryFailed = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const count = await queueService.retryFailedJobs();

    res.status(200).json({
      success: true,
      message: 'Failed jobs retried',
      data: { retriedCount: count },
    });
  });
}

export const queueController = new QueueController();