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
import {
  isFutureTime,
  calculateDelay,
  normalizeToUtc,
  nowUtc,
} from '../utils/timezone.util';

export class PostService {
  /** 
   * @param userId - User creating the post
   * @param data - Post creation data
   * @param requestId - Request ID for logging
   * @returns Created post response
   */
  async createPost(
    userId: string,
    data: CreatePostDTO,
    requestId: string
  ): Promise<PostResponse> {
    
    if (data.scheduledAt) {
      const scheduledUtc = normalizeToUtc(data.scheduledAt);
      
      if (!scheduledUtc) {
        throw new BadRequestError('Invalid scheduled time format');
      }

      
      if (!isFutureTime(scheduledUtc)) {
        throw new BadRequestError('Scheduled time must be in the future');
      }
    }

    
    const post = await Post.create({
      userId,
      content: data.content,
      platform: data.platform,
      status: data.scheduledAt ? PostStatus.SCHEDULED : PostStatus.DRAFT,
      scheduledAt: data.scheduledAt ? normalizeToUtc(data.scheduledAt) : undefined,
    });

    
    if (data.scheduledAt && post.scheduledAt) {
      try {
        
        const delay = calculateDelay(post.scheduledAt.toISOString());
        
        const jobData: JobData = {
          postId: post._id.toString(),
          userId,
          content: post.content,
          platform: post.platform,
        };

        const job = await queueService.addJob(jobData, delay);
        post.jobId = job.id?.toString();
        await post.save();

        logger.info('Post scheduled successfully', {
          requestId,
          postId: post._id.toString(),
          scheduledAt: post.scheduledAt,
          scheduledAtUtc: post.scheduledAt.toISOString(),
          delayMs: delay,
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

  /**
   * @param postId - Post ID
   * @param userId - User requesting the post
   * @returns Post response
   */
  async getPost(postId: string, userId: string): Promise<PostResponse> {
    const post = await Post.findOne({ _id: postId, userId });

    if (!post) {
      throw new NotFoundError('Post not found');
    }

    return this.toPostResponse(post);
  }

  /**
   * @param userId - User ID
   * @param page - Page number (1-indexed)
   * @param limit - Posts per page
   * @returns Paginated posts
   */
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

  /** 
   * @param postId - Post ID to update
   * @param userId - User updating the post
   * @param data - Update data
   * @param requestId - Request ID for logging
   * @returns Updated post response
   */
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
      const scheduledUtc = normalizeToUtc(data.scheduledAt);
      
      if (!scheduledUtc) {
        throw new BadRequestError('Invalid scheduled time format');
      }

      
      if (!isFutureTime(scheduledUtc)) {
        throw new BadRequestError('Scheduled time must be in the future');
      }
    }

    const wasScheduled = post.status === PostStatus.SCHEDULED;
    const willBeScheduled = data.scheduledAt !== undefined;

    
    if (wasScheduled && post.jobId) {
      await queueService.removeJob(post.jobId);
      post.jobId = undefined;
      
      logger.info('Removed old scheduled job', {
        requestId,
        postId,
        oldJobId: post.jobId,
      });
    }

    
    if (data.content !== undefined) post.content = data.content;
    if (data.platform !== undefined) post.platform = data.platform;

    
    if (willBeScheduled && data.scheduledAt) {
      const scheduledUtc = normalizeToUtc(data.scheduledAt)!;
      post.scheduledAt = new Date(scheduledUtc);
      post.status = PostStatus.SCHEDULED;

      
      const delay = calculateDelay(scheduledUtc);
      
      const jobData: JobData = {
        postId: post._id.toString(),
        userId,
        content: post.content,
        platform: post.platform,
      };

      const job = await queueService.addJob(jobData, delay);
      post.jobId = job.id?.toString();

      logger.info('Post rescheduled successfully', {
        requestId,
        postId: post._id.toString(),
        scheduledAt: scheduledUtc,
        delayMs: delay,
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

  /**
   * @param postId - Post ID to delete
   * @param userId - User deleting the post
   * @param requestId - Request ID for logging
   */
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

    logger.info('Post deleted successfully', { requestId, postId });
  }

  /**
   * @param postId - Post ID to publish
   */
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
    post.publishedAt = new Date(nowUtc());
    await post.save();

    logger.info('Post published successfully', {
      postId,
      platform: post.platform,
      publishedAt: post.publishedAt.toISOString(),
    });
  }

  /**
   * @param post - Mongoose Post document
   * @returns Clean post response object
   */
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