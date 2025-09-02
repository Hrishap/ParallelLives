import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  email?: string;
  name?: string;
  createdAt: Date;
  updatedAt: Date;
  preferences?: {
    theme: 'light' | 'dark';
    language: string;
    notifications: boolean;
  };
  sessions: mongoose.Types.ObjectId[];
}

const UserSchema = new Schema<IUser>({
  email: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true
  },
  name: {
    type: String,
    trim: true,
    maxlength: 100
  },
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark'],
      default: 'light'
    },
    language: {
      type: String,
      default: 'en'
    },
    notifications: {
      type: Boolean,
      default: true
    }
  },
  sessions: [{
    type: Schema.Types.ObjectId,
    ref: 'LifeSession'
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
// Note: email index is automatically created by unique: true in schema
UserSchema.index({ createdAt: -1 });

export const User = mongoose.model<IUser>('User', UserSchema);