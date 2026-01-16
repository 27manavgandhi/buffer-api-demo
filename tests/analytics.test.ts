import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import app from '../src/app';
import { User } from '../src/models/User.model';
import { ApiUsage } from '../src/models/ApiUsage.model';

jest.mock('../src/config/redis', () => {
  const mockRedis = {
    multi: jest.fn().mockReturnThis(),
    incr: jest.fn().mockReturnThis(),
    ttl: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue([[null, 1], [null, 3600]]),
    expire: jest.fn().mockResolvedValue(1),
    on: jest.fn(),
    disconnect: jest.fn(),
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

  const response = await request(app).post('/api/v1/auth/register').send({
    email: 'analytics@example.com',
    password: 'Password123',
  });

  userId = response.body.data.user.id;

  await User.findByIdAndUpdate(userId, { role: 'admin' });

  const loginResponse = await request(app).post('/api/v1/auth/login').send({
    email: 'analytics@example.com',
    password: 'Password123',
  });

  adminToken = loginResponse.body.data.token;

  await ApiUsage.create({
    userId: new mongoose.Types.ObjectId(userId),
    endpoint: '/api/v1/posts',
    method: 'GET',
    statusCode: 200,
    responseTime: 45,
    ip: '127.0.0.1',
    timestamp: new Date(),
  });

  await ApiUsage.create({
    userId: new mongoose.Types.ObjectId(userId),
    endpoint: '/api/v1/posts',
    method: 'POST',
    statusCode: 201,
    responseTime: 120,
    ip: '127.0.0.1',
    timestamp: new Date(),
  });

  await ApiUsage.create({
    endpoint: '/api/v1/auth/login',
    method: 'POST',
    statusCode: 401,
    responseTime: 30,
    ip: '192.168.1.1',
    timestamp: new Date(),
  });
});

afterAll(async () => {
  await ApiUsage.deleteMany({});
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Analytics', () => {
  describe('GET /api/admin/analytics/overview', () => {
    it('should return system analytics', async () => {
      const response = await request(app)
        .get('/api/admin/analytics/overview')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalRequests');
      expect(response.body.data).toHaveProperty('avgResponseTime');
      expect(response.body.data).toHaveProperty('errorRate');
      expect(response.body.data.totalRequests).toBeGreaterThan(0);
    });
  });

  describe('GET /api/admin/analytics/users/:userId', () => {
    it('should return user-specific analytics', async () => {
      const response = await request(app)
        .get(`/api/admin/analytics/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.userId).toBe(userId);
      expect(response.body.data.totalRequests).toBeGreaterThanOrEqual(0);
    });

    it('should reject invalid userId', async () => {
      const response = await request(app)
        .get('/api/admin/analytics/users/invalid-id')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(422);
    });
  });

  describe('GET /api/admin/analytics/endpoints', () => {
    it('should return endpoint statistics', async () => {
      const response = await request(app)
        .get('/api/admin/analytics/endpoints')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.endpoints).toBeInstanceOf(Array);
    });
  });

  describe('GET /api/admin/analytics/errors', () => {
    it('should return error statistics', async () => {
      const response = await request(app)
        .get('/api/admin/analytics/errors')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.errors).toBeInstanceOf(Array);
    });
  });

  describe('GET /api/admin/analytics/performance', () => {
    it('should return performance statistics', async () => {
      const response = await request(app)
        .get('/api/admin/analytics/performance')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.performance).toBeInstanceOf(Array);
    });
  });

  describe('Date Range Filtering', () => {
    it('should filter analytics by date range', async () => {
      const startDate = new Date(Date.now() - 86400000).toISOString();
      const endDate = new Date().toISOString();

      const response = await request(app)
        .get(`/api/admin/analytics/overview?startDate=${startDate}&endDate=${endDate}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should reject invalid date range', async () => {
      const response = await request(app)
        .get('/api/admin/analytics/overview?startDate=invalid-date')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(422);
    });
  });
});