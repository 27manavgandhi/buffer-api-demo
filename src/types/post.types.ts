export enum PostPlatform {
  TWITTER = 'twitter',
  LINKEDIN = 'linkedin',
  FACEBOOK = 'facebook',
}

export enum PostStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  PUBLISHED = 'published',
  FAILED = 'failed',
}

export interface CreatePostDTO {
  content: string;
  platform: PostPlatform;
  scheduledAt?: Date;
}

export interface UpdatePostDTO {
  content?: string;
  platform?: PostPlatform;
  scheduledAt?: Date;
}

export interface PostResponse {
  id: string;
  userId: string;
  content: string;
  platform: PostPlatform;
  status: PostStatus;
  scheduledAt?: Date;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginatedPostsResponse {
  posts: PostResponse[];
  total: number;
  page: number;
  pages: number;
}

export interface JobData {
  postId: string;
  userId: string;
  content: string;
  platform: PostPlatform;
}