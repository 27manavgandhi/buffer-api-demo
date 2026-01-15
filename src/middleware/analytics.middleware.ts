import responseTime from 'response-time';
import { Request, Response } from 'express';
import { logger } from '../utils/logger.util';
import { analyticsService } from '../services/analytics.service';

export const trackResponseTime = responseTime(
  (req: Request, res: Response, time: number) => {
    if (req.path === '/health') {
      return;
    }

    const analyticsData = {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      responseTime: `${time.toFixed(2)}ms`,
      userId: req.user?.userId || 'anonymous',
      ip: req.ip || 'unknown',
      requestId: req.requestId,
    };

    logger.info('API Request', analyticsData);

    analyticsService
      .recordRequest({
        userId: req.user?.userId,
        endpoint: req.path,
        method: req.method,
        statusCode: res.statusCode,
        responseTime: time,
        ip: req.ip || 'unknown',
        userAgent: req.headers['user-agent'],
      })
      .catch((err) => {
        logger.error('Analytics recording failed', {
          error: err instanceof Error ? err.message : 'Unknown error',
          requestId: req.requestId,
        });
      });
  }
);