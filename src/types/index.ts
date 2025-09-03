// User types
export interface User {
  id: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
  subscriptionTier: 'free' | 'pro';
  createdAt: Date;
  updatedAt: Date;
}

// Prompt template types
export interface PromptTemplate {
  id: string;
  userId: string;
  title: string;
  templateContent: string;
  category: string;
  variables: Record<string, string>;
  metadata: Record<string, unknown>;
  isPublic: boolean;
  tags: string[];
  usageCount: number;
  lastUsedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// AI usage types
export interface AIUsageLog {
  id: string;
  userId: string;
  operationType: 'tighten' | 'expand';
  inputTokens: number;
  outputTokens: number;
  costCents?: number;
  success: boolean;
  errorMessage?: string;
  createdAt: Date;
}

export interface UserQuota {
  userId: string;
  aiImproveCallsUsed: number;
  aiImproveCallsLimit: number;
  quotaResetDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Subscription types
export interface Subscription {
  id: string;
  userId: string;
  stripeCustomerId: string;
  stripeSubscriptionId?: string;
  status: 'active' | 'past_due' | 'canceled' | 'unpaid';
  tier: 'free' | 'pro';
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface FeatureEntitlements {
  userId: string;
  maxSavedPrompts: number;
  maxAiCallsMonthly: number;
  canPublishCommunity: boolean;
  canBulkExport: boolean;
  accessAllCategories: boolean;
  updatedAt: Date;
}

// Community types
export interface CommunityPrompt {
  id: string;
  authorId: string;
  originalPromptId?: string;
  title: string;
  description?: string;
  content: string;
  category: string;
  tags: string[];
  viewCount: number;
  saveCount: number;
  ratingAverage: number;
  ratingCount: number;
  isFeatured: boolean;
  status: 'draft' | 'published' | 'flagged' | 'removed';
  publishedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CommunitySave {
  id: string;
  userId: string;
  promptId: string;
  savedAt: Date;
}

export interface CommunityRating {
  id: string;
  userId: string;
  promptId: string;
  rating: number;
  createdAt: Date;
}

// Form types
export interface PromptBuilderForm {
  role: string;
  topic: string;
  tone: string;
  outputType: string;
  templateContent: string;
}

// API response types
export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
