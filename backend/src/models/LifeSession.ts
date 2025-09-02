import mongoose, { Document, Schema } from 'mongoose';

export interface ILifeSession extends Document {
  _id: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  rootNodeId?: mongoose.Types.ObjectId;
  totalNodes: number;
  maxDepth: number;
  status: 'active' | 'completed' | 'archived';
  baseContext: {
    age?: number;
    country?: string;
    currentCareer?: string;
    currentCity?: string;
    currentEducation?: string;
    values?: string[];
    riskTolerance?: 'low' | 'medium' | 'high';
  };
  tags: string[];
  isPublic: boolean;
  viewCount: number;
  shareableToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LifeSessionSchema = new Schema<ILifeSession>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  rootNodeId: {
    type: Schema.Types.ObjectId,
    ref: 'LifeNode',
    required: false
  },
  totalNodes: {
    type: Number,
    default: 0,
    min: 0,
    max: 50
  },
  maxDepth: {
    type: Number,
    default: 0,
    min: 0,
    max: 10
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'archived'],
    default: 'active'
  },
  baseContext: {
    age: {
      type: Number,
      min: 16,
      max: 80
    },
    country: {
      type: String,
      trim: true
    },
    currentCareer: {
      type: String,
      trim: true
    },
    currentCity: {
      type: String,
      trim: true
    },
    currentEducation: {
      type: String,
      trim: true
    },
    values: [{
      type: String,
      trim: true
    }],
    riskTolerance: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    }
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  isPublic: {
    type: Boolean,
    default: false
  },
  viewCount: {
    type: Number,
    default: 0,
    min: 0
  },
  shareableToken: {
    type: String,
    unique: true,
    sparse: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
LifeSessionSchema.index({ userId: 1, createdAt: -1 });
LifeSessionSchema.index({ tags: 1 });
LifeSessionSchema.index({ isPublic: 1, viewCount: -1 });
// Note: shareableToken index is automatically created by unique: true in schema

// Virtual for nodes
LifeSessionSchema.virtual('nodes', {
  ref: 'LifeNode',
  localField: '_id',
  foreignField: 'sessionId'
});

export const LifeSession = mongoose.model<ILifeSession>('LifeSession', LifeSessionSchema);