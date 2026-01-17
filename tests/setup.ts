// tests/setup.ts
process.env.NODE_ENV = 'test';
process.env.PORT = '3000';
process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
process.env.JWT_SECRET = 'test-secret-key-minimum-32-characters-long';
process.env.JWT_EXPIRES_IN = '7d';
process.env.REDIS_HOST = '127.0.0.1';
process.env.REDIS_PORT = '6379';

// Set test timeout
jest.setTimeout(30000);

afterAll(async () => {
  await new Promise((resolve) => setTimeout(resolve, 500));
});