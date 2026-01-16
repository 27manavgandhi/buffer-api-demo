import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import app from '../src/app';
import { User } from '../src/models/User.model';

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

jest.mock('../src/queues/post.queue', () => ({
  postQueue: {
    getWaitingCount: jest.fn().mockResolvedValue(5),
    getActiveCount: jest.fn().mockResolvedValue(2),
    getCompletedCount: jest.fn().mockResolvedValue(100),
    getFailedCount: jest.fn().mockResolvedValue(3),
    getDelayedCount: jest.fn().mockResolvedValue(10),
    isPaused: jest.fn().mockResolvedValue(false),
    pause: jest.fn().mockResolvedValue(undefined),
    resume: jest.fn().mockResolvedValue(undefined),
    getJobs: jest.fn().mockResolvedValue([]),
    clean: jest.fn().mockResolvedValue(undefined),
    getFailed: jest.fn().mockResolvedValue([]),
    on: jest.fn(),
    close: jest.fn(),
  },
}));

let mongoServer: MongoMemoryServer;
let adminToken: string;
let userToken: string;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);

  const adminResponse = await request(app).post('/api/v1/auth/register').send({
    email: 'admin@example.com',
    password: 'Password123',
  });

  await User.findByIdAndUpdate(adminResponse.body.data.user.id, { role: 'admin' });

  const adminLoginResponse = await request(app).post('/api/v1/auth/login').send({
    email: 'admin@example.com',
    password: 'Password123',
  });

  adminToken = adminLoginResponse.body.data.token;

  const userResponse = await request(app).post('/api/v1/auth/register').send({
    email: 'user@example.com',
    password: 'Password123',
  });

  userToken = userResponse.body.data.token;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Admin Routes', () => {
  describe('Queue Monitoring', () => {
    it('should allow admin to access queue stats', async () => {
      const response = await request(app)
        .get('/api/admin/queue/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('waiting');
      expect(response.body.data).toHaveProperty('active');
    });

    it('should deny non-admin access to queue stats', async () => {
      const response = await request(app)
        .get('/api/admin/queue/stats')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
    });

    it('should allow admin to pause queue', async () => {
      const response = await request(app)
        .post('/api/admin/queue/pause')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should allow admin to resume queue', async () => {
      const response = await request(app)
        .post('/api/admin/queue/resume')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Analytics', () => {
    it('should allow admin to access analytics overview', async () => {
      const response = await request(app)
        .get('/api/admin/analytics/overview')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should deny non-admin access to analytics', async () => {
      const response = await request(app)
        .get('/api/admin/analytics/overview')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
    });
  });
});