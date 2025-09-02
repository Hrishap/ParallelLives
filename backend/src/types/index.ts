import { ILifeSession, ILifeNode, IUser } from '../models';

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Request Types
export interface CreateSessionRequest {
  title: string;
  description?: string;
  baseContext?: {
    age?: number;
    country?: string;
    currentCareer?: string;
    currentCity?: string;
    currentEducation?: string;
    values?: string[];
    riskTolerance?: 'low' | 'medium' | 'high';
  };
  initialChoice: {
    careerChange?: string;
    locationChange?: {
      city?: string;
      country?: string;
    };
    educationChange?: string;
    lifestyleChange?: string;
  };
}

export interface CreateNodeRequest {
  parentNodeId?: string;
  choice: {
    careerChange?: string;
    locationChange?: {
      city?: string;
      country?: string;
    };
    educationChange?: string;
    lifestyleChange?: string;
    personalityChange?: string;
    relationshipChange?: string;
  };
  userPreferences?: {
    tone?: 'optimistic' | 'realistic' | 'cautious' | 'balanced';
    focusAreas?: string[];
    timeHorizon?: number;
  };
}

// External API Types
export interface TeleportCityScore {
  name: string;
  score_out_of_10: number;
}

export interface TeleportCityData {
  name: string;
  full_name: string;
  urban_area: {
    name: string;
    slug: string;
  };
  location: {
    latlon: {
      latitude: number;
      longitude: number;
    };
  };
  scores: {
    categories: TeleportCityScore[];
    summary: {
      score: number;
    };
  };
}

export interface OpenMeteoData {
  latitude: number;
  longitude: number;
  daily: {
    time: string[];
    temperature_2m_mean: number[];
    precipitation_sum: number[];
    sunshine_duration: number[];
  };
}

export interface UnsplashImage {
  id: string;
  urls: {
    regular: string;
    small: string;
    thumb: string;
  };
  user: {
    name: string;
    username: string;
  };
  description?: string;
  alt_description?: string;
}

export interface OccupationData {
  code: string;
  title: string;
  description: string;
  tasks: string[];
  skills: string[];
  education: string;
  growth_outlook: string;
  automation_risk: string;
}

// Tree Structure Types
export interface TreeNode {
  id: string;
  parentId?: string;
  children: TreeNode[];
  data: ILifeNode;
  depth: number;
  position: {
    x: number;
    y: number;
  };
}

export interface TreeStructure {
  nodes: TreeNode[];
  edges: {
    source: string;
    target: string;
    type: 'parent-child';
  }[];
  maxDepth: number;
  totalNodes: number;
}

// Cache Types
export interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number;
}

// Error Types
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401);
  }
}

export class ExternalAPIError extends AppError {
  public service: string;

  constructor(message: string, service: string, statusCode: number = 503) {
    super(message, statusCode);
    this.service = service;
  }
}

// Processing Status Types
export type ProcessingStatus = 'pending' | 'in-progress' | 'completed' | 'failed';

export interface ProcessingJob {
  id: string;
  sessionId: string;
  nodeId?: string;
  type: 'create-session' | 'create-node' | 'regenerate-node';
  status: ProcessingStatus;
  progress: number;
  startedAt: Date;
  completedAt?: Date;
  error?: string;
  result?: any;
}

// Export Models
export { IUser, ILifeSession, ILifeNode };