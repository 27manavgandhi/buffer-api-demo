// tests/post.test.ts
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import app from '../src/app';
import { Post } from '../src/models/Post.model';
import { PostPlatform, PostStatus } from '../src/types/post.types';
import { postQueue } from '../src/queues/post.queue';

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
let authToken: string;
let userId: string;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);

  // Create user with unique email using timestamp
  const response = await request(app)
    .post('/api/v1/auth/register')
    .send({
      email: `testuser-${Date.now()}@example.com`,
      password: 'Password123',
    });

  // Verify response structure before accessing
  if (!response.body.success || !response.body.data) {
    throw new Error(`Registration failed: ${JSON.stringify(response.body)}`);
  }

  authToken = response.body.data.token;
  userId = response.body.data.user.id;
});

afterAll(async () => {
  await postQueue.close();
  await mongoose.disconnect();
  await mongoServer.stop();
  await new Promise((resolve) => setTimeout(resolve, 500));
});

afterEach(async () => {
  await Post.deleteMany({});
});

describe('Post API', () => {
  describe('POST /api/v1/posts', () => {
    it('should create a draft post', async () => {
      const postData = {
        content: 'This is a test post',
        platform: PostPlatform.TWITTER,
      };

      const response = await request(app)
        .post('/api/v1/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(postData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.content).toBe(postData.content);
      expect(response.body.data.platform).toBe(postData.platform);
      expect(response.body.data.status).toBe(PostStatus.DRAFT);
      expect(response.body.data.userId).toBe(userId);
    });

    it('should create a scheduled post', async () => {
      const scheduledAt = new Date(Date.now() + 60000);
      const postData = {
        content: 'Scheduled post',
        platform: PostPlatform.LINKEDIN,
        scheduledAt: scheduledAt.toISOString(),
      };

      const response = await request(app)
        .post('/api/v1/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(postData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe(PostStatus.SCHEDULED);
      expect(response.body.data.scheduledAt).toBeDefined();
    });

    it('should fail with past scheduled time', async () => {
      const pastTime = new Date(Date.now() - 60000);
      const postData = {
        content: 'Past post',
        platform: PostPlatform.TWITTER,
        scheduledAt: pastTime.toISOString(),
      };

      const response = await request(app)
        .post('/api/v1/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(postData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('future');
    });

    it('should fail with content exceeding 280 chars', async () => {
      const postData = {
        content: 'a'.repeat(281),
        platform: PostPlatform.TWITTER,
      };

      const response = await request(app)
        .post('/api/v1/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(postData)
        .expect(422);

      expect(response.body.success).toBe(false);
    });

    it('should fail without authentication', async () => {
      const postData = {
        content: 'Test post',
        platform: PostPlatform.TWITTER,
      };

      await request(app).post('/api/v1/posts').send(postData).expect(401);
    });
  });

  describe('GET /api/v1/posts', () => {
    beforeEach(async () => {
      await Post.create([
        {
          userId,
          content: 'Post 1',
          platform: PostPlatform.TWITTER,
          status: PostStatus.DRAFT,
        },
        {
          userId,
          content: 'Post 2',
          platform: PostPlatform.LINKEDIN,
          status: PostStatus.PUBLISHED,
        },
      ]);
    });

    it('should get user posts with pagination', async () => {
      const response = await request(app)
        .get('/api/v1/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.posts).toHaveLength(2);
      expect(response.body.data.total).toBe(2);
      expect(response.body.data.page).toBe(1);
    });

    it('should fail without authentication', async () => {
      await request(app).get('/api/v1/posts').expect(401);
    });
  });

  describe('GET /api/v1/posts/:id', () => {
    let postId: string;

    beforeEach(async () => {
      const post = await Post.create({
        userId,
        content: 'Single post',
        platform: PostPlatform.TWITTER,
        status: PostStatus.DRAFT,
      });
      postId = post._id.toString();
    });

    it('should get a single post', async () => {
      const response = await request(app)
        .get(`/api/v1/posts/${postId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(postId);
      expect(response.body.data.content).toBe('Single post');
    });

    it('should fail with invalid post ID', async () => {
      await request(app)
        .get('/api/v1/posts/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(422);
    });

    it('should fail for non-existent post', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      await request(app)
        .get(`/api/v1/posts/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('PUT /api/v1/posts/:id', () => {
    let postId: string;

    beforeEach(async () => {
      const post = await Post.create({
        userId,
        content: 'Original content',
        platform: PostPlatform.TWITTER,
        status: PostStatus.DRAFT,
      });
      postId = post._id.toString();
    });

    it('should update a draft post', async () => {
      const updateData = {
        content: 'Updated content',
        platform: PostPlatform.LINKEDIN,
      };

      const response = await request(app)
        .put(`/api/v1/posts/${postId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.content).toBe('Updated content');
      expect(response.body.data.platform).toBe(PostPlatform.LINKEDIN);
    });

    it('should fail to update published post', async () => {
      await Post.findByIdAndUpdate(postId, { status: PostStatus.PUBLISHED });

      const response = await request(app)
        .put(`/api/v1/posts/${postId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ content: 'New content' })
        .expect(409);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/v1/posts/:id', () => {
    let postId: string;

    beforeEach(async () => {
      const post = await Post.create({
        userId,
        content: 'To be deleted',
        platform: PostPlatform.TWITTER,
        status: PostStatus.DRAFT,
      });
      postId = post._id.toString();
    });

    it('should delete a post', async () => {
      const response = await request(app)
        .delete(`/api/v1/posts/${postId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      const deletedPost = await Post.findById(postId);
      expect(deletedPost).toBeNull();
    });

    it('should fail for non-existent post', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      await request(app)
        .delete(`/api/v1/posts/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });
});