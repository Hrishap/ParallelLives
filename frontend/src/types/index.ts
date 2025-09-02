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

// Session Types
export interface LifeSession {
  _id: string;
  title: string;
  description?: string;
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
  initialChoice: {
    careerChange?: string;
    locationChange?: {
      city?: string;
      country?: string;
    };
    educationChange?: string;
    lifestyleChange?: string;
  };
  rootNodeId?: string;
  totalNodes: number;
  createdAt: string;
  updatedAt: string;
}

// Node Types
export interface LifeNode {
  _id: string;
  sessionId: string;
  parentNodeId?: string;
  depth: number;
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
  metrics?: {
    happinessScore?: number;
    qualityOfLifeIndex?: number;
    workLifeBalance?: number;
    healthIndex?: number;
    socialIndex?: number;
    creativityIndex?: number;
    adventureIndex?: number;
    city?: {
      name?: string;
      country?: string;
      costOfLiving?: number;
      quality?: number;
      climate?: any;
    };
    occupation?: {
      name?: string;
      salary?: number;
      satisfaction?: number;
      growth?: string;
    };
    finances?: {
      salaryMedianUSD?: number;
      income?: number;
      expenses?: number;
      savings?: number;
      debt?: number;
    };
    relationships?: {
      family?: string;
      friends?: string;
      romantic?: string;
    };
    health?: {
      physical?: string;
      mental?: string;
      lifestyle?: string;
    };
  };
  aiNarrative?: {
    summary?: string;
    chapters?: Array<{
      title: string;
      text: string;
    }>;
  };
  media?: {
    coverPhoto?: {
      url: string;
      description: string;
    };
  };
  outcome?: {
    story?: string;
    consequences?: any;
    images?: string[];
    mood?: 'positive' | 'neutral' | 'negative' | 'mixed';
    riskLevel?: 'low' | 'medium' | 'high';
  };
  status: 'pending' | 'generating' | 'completed' | 'failed';
  processingTime?: number;
  error?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

// Tree Structure Types
export interface TreeNode {
  id: string;
  parentId?: string;
  children: TreeNode[];
  data: LifeNode;
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

// Component Props Types
export interface SplitViewProps {
  session: LifeSession;
  tree: TreeStructure;
  selectedNodeId: string | null;
  onNodeSelect: (nodeId: string | null) => void;
}

export interface TreeVisualizationProps {
  tree: TreeStructure;
  selectedNodeId: string | null;
  onNodeSelect: (nodeId: string) => void;
}

export interface StoryReaderProps {
  node: LifeNode;
  onBranch: () => void;
}

export interface NodeBrancherProps {
  sessionId: string;
  parentNodeId?: string;
  tree?: TreeStructure;
  onClose: () => void;
  onCreated: (nodeId: string) => void;
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
