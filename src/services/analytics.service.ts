import { ApiUsage } from '../models/ApiUsage.model';
import {
  RecordAnalyticsDTO,
  SystemStatsDTO,
  UserStatsDTO,
  EndpointStatsDTO,
  ErrorStatsDTO,
  PerformanceStatsDTO,
  DateRangeQuery,
} from '../types/analytics.types';
import { logger } from '../utils/logger.util';

export class AnalyticsService {
  async recordRequest(data: RecordAnalyticsDTO): Promise<void> {
    try {
      await ApiUsage.create({
        userId: data.userId || undefined,
        endpoint: data.endpoint,
        method: data.method,
        statusCode: data.statusCode,
        responseTime: data.responseTime,
        ip: data.ip,
        userAgent: data.userAgent,
        timestamp: new Date(),
      });
    } catch (error) {
      logger.error('Failed to record analytics', {
        error: error instanceof Error ? error.message : 'Unknown error',
        data,
      });
    }
  }

  async getSystemStats(dateRange?: DateRangeQuery): Promise<SystemStatsDTO> {
    try {
      const matchStage = this.buildDateMatchStage(dateRange);

      const [stats] = await ApiUsage.aggregate([
        { $match: matchStage },
        {
          $facet: {
            totalRequests: [{ $count: 'count' }],
            avgResponseTime: [
              { $group: { _id: null, avg: { $avg: '$responseTime' } } },
            ],
            errorCount: [
              { $match: { statusCode: { $gte: 400 } } },
              { $count: 'count' },
            ],
            topEndpoints: [
              { $group: { _id: '$endpoint', count: { $sum: 1 } } },
              { $sort: { count: -1 } },
              { $limit: 10 },
              {
                $project: {
                  _id: 0,
                  endpoint: '$_id',
                  count: 1,
                },
              },
            ],
          },
        },
      ]);

      const totalRequests = stats.totalRequests[0]?.count || 0;
      const avgResponseTime = stats.avgResponseTime[0]?.avg || 0;
      const errorCount = stats.errorCount[0]?.count || 0;
      const errorRate = totalRequests > 0 ? (errorCount / totalRequests) * 100 : 0;

      return {
        totalRequests,
        avgResponseTime: Math.round(avgResponseTime * 100) / 100,
        errorRate: Math.round(errorRate * 100) / 100,
        topEndpoints: stats.topEndpoints || [],
      };
    } catch (error) {
      logger.error('Failed to get system stats', { error });
      return {
        totalRequests: 0,
        avgResponseTime: 0,
        errorRate: 0,
        topEndpoints: [],
      };
    }
  }

  async getUserStats(userId: string, dateRange?: DateRangeQuery): Promise<UserStatsDTO> {
    try {
      const matchStage = {
        ...this.buildDateMatchStage(dateRange),
        userId,
      };

      const [stats] = await ApiUsage.aggregate([
        { $match: matchStage },
        {
          $facet: {
            totalRequests: [{ $count: 'count' }],
            avgResponseTime: [
              { $group: { _id: null, avg: { $avg: '$responseTime' } } },
            ],
            topEndpoints: [
              { $group: { _id: '$endpoint', count: { $sum: 1 } } },
              { $sort: { count: -1 } },
              { $limit: 10 },
              {
                $project: {
                  _id: 0,
                  endpoint: '$_id',
                  count: 1,
                },
              },
            ],
          },
        },
      ]);

      return {
        userId,
        totalRequests: stats.totalRequests[0]?.count || 0,
        avgResponseTime:
          Math.round((stats.avgResponseTime[0]?.avg || 0) * 100) / 100,
        topEndpoints: stats.topEndpoints || [],
      };
    } catch (error) {
      logger.error('Failed to get user stats', { error, userId });
      return {
        userId,
        totalRequests: 0,
        avgResponseTime: 0,
        topEndpoints: [],
      };
    }
  }

  async getEndpointStats(dateRange?: DateRangeQuery): Promise<EndpointStatsDTO[]> {
    try {
      const matchStage = this.buildDateMatchStage(dateRange);

      const stats = await ApiUsage.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$endpoint',
            requestCount: { $sum: 1 },
            avgResponseTime: { $avg: '$responseTime' },
            errorCount: {
              $sum: { $cond: [{ $gte: ['$statusCode', 400] }, 1, 0] },
            },
          },
        },
        {
          $project: {
            _id: 0,
            endpoint: '$_id',
            requestCount: 1,
            avgResponseTime: { $round: ['$avgResponseTime', 2] },
            errorRate: {
              $multiply: [{ $divide: ['$errorCount', '$requestCount'] }, 100],
            },
          },
        },
        { $sort: { requestCount: -1 } },
        { $limit: 20 },
      ]);

      return stats.map((stat) => ({
        ...stat,
        errorRate: Math.round(stat.errorRate * 100) / 100,
      }));
    } catch (error) {
      logger.error('Failed to get endpoint stats', { error });
      return [];
    }
  }

  async getErrorStats(dateRange?: DateRangeQuery): Promise<ErrorStatsDTO[]> {
    try {
      const matchStage = {
        ...this.buildDateMatchStage(dateRange),
        statusCode: { $gte: 400 },
      };

      const stats = await ApiUsage.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$endpoint',
            errorCount: { $sum: 1 },
            statusCodes: { $push: '$statusCode' },
          },
        },
        { $sort: { errorCount: -1 } },
        { $limit: 20 },
      ]);

      const totalRequests = await ApiUsage.countDocuments(
        this.buildDateMatchStage(dateRange)
      );

      return stats.map((stat) => {
        const statusCodeBreakdown: Record<number, number> = {};
        stat.statusCodes.forEach((code: number) => {
          statusCodeBreakdown[code] = (statusCodeBreakdown[code] || 0) + 1;
        });

        return {
          endpoint: stat._id,
          errorCount: stat.errorCount,
          errorRate:
            totalRequests > 0
              ? Math.round((stat.errorCount / totalRequests) * 10000) / 100
              : 0,
          statusCodeBreakdown,
        };
      });
    } catch (error) {
      logger.error('Failed to get error stats', { error });
      return [];
    }
  }

  async getPerformanceStats(
    dateRange?: DateRangeQuery
  ): Promise<PerformanceStatsDTO[]> {
    try {
      const matchStage = this.buildDateMatchStage(dateRange);

      const stats = await ApiUsage.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$endpoint',
            responseTimes: { $push: '$responseTime' },
            avgResponseTime: { $avg: '$responseTime' },
          },
        },
        { $sort: { avgResponseTime: -1 } },
        { $limit: 20 },
      ]);

      return stats.map((stat) => {
        const sorted = stat.responseTimes.sort((a: number, b: number) => a - b);
        const len = sorted.length;

        return {
          endpoint: stat._id,
          avgResponseTime: Math.round(stat.avgResponseTime * 100) / 100,
          p50: sorted[Math.floor(len * 0.5)] || 0,
          p95: sorted[Math.floor(len * 0.95)] || 0,
          p99: sorted[Math.floor(len * 0.99)] || 0,
        };
      });
    } catch (error) {
      logger.error('Failed to get performance stats', { error });
      return [];
    }
  }

  private buildDateMatchStage(dateRange?: DateRangeQuery): Record<string, any> {
    const match: Record<string, any> = {};

    if (dateRange?.startDate || dateRange?.endDate) {
      match.timestamp = {};
      if (dateRange.startDate) {
        match.timestamp.$gte = new Date(dateRange.startDate);
      }
      if (dateRange.endDate) {
        match.timestamp.$lte = new Date(dateRange.endDate);
      }
    }

    return match;
  }
}

export const analyticsService = new AnalyticsService();