// tests/analytics.test.ts
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import app from '../src/app';
import { ApiUsage } from '../src/models/ApiUsage.model';
import { User } from '../src/models/User.model';

jest.mock('../src/config/redis', () => {
  const mockRedis = {
    multi: jest.fn().mockReturnThis(),
    incr: jest.fn().mockReturnThis(),
    ttl: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue([
      [null, 1],
      [null, 3600],
    ]),
    expire: jest.fn().mockResolvedValue(1),
    decr: jest.fn().mockResolvedValue(1),
    del: jest.fn().mockResolvedValue(1),
    get: jest.fn().mockResolvedValue(null),
    on: jest.fn(),
    disconnect: jest.fn(),
    quit: jest.fn().mockResolvedValue('OK'),
  };
  return {
    createRedisConnection: jest.fn(() => mockRedis),
  };
});

let mongoServer: MongoMemoryServer;
let adminToken: string;
let userId: string;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);

  // Create admin user
  const adminResponse = await request(app).post('/api/v1/auth/register').send({
    email: `admin-${Date.now()}@example.com`,
    password: 'AdminPass123',
  });

  userId = adminResponse.body.data.user.id;

  // CRITICAL: Update user to admin role BEFORE getting token
  await User.findByIdAndUpdate(userId, { role: 'admin' });

  // Now login to get a token with admin role
  const loginResponse = await request(app).post('/api/v1/auth/login').send({
    email: adminResponse.body.data.user.email,
    password: 'AdminPass123',
  });

  adminToken = loginResponse.body.data.token;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
  await new Promise((resolve) => setTimeout(resolve, 500));
});

afterEach(async () => {
  await ApiUsage.deleteMany({});
});

describe('Analytics', () => {
  describe('GET /api/admin/analytics/overview', () => {
    it('should return system analytics', async () => {
      const response = await request(app)
        .get('/api/admin/analytics/overview')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.totalRequests).toBeGreaterThanOrEqual(0);
    });
  });

  describe('GET /api/admin/analytics/users/:userId', () => {
    it('should return user-specific analytics', async () => {
      // Create analytics records for this user
      await ApiUsage.create([
        {
          userId: userId,
          endpoint: '/api/v1/posts',
          method: 'GET',
          statusCode: 200,
          responseTime: 50,
          ip: '127.0.0.1',
        },
        {
          userId: userId,
          endpoint: '/api/v1/posts',
          method: 'POST',
          statusCode: 201,
          responseTime: 75,
          ip: '127.0.0.1',
        },
      ]);

      const response = await request(app)
        .get(`/api/admin/analytics/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.userId).toBe(userId);
      expect(response.body.data.totalRequests).toBe(2);
    });

    it('should reject invalid userId', async () => {
      const response = await request(app)
        .get('/api/admin/analytics/users/invalid-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(422);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/admin/analytics/endpoints', () => {
    it('should return endpoint statistics', async () => {
      const response = await request(app)
        .get('/api/admin/analytics/endpoints')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('GET /api/admin/analytics/errors', () => {
    it('should return error statistics', async () => {
      const response = await request(app)
        .get('/api/admin/analytics/errors')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });
  });

  describe('GET /api/admin/analytics/performance', () => {
    it('should return performance statistics', async () => {
      const response = await request(app)
        .get('/api/admin/analytics/performance')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });
  });

  describe('Date Range Filtering', () => {
    it('should filter analytics by date range', async () => {
      const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const endDate = new Date().toISOString();

      const response = await request(app)
        .get('/api/admin/analytics/overview')
        .query({ startDate, endDate })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should reject invalid date range', async () => {
      const response = await request(app)
        .get('/api/admin/analytics/overview')
        .query({ startDate: 'invalid-date' })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(422);

      expect(response.body.success).toBe(false);
    });
  });
});