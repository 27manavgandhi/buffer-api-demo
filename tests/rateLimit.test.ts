// tests/rateLimit.test.ts
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import app from '../src/app';

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

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
  await new Promise((resolve) => setTimeout(resolve, 500));
});

describe('Rate Limiting', () => {
  it('should include rate limit headers in response', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: `ratelimit-${Date.now()}@example.com`,
        password: 'Password123',
      });

    // Debug: See all headers
    console.log('Response headers:', response.headers);
    
    // express-rate-limit uses lowercase header names
    expect(
      response.headers['x-ratelimit-limit'] || 
      response.headers['ratelimit-limit']
    ).toBeDefined();
    
    expect(
      response.headers['x-ratelimit-remaining'] || 
      response.headers['ratelimit-remaining']
    ).toBeDefined();
    
    // Should be successful registration
    expect(response.status).toBe(201);
  });

  it('should not rate limit health endpoint', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    // Health endpoint explicitly skips rate limiting, so no headers
    expect(response.headers['x-ratelimit-limit']).toBeUndefined();
    expect(response.headers['ratelimit-limit']).toBeUndefined();
  });
});