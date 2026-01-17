// src/middleware/analytics.middleware.ts
import responseTime from 'response-time';
import { Request, Response } from 'express';
import { logger } from '../utils/logger.util';
import { analyticsService } from '../services/analytics.service';

export const trackResponseTime = responseTime(
  (req: Request, res: Response, time: number) => {
    // Skip health endpoint and test environment
    if (req.path === '/health' || process.env.NODE_ENV === 'test') {
      return;
    }

    const userId = req.user?.userId;
    
    const analyticsData = {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      responseTime: `${time.toFixed(2)}ms`,
      userId: userId || 'anonymous',
      ip: req.ip || 'unknown',
      requestId: req.requestId,
    };

    logger.info('API Request', analyticsData);

    // Only record analytics if we have a userId (authenticated request)
    // This ensures we're tracking actual user activity, not anonymous requests
    if (userId) {
      analyticsService
        .recordRequest({
          userId: userId,
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
  }
);