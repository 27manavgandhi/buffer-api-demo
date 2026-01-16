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
    decr: jest.fn().mockResolvedValue(1),
    del: jest.fn().mockResolvedValue(1),
    get: jest.fn().mockResolvedValue(null),
    on: jest.fn(),
    disconnect: jest.fn(),
  };
  return {
    createRedisConnection: jest.fn(() => mockRedis),
  };
});

jest.mock('../src/utils/rateLimitStore.util', () => {
  return {
    RedisStore: jest.fn().mockImplementation(() => {
      return {
        prefix: 'rl:test:',
        increment: jest.fn().mockResolvedValue({
          totalHits: 1,
          resetTime: new Date(Date.now() + 3600000),
        }),
        decrement: jest.fn().mockResolvedValue(undefined),
        resetKey: jest.fn().mockResolvedValue(undefined),
      };
    }),
  };
});

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Rate Limiting', () => {
  it('should include rate limit headers in response', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'ratelimit@example.com',
        password: 'Password123',
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
  });

  it('should not rate limit health endpoint', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.headers['x-ratelimit-limit']).toBeUndefined();
  });
});