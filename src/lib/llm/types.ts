// LLM Provider Abstraction Types

export interface LLMRequest {
  systemPrompt: string;
  userPrompt: string;
  maxTokens?: number;
  temperature?: number;
  model?: string;
  operation?: string; // For tracking different operations (improve, generate, etc.)
}

export interface LLMResponse {
  content: string;
  usage: TokenUsage;
  provider: string;
  model: string;
  responseTimeMs: number;
  success: boolean;
  error?: string;
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  costCents: number;
}

export interface ModelConfig {
  name: string;
  provider: string;
  maxTokens: number;
  inputCostPer1K: number; // in cents
  outputCostPer1K: number; // in cents
  contextWindow: number;
  capabilities: string[];
  recommendedFor: string[];
}

export interface ProviderConfig {
  name: string;
  apiKey: string;
  baseUrl?: string;
  timeout: number;
  maxRetries: number;
  models: ModelConfig[];
  priority: number; // Lower number = higher priority
  enabled: boolean;
}

export interface LLMProvider {
  name: string;
  config: ProviderConfig;

  // Core methods
  generate(request: LLMRequest): Promise<LLMResponse>;
  healthCheck(): Promise<boolean>;

  // Utility methods
  estimateTokens(text: string): number;
  calculateCost(usage: TokenUsage): number;
  formatPrompt(request: LLMRequest): any; // Provider-specific format
  parseResponse(response: any): LLMResponse;

  // Error handling
  handleError(error: any): string;
  isRetryableError(error: any): boolean;
}

export interface LLMManager {
  // Provider management
  addProvider(provider: LLMProvider): void;
  removeProvider(name: string): void;
  getProvider(name: string): LLMProvider | undefined;
  listProviders(): LLMProvider[];

  // Request handling
  generate(request: LLMRequest): Promise<LLMResponse>;
  generateWithFallback(request: LLMRequest): Promise<LLMResponse>;

  // Provider selection
  selectProvider(request: LLMRequest): LLMProvider;
  getBestProvider(
    operation: string,
    complexity: 'low' | 'medium' | 'high'
  ): LLMProvider;

  // Health monitoring
  checkAllProviders(): Promise<ProviderHealthStatus[]>;
  getProviderStats(): ProviderStats[];
}

export interface ProviderHealthStatus {
  provider: string;
  healthy: boolean;
  responseTimeMs: number;
  lastChecked: Date;
  error?: string;
}

export interface ProviderStats {
  provider: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  totalCostCents: number;
  lastUsed: Date;
}

export interface LLMConfig {
  providers: ProviderConfig[];
  defaultProvider: string;
  fallbackProvider: string;
  maxRetries: number;
  timeout: number;
  costOptimization: {
    enabled: boolean;
    maxCostPerRequest: number; // in cents
    preferredProviders: string[];
  };
  loadBalancing: {
    enabled: boolean;
    strategy: 'round-robin' | 'least-used' | 'fastest' | 'cheapest';
  };
  monitoring: {
    enabled: boolean;
    logRequests: boolean;
    logResponses: boolean;
    trackCosts: boolean;
  };
}

// Operation types for different AI tasks
export type AIOperation =
  | 'prompt-improve'
  | 'prompt-generate'
  | 'content-summarize'
  | 'content-expand'
  | 'code-review'
  | 'translation'
  | 'analysis';

// Complexity levels for provider selection
export type ComplexityLevel = 'low' | 'medium' | 'high';

// Provider-specific error types
export interface ProviderError {
  provider: string;
  code: string;
  message: string;
  retryable: boolean;
  rateLimit?: {
    resetTime: Date;
    limit: number;
    remaining: number;
  };
}
