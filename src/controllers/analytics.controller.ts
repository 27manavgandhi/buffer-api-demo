import { Request, Response } from 'express';
import { analyticsService } from '../services/analytics.service';
import { asyncHandler } from '../utils/asyncHandler.util';
import { DateRangeQuery } from '../types/analytics.types';
import { BadRequestError } from '../utils/errors.util';

export class AnalyticsController {
  getSystemOverview = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const dateRange: DateRangeQuery = {
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
    };

    this.validateDateRange(dateRange);

    const stats = await analyticsService.getSystemStats(dateRange);

    res.status(200).json({
      success: true,
      data: stats,
    });
  });

  getUserAnalytics = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.params.userId;
    const dateRange: DateRangeQuery = {
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
    };

    this.validateDateRange(dateRange);

    const stats = await analyticsService.getUserStats(userId, dateRange);

    res.status(200).json({
      success: true,
      data: stats,
    });
  });

  getEndpointAnalytics = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const dateRange: DateRangeQuery = {
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
      };

      this.validateDateRange(dateRange);

      const stats = await analyticsService.getEndpointStats(dateRange);

      res.status(200).json({
        success: true,
        data: {
          endpoints: stats,
          count: stats.length,
        },
      });
    }
  );

  getErrorAnalytics = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const dateRange: DateRangeQuery = {
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
    };

    this.validateDateRange(dateRange);

    const stats = await analyticsService.getErrorStats(dateRange);

    res.status(200).json({
      success: true,
      data: {
        errors: stats,
        count: stats.length,
      },
    });
  });

  getPerformanceAnalytics = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const dateRange: DateRangeQuery = {
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
      };

      this.validateDateRange(dateRange);

      const stats = await analyticsService.getPerformanceStats(dateRange);

      res.status(200).json({
        success: true,
        data: {
          performance: stats,
          count: stats.length,
        },
      });
    }
  );

  private validateDateRange(dateRange: DateRangeQuery): void {
    if (dateRange.startDate && dateRange.endDate) {
      const start = new Date(dateRange.startDate);
      const end = new Date(dateRange.endDate);

      if (isNaN(start.getTime())) {
        throw new BadRequestError('Invalid startDate format');
      }
      if (isNaN(end.getTime())) {
        throw new BadRequestError('Invalid endDate format');
      }
      if (start > end) {
        throw new BadRequestError('startDate must be before endDate');
      }
    }
  }
}

export const analyticsController = new AnalyticsController();