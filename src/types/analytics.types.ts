export interface RecordAnalyticsDTO {
  userId?: string;
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  ip: string;
  userAgent?: string;
}

export interface SystemStatsDTO {
  totalRequests: number;
  avgResponseTime: number;
  errorRate: number;
  topEndpoints: Array<{
    endpoint: string;
    count: number;
  }>;
}

export interface UserStatsDTO {
  userId: string;
  totalRequests: number;
  avgResponseTime: number;
  topEndpoints: Array<{
    endpoint: string;
    count: number;
  }>;
}

export interface EndpointStatsDTO {
  endpoint: string;
  requestCount: number;
  avgResponseTime: number;
  errorRate: number;
}

export interface ErrorStatsDTO {
  endpoint: string;
  errorCount: number;
  errorRate: number;
  statusCodeBreakdown: Record<number, number>;
}

export interface PerformanceStatsDTO {
  endpoint: string;
  avgResponseTime: number;
  p50: number;
  p95: number;
  p99: number;
}

export interface DateRangeQuery {
  startDate?: string;
  endDate?: string;
}