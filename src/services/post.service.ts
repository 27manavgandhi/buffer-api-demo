import { Post, IPost } from '../models/Post.model';
import { queueService } from './queue.service';
import {
  CreatePostDTO,
  UpdatePostDTO,
  PostResponse,
  PaginatedPostsResponse,
  PostStatus,
  JobData,
} from '../types/post.types';
import { BadRequestError, NotFoundError, ConflictError } from '../utils/errors.util';
import { logger } from '../utils/logger.util';

export class PostService {
  async createPost(
    userId: string,
    data: CreatePostDTO,
    requestId: string
  ): Promise<PostResponse> {
    if (data.scheduledAt) {
      const scheduledTime = new Date(data.scheduledAt);
      if (scheduledTime <= new Date()) {
        throw new BadRequestError('Scheduled time must be in the future');
      }
    }

    const post = await Post.create({
      userId,
      content: data.content,
      platform: data.platform,
      status: data.scheduledAt ? PostStatus.SCHEDULED : PostStatus.DRAFT,
      scheduledAt: data.scheduledAt,
    });

    if (data.scheduledAt) {
      try {
        const delay = new Date(data.scheduledAt).getTime() - Date.now();
        const jobData: JobData = {
          postId: post._id.toString(),
          userId,
          content: post.content,
          platform: post.platform,
        };

        const job = await queueService.addJob(jobData, delay);
        post.jobId = job.id?.toString();
        await post.save();

        logger.info('Post scheduled', {
          requestId,
          postId: post._id.toString(),
          scheduledAt: data.scheduledAt,
          jobId: job.id,
        });
      } catch (error) {
        await Post.findByIdAndDelete(post._id);
        logger.error('Failed to schedule post, rolling back', {
          requestId,
          error,
        });
        throw new BadRequestError('Failed to schedule post');
      }
    } else {
      logger.info('Draft post created', {
        requestId,
        postId: post._id.toString(),
      });
    }

    return this.toPostResponse(post);
  }

  async getPost(postId: string, userId: string): Promise<PostResponse> {
    const post = await Post.findOne({ _id: postId, userId });

    if (!post) {
      throw new NotFoundError('Post not found');
    }

    return this.toPostResponse(post);
  }

  async getUserPosts(
    userId: string,
    page = 1,
    limit = 10
  ): Promise<PaginatedPostsResponse> {
    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      Post.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Post.countDocuments({ userId }),
    ]);

    return {
      posts: posts.map((post) => this.toPostResponse(post)),
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  async updatePost(
    postId: string,
    userId: string,
    data: UpdatePostDTO,
    requestId: string
  ): Promise<PostResponse> {
    const post = await Post.findOne({ _id: postId, userId });

    if (!post) {
      throw new NotFoundError('Post not found');
    }

    if (post.status === PostStatus.PUBLISHED) {
      throw new ConflictError('Cannot update published post');
    }

    if (data.scheduledAt) {
      const scheduledTime = new Date(data.scheduledAt);
      if (scheduledTime <= new Date()) {
        throw new BadRequestError('Scheduled time must be in the future');
      }
    }

    const wasScheduled = post.status === PostStatus.SCHEDULED;
    const willBeScheduled = data.scheduledAt !== undefined;

    if (wasScheduled && post.jobId) {
      await queueService.removeJob(post.jobId);
      post.jobId = undefined;
    }

    if (data.content !== undefined) post.content = data.content;
    if (data.platform !== undefined) post.platform = data.platform;

    if (willBeScheduled && data.scheduledAt) {
      post.scheduledAt = data.scheduledAt;
      post.status = PostStatus.SCHEDULED;

      const delay = new Date(data.scheduledAt).getTime() - Date.now();
      const jobData: JobData = {
        postId: post._id.toString(),
        userId,
        content: post.content,
        platform: post.platform,
      };

      const job = await queueService.addJob(jobData, delay);
      post.jobId = job.id?.toString();

      logger.info('Post rescheduled', {
        requestId,
        postId: post._id.toString(),
        scheduledAt: data.scheduledAt,
        jobId: job.id,
      });
    } else if (wasScheduled && !willBeScheduled) {
      post.status = PostStatus.DRAFT;
      post.scheduledAt = undefined;

      logger.info('Scheduled post converted to draft', {
        requestId,
        postId: post._id.toString(),
      });
    }

    await post.save();

    return this.toPostResponse(post);
  }

  async deletePost(postId: string, userId: string, requestId: string): Promise<void> {
    const post = await Post.findOne({ _id: postId, userId });

    if (!post) {
      throw new NotFoundError('Post not found');
    }

    if (post.jobId) {
      await queueService.removeJob(post.jobId);
      logger.info('Job removed for deleted post', {
        requestId,
        postId,
        jobId: post.jobId,
      });
    }

    await Post.findByIdAndDelete(postId);

    logger.info('Post deleted', { requestId, postId });
  }

  async publishPost(postId: string): Promise<void> {
    const post = await Post.findById(postId);

    if (!post) {
      throw new NotFoundError('Post not found');
    }

    if (post.status === PostStatus.PUBLISHED) {
      logger.warn('Attempted to publish already published post', { postId });
      return;
    }

    logger.info(`Publishing post ${postId} to ${post.platform}: ${post.content}`);

    post.status = PostStatus.PUBLISHED;
    post.publishedAt = new Date();
    await post.save();

    logger.info('Post published successfully', {
      postId,
      platform: post.platform,
    });
  }

  private toPostResponse(post: IPost): PostResponse {
    return {
      id: post._id.toString(),
      userId: post.userId.toString(),
      content: post.content,
      platform: post.platform,
      status: post.status,
      scheduledAt: post.scheduledAt,
      publishedAt: post.publishedAt,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    };
  }
}

export const postService = new PostService();