import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import app from '../src/app';

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
let authToken: string;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);

  const response = await request(app).post('/api/v1/auth/register').send({
    email: 'version@example.com',
    password: 'Password123',
  });

  authToken = response.body.data.token;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('API Versioning', () => {
  describe('V1 Routes', () => {
    it('should access v1 auth endpoint successfully', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should access v1 posts endpoint successfully', async () => {
      const response = await request(app)
        .get('/api/v1/posts')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('V2 Routes', () => {
    it('should return 501 for v2 endpoints', async () => {
      const response = await request(app).get('/api/v2/posts');

      expect(response.status).toBe(501);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('API v2 not yet implemented');
    });

    it('should include available versions in v2 response', async () => {
      const response = await request(app).get('/api/v2/anything');

      expect(response.status).toBe(501);
      expect(response.body.error.availableVersions).toEqual(['v1']);
    });
  });
});