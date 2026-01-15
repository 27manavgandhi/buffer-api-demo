import mongoose, { Document, Schema } from 'mongoose';

export interface IApiUsage extends Document {
  _id: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  ip: string;
  userAgent?: string;
  timestamp: Date;
}

const apiUsageSchema = new Schema<IApiUsage>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    endpoint: {
      type: String,
      required: true,
      index: true,
    },
    method: {
      type: String,
      required: true,
      enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    },
    statusCode: {
      type: Number,
      required: true,
      index: true,
    },
    responseTime: {
      type: Number,
      required: true,
    },
    ip: {
      type: String,
      required: true,
    },
    userAgent: {
      type: String,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
      expires: 7776000, // 90 days TTL
    },
  },
  {
    timestamps: false,
  }
);

apiUsageSchema.index({ endpoint: 1, timestamp: -1 });
apiUsageSchema.index({ userId: 1, timestamp: -1 });

apiUsageSchema.set('toJSON', {
  transform: (_doc, ret: any) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const ApiUsage = mongoose.model<IApiUsage>('ApiUsage', apiUsageSchema);