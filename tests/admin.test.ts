// tests/admin.test.ts
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import app from '../src/app';
import { User } from '../src/models/User.model';

// FIX: Ensure ALL methods return actual numbers, not undefined
jest.mock('../src/queues/post.queue', () => {
  const mockQueue = {
    // CRITICAL: All these MUST return numbers, not undefined
    getWaitingCount: jest.fn().mockResolvedValue(5),
    getActiveCount: jest.fn().mockResolvedValue(2),
    getCompletedCount: jest.fn().mockResolvedValue(100),
    getFailedCount: jest.fn().mockResolvedValue(3),
    getDelayedCount: jest.fn().mockResolvedValue(10),
    isPaused: jest.fn().mockResolvedValue(false),
    
    // Other Bull queue methods
    getJobs: jest.fn().mockResolvedValue([]),
    pause: jest.fn().mockResolvedValue(undefined),
    resume: jest.fn().mockResolvedValue(undefined),
    clean: jest.fn().mockResolvedValue([]),
    getFailed: jest.fn().mockResolvedValue([]),
    close: jest.fn().mockResolvedValue(undefined),
    add: jest.fn().mockResolvedValue({ id: 'test-job-id' }),
    getJob: jest.fn().mockResolvedValue(null),
  };

  return {
    postQueue: mockQueue,
  };
});

// Mock Redis
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
let userToken: string;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);

  // Create admin user
  const adminEmail = `admin-${Date.now()}@example.com`;
  const adminResponse = await request(app).post('/api/v1/auth/register').send({
    email: adminEmail,
    password: 'AdminPass123',
  });

  const adminUserId = adminResponse.body.data.user.id;

  // Update to admin role
  await User.findByIdAndUpdate(adminUserId, { role: 'admin' });

  // Login to get admin token
  const adminLoginResponse = await request(app).post('/api/v1/auth/login').send({
    email: adminEmail,
    password: 'AdminPass123',
  });

  adminToken = adminLoginResponse.body.data.token;

  // Create regular user
  const userResponse = await request(app).post('/api/v1/auth/register').send({
    email: `user-${Date.now()}@example.com`,
    password: 'UserPass123',
  });

  userToken = userResponse.body.data.token;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
  await new Promise((resolve) => setTimeout(resolve, 500));
});

describe('Admin Routes', () => {
  describe('Queue Monitoring', () => {
    it('should allow admin to access queue stats', async () => {
      const response = await request(app)
        .get('/api/admin/queue/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      // Debug: Log what we're actually getting
      console.log('Queue stats response:', JSON.stringify(response.body.data, null, 2));
      
      expect(response.body.data).toHaveProperty('waiting');
      expect(response.body.data).toHaveProperty('active');
      expect(response.body.data).toHaveProperty('completed');
      expect(response.body.data).toHaveProperty('failed');
      expect(response.body.data).toHaveProperty('delayed');
      
      // Verify they're numbers
      expect(typeof response.body.data.waiting).toBe('number');
      expect(typeof response.body.data.active).toBe('number');
      expect(typeof response.body.data.completed).toBe('number');
      expect(typeof response.body.data.failed).toBe('number');
      expect(typeof response.body.data.delayed).toBe('number');
    });

    it('should deny non-admin access to queue stats', async () => {
      const response = await request(app)
        .get('/api/admin/queue/stats')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should allow admin to pause queue', async () => {
      const response = await request(app)
        .post('/api/admin/queue/pause')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should allow admin to resume queue', async () => {
      const response = await request(app)
        .post('/api/admin/queue/resume')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Analytics', () => {
    it('should allow admin to access analytics overview', async () => {
      const response = await request(app)
        .get('/api/admin/analytics/overview')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });

    it('should deny non-admin access to analytics', async () => {
      const response = await request(app)
        .get('/api/admin/analytics/overview')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });
});