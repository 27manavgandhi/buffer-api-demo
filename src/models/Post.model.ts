import mongoose, { Document, Schema } from 'mongoose';
import { PostPlatform, PostStatus } from '../types/post.types';

export interface IPost extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  content: string;
  platform: PostPlatform;
  status: PostStatus;
  scheduledAt?: Date;
  publishedAt?: Date;
  jobId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const postSchema = new Schema<IPost>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
      maxlength: [280, 'Content cannot exceed 280 characters'],
      trim: true,
    },
    platform: {
      type: String,
      enum: Object.values(PostPlatform),
      required: [true, 'Platform is required'],
    },
    status: {
      type: String,
      enum: Object.values(PostStatus),
      default: PostStatus.DRAFT,
      index: true,
    },
    scheduledAt: {
      type: Date,
      index: true,
    },
    publishedAt: {
      type: Date,
    },
    jobId: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

postSchema.index({ userId: 1, status: 1 });
postSchema.index({ userId: 1, scheduledAt: 1 });

postSchema.set('toJSON', {
  transform: (_doc, ret: any) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    delete ret.jobId;
    return ret;
  },
});

export const Post = mongoose.model<IPost>('Post', postSchema);