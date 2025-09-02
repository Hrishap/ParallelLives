import mongoose, { Document, Schema } from 'mongoose';

export interface IChoice {
  careerChange?: string;
  locationChange?: {
    city?: string;
    country?: string;
  };
  educationChange?: string;
  lifestyleChange?: string;
  personalityChange?: string;
  relationshipChange?: string;
}

export interface IChapter {
  title: string;
  text: string;
  yearRange: string;
  highlights: string[];
}

export interface IMilestone {
  year: number;
  event: string;
  significance: 'low' | 'medium' | 'high';
  category: 'career' | 'personal' | 'financial' | 'health' | 'relationship';
}

export interface IAiNarrative {
  summary: string;
  chapters: IChapter[];
  milestones: IMilestone[];
  tone: 'optimistic' | 'realistic' | 'cautious' | 'balanced';
  confidenceScore: number;
  disclaimers: string[];
}

export interface ICityMetrics {
  name: string;
  country: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  teleportScores?: {
    overall: number;
    costOfLiving: number;
    safety: number;
    housing: number;
    healthcare: number;
    education: number;
    leisure: number;
    tolerance: number;
    commute: number;
    business: number;
    economy: number;
  };
  climate?: {
    avgTempC: number;
    avgTempF: number;
    rainDays: number;
    sunnyDays: number;
    season: string;
    comfortIndex: number;
  };
  population?: number;
  timezone?: string;
}

export interface IOccupationMetrics {
  name: string;
  category: string;
  onetCode?: string;
  demandIndex?: number;
  educationTypical?: string;
  skillsRequired: string[];
  tasksTypical: string[];
  growthOutlook?: 'declining' | 'stable' | 'growing' | 'rapid';
  automationRisk?: 'low' | 'medium' | 'high';
  workLifeBalance?: number;
  stressLevel?: number;
}

export interface IFinancialMetrics {
  salaryLowUSD?: number;
  salaryHighUSD?: number;
  salaryMedianUSD?: number;
  colIndex: number;
  currency: string;
  localSalaryLow?: number;
  localSalaryHigh?: number;
  localSalaryMedian?: number;
  savingsPotential?: number;
  retirementAge?: number;
  financialSecurity?: 'low' | 'medium' | 'high';
}

export interface IMetrics {
  city: ICityMetrics;
  occupation: IOccupationMetrics;
  finances: IFinancialMetrics;
  qualityOfLifeIndex: number;
  happinessScore: number;
  workLifeBalance: number;
  healthIndex: number;
  socialIndex: number;
  creativityIndex: number;
  adventureIndex: number;
}

export interface IMedia {
  coverPhoto: {
    url: string;
    credit: string;
    description: string;
  };
  additionalImages?: {
    url: string;
    credit: string;
    description: string;
    category: 'lifestyle' | 'city' | 'work' | 'nature';
  }[];
}

export interface ILifeNode extends Document {
  _id: mongoose.Types.ObjectId;
  sessionId: mongoose.Types.ObjectId;
  parentNodeId?: mongoose.Types.ObjectId;
  childNodeIds: mongoose.Types.ObjectId[];
  depth: number;
  order: number;
  choice: IChoice;
  aiNarrative: IAiNarrative;
  metrics: IMetrics;
  media: IMedia;
  processingTime: number;
  version: number;
  status: 'generating' | 'completed' | 'error';
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LifeNodeSchema = new Schema<ILifeNode>({
  sessionId: {
    type: Schema.Types.ObjectId,
    ref: 'LifeSession',
    required: true
  },
  parentNodeId: {
    type: Schema.Types.ObjectId,
    ref: 'LifeNode',
    default: null
  },
  childNodeIds: [{
    type: Schema.Types.ObjectId,
    ref: 'LifeNode'
  }],
  depth: {
    type: Number,
    required: true,
    min: 0,
    max: 10
  },
  order: {
    type: Number,
    required: true,
    min: 0
  },
  choice: {
    careerChange: { type: String, trim: true },
    locationChange: {
      city: { type: String, trim: true },
      country: { type: String, trim: true }
    },
    educationChange: { type: String, trim: true },
    lifestyleChange: { type: String, trim: true },
    personalityChange: { type: String, trim: true },
    relationshipChange: { type: String, trim: true }
  },
  aiNarrative: {
    summary: { type: String, required: true },
    chapters: [{
      title: { type: String, required: true },
      text: { type: String, required: true },
      yearRange: { type: String, required: true },
      highlights: [{ type: String }]
    }],
    milestones: [{
      year: { type: Number, required: true },
      event: { type: String, required: true },
      significance: { 
        type: String, 
        enum: ['low', 'medium', 'high'],
        default: 'medium'
      },
      category: { 
        type: String, 
        enum: ['career', 'personal', 'financial', 'health', 'relationship'],
        required: true
      }
    }],
    tone: { 
      type: String, 
      enum: ['optimistic', 'realistic', 'cautious', 'balanced'],
      default: 'balanced'
    },
    confidenceScore: { 
      type: Number, 
      min: 0, 
      max: 1,
      default: 0.5
    },
    disclaimers: [{ type: String }]
  },
  metrics: {
    city: {
      name: { type: String, required: true },
      country: { type: String, required: true },
      coordinates: {
        latitude: { type: Number },
        longitude: { type: Number }
      },
      teleportScores: {
        overall: { type: Number, min: 0, max: 10 },
        costOfLiving: { type: Number, min: 0, max: 10 },
        safety: { type: Number, min: 0, max: 10 },
        housing: { type: Number, min: 0, max: 10 },
        healthcare: { type: Number, min: 0, max: 10 },
        education: { type: Number, min: 0, max: 10 },
        leisure: { type: Number, min: 0, max: 10 },
        tolerance: { type: Number, min: 0, max: 10 },
        commute: { type: Number, min: 0, max: 10 },
        business: { type: Number, min: 0, max: 10 },
        economy: { type: Number, min: 0, max: 10 }
      },
      climate: {
        avgTempC: { type: Number },
        avgTempF: { type: Number },
        rainDays: { type: Number, min: 0, max: 365 },
        sunnyDays: { type: Number, min: 0, max: 365 },
        season: { type: String },
        comfortIndex: { type: Number, min: 0, max: 10 }
      },
      population: { type: Number, min: 0 },
      timezone: { type: String }
    },
    occupation: {
      name: { type: String, required: true },
      category: { type: String, required: true },
      onetCode: { type: String },
      demandIndex: { type: Number, min: 0, max: 10 },
      educationTypical: { type: String },
      skillsRequired: [{ type: String }],
      tasksTypical: [{ type: String }],
      growthOutlook: { 
        type: String, 
        enum: ['declining', 'stable', 'growing', 'rapid']
      },
      automationRisk: { 
        type: String, 
        enum: ['low', 'medium', 'high']
      },
      workLifeBalance: { type: Number, min: 0, max: 10 },
      stressLevel: { type: Number, min: 0, max: 10 }
    },
    finances: {
      salaryLowUSD: { type: Number, min: 0 },
      salaryHighUSD: { type: Number, min: 0 },
      salaryMedianUSD: { type: Number, min: 0 },
      colIndex: { type: Number, min: 0, required: true },
      currency: { type: String, required: true, default: 'USD' },
      localSalaryLow: { type: Number, min: 0 },
      localSalaryHigh: { type: Number, min: 0 },
      localSalaryMedian: { type: Number, min: 0 },
      savingsPotential: { type: Number, min: 0, max: 10 },
      retirementAge: { type: Number, min: 50, max: 80 },
      financialSecurity: { 
        type: String, 
        enum: ['low', 'medium', 'high']
      }
    },
    qualityOfLifeIndex: { type: Number, min: 0, max: 10, required: true },
    happinessScore: { type: Number, min: 0, max: 10, required: true },
    workLifeBalance: { type: Number, min: 0, max: 10, required: true },
    healthIndex: { type: Number, min: 0, max: 10, required: true },
    socialIndex: { type: Number, min: 0, max: 10, required: true },
    creativityIndex: { type: Number, min: 0, max: 10, required: true },
    adventureIndex: { type: Number, min: 0, max: 10, required: true }
  },
  media: {
    coverPhoto: {
      url: { type: String, required: true },
      credit: { type: String, required: true },
      description: { type: String, required: true }
    },
    additionalImages: [{
      url: { type: String, required: true },
      credit: { type: String, required: true },
      description: { type: String, required: true },
      category: { 
        type: String, 
        enum: ['lifestyle', 'city', 'work', 'nature'],
        required: true
      }
    }]
  },
  processingTime: {
    type: Number,
    min: 0,
    default: 0
  },
  version: {
    type: Number,
    default: 1,
    min: 1
  },
  status: {
    type: String,
    enum: ['generating', 'completed', 'error'],
    default: 'generating'
  },
  errorMessage: {
    type: String,
    trim: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
LifeNodeSchema.index({ sessionId: 1, depth: 1, order: 1 });
LifeNodeSchema.index({ parentNodeId: 1 });
LifeNodeSchema.index({ status: 1, createdAt: -1 });
LifeNodeSchema.index({ 'metrics.city.name': 1 });
LifeNodeSchema.index({ 'metrics.occupation.name': 1 });

// Virtual for children
LifeNodeSchema.virtual('children', {
  ref: 'LifeNode',
  localField: '_id',
  foreignField: 'parentNodeId'
});

// Virtual for parent
LifeNodeSchema.virtual('parent', {
  ref: 'LifeNode',
  localField: 'parentNodeId',
  foreignField: '_id',
  justOne: true
});

// Pre-save middleware to update parent's childNodeIds
LifeNodeSchema.pre('save', async function(next) {
  if (this.isNew && this.parentNodeId) {
    await LifeNode.findByIdAndUpdate(
      this.parentNodeId,
      { $addToSet: { childNodeIds: this._id } }
    );
  }
  next();
});

export const LifeNode = mongoose.model<ILifeNode>('LifeNode', LifeNodeSchema);