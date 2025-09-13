import { config } from '../config';
import { LLMConfig, ProviderConfig, ModelConfig } from './types';
import { OpenAIProvider } from './providers/openai';
import { AnthropicProvider } from './providers/anthropic';
import { MockProvider } from './providers/mock';
import { LLMProviderManager } from './manager';

// Model configurations
const OPENAI_MODELS: ModelConfig[] = [
  {
    name: 'gpt-4o-mini',
    provider: 'openai',
    maxTokens: 4096,
    inputCostPer1K: 0.15, // $0.0015 per 1K tokens
    outputCostPer1K: 0.6, // $0.006 per 1K tokens
    contextWindow: 128000,
    capabilities: ['low', 'medium', 'high'],
    recommendedFor: [
      'prompt-improve',
      'prompt-generate',
      'content-summarize',
      'content-expand',
    ],
  },
  {
    name: 'gpt-4o',
    provider: 'openai',
    maxTokens: 4096,
    inputCostPer1K: 2.5, // $0.025 per 1K tokens
    outputCostPer1K: 10, // $0.10 per 1K tokens
    contextWindow: 128000,
    capabilities: ['medium', 'high'],
    recommendedFor: ['code-review', 'analysis', 'translation'],
  },
  {
    name: 'gpt-3.5-turbo',
    provider: 'openai',
    maxTokens: 4096,
    inputCostPer1K: 0.5, // $0.005 per 1K tokens
    outputCostPer1K: 1.5, // $0.015 per 1K tokens
    contextWindow: 16385,
    capabilities: ['low', 'medium'],
    recommendedFor: ['prompt-improve', 'content-summarize'],
  },
];

const ANTHROPIC_MODELS: ModelConfig[] = [
  {
    name: 'claude-3-haiku-20240307',
    provider: 'anthropic',
    maxTokens: 4096,
    inputCostPer1K: 0.25, // $0.0025 per 1K tokens
    outputCostPer1K: 1.25, // $0.0125 per 1K tokens
    contextWindow: 200000,
    capabilities: ['low', 'medium', 'high'],
    recommendedFor: [
      'prompt-improve',
      'prompt-generate',
      'content-summarize',
      'content-expand',
    ],
  },
  {
    name: 'claude-3-sonnet-20240229',
    provider: 'anthropic',
    maxTokens: 4096,
    inputCostPer1K: 3, // $0.03 per 1K tokens
    outputCostPer1K: 15, // $0.15 per 1K tokens
    contextWindow: 200000,
    capabilities: ['medium', 'high'],
    recommendedFor: ['code-review', 'analysis', 'translation'],
  },
  {
    name: 'claude-3-opus-20240229',
    provider: 'anthropic',
    maxTokens: 4096,
    inputCostPer1K: 15, // $0.15 per 1K tokens
    outputCostPer1K: 75, // $0.75 per 1K tokens
    contextWindow: 200000,
    capabilities: ['high'],
    recommendedFor: ['analysis', 'code-review'],
  },
];

const MOCK_MODELS: ModelConfig[] = [
  {
    name: 'gpt-4o-mini',
    provider: 'mock',
    maxTokens: 4096,
    inputCostPer1K: 0.15,
    outputCostPer1K: 0.6,
    contextWindow: 128000,
    capabilities: ['low', 'medium', 'high'],
    recommendedFor: [
      'prompt-improve',
      'prompt-generate',
      'content-summarize',
      'content-expand',
    ],
  },
];

// Provider configurations
const OPENAI_CONFIG: ProviderConfig = {
  name: 'openai',
  apiKey: config.openaiApiKey || '',
  timeout: 30000, // 30 seconds
  maxRetries: 3,
  models: OPENAI_MODELS,
  priority: 1, // Higher priority (lower number)
  enabled: !!config.openaiApiKey && !config.skipAIRequest,
};

const ANTHROPIC_CONFIG: ProviderConfig = {
  name: 'anthropic',
  apiKey: config.anthropicApiKey || '',
  timeout: 30000, // 30 seconds
  maxRetries: 3,
  models: ANTHROPIC_MODELS,
  priority: 2, // Lower priority (higher number)
  enabled: !!config.anthropicApiKey && !config.skipAIRequest,
};

const MOCK_CONFIG: ProviderConfig = {
  name: 'mock',
  apiKey: '', // Mock provider doesn't need API key
  timeout: 5000, // 5 seconds for mock
  maxRetries: 0, // No retries for mock
  models: MOCK_MODELS,
  priority: 0, // Highest priority when in mock mode
  enabled: config.skipAIRequest,
};

// LLM Configuration
export const LLM_CONFIG: LLMConfig = {
  providers: config.skipAIRequest
    ? [MOCK_CONFIG]
    : [OPENAI_CONFIG, ANTHROPIC_CONFIG],
  defaultProvider: config.skipAIRequest ? 'mock' : 'openai',
  fallbackProvider: config.skipAIRequest ? 'mock' : 'anthropic',
  maxRetries: config.skipAIRequest ? 0 : 3,
  timeout: config.skipAIRequest ? 5000 : 30000,
  costOptimization: {
    enabled: !config.skipAIRequest,
    maxCostPerRequest: 50, // $0.50 max per request
    preferredProviders: config.skipAIRequest
      ? ['mock']
      : ['openai', 'anthropic'],
  },
  loadBalancing: {
    enabled: !config.skipAIRequest,
    strategy: 'cheapest', // 'round-robin' | 'least-used' | 'fastest' | 'cheapest'
  },
  monitoring: {
    enabled: true,
    logRequests: true,
    logResponses: false, // Don't log full responses for privacy
    trackCosts: !config.skipAIRequest,
  },
};

// Singleton LLM Manager instance
let llmManager: LLMProviderManager | null = null;

export function getLLMManager(): LLMProviderManager {
  if (!llmManager) {
    llmManager = createLLMManager();
  }
  return llmManager;
}

export function createLLMManager(): LLMProviderManager {
  const manager = new LLMProviderManager(LLM_CONFIG);

  // Add Mock provider if SKIP_AI_REQUEST is enabled
  if (config.skipAIRequest) {
    const mockProvider = new MockProvider(MOCK_CONFIG);
    manager.addProvider(mockProvider);
    console.log(
      '🔧 Mock AI provider enabled - no actual API calls will be made'
    );
  } else {
    // Add OpenAI provider if configured
    if (OPENAI_CONFIG.enabled) {
      const openaiProvider = new OpenAIProvider(OPENAI_CONFIG);
      manager.addProvider(openaiProvider);
    }

    // Add Anthropic provider if configured
    if (ANTHROPIC_CONFIG.enabled) {
      const anthropicProvider = new AnthropicProvider(ANTHROPIC_CONFIG);
      manager.addProvider(anthropicProvider);
    }
  }

  // Perform initial health check
  manager
    .checkAllProviders()
    .then(healthStatus => {
      console.log('LLM Provider Health Status:', healthStatus);
    })
    .catch(error => {
      console.error('Failed to perform initial health check:', error);
    });

  return manager;
}

// Utility functions for common operations
export async function improvePrompt(
  prompt: string,
  options?: {
    maxTokens?: number;
    temperature?: number;
    model?: string;
    useFallback?: boolean;
  }
) {
  const manager = getLLMManager();

  const systemPrompt = `You are an expert at improving AI prompts. Your task is to enhance the given prompt by making it more clear, specific, and effective. Focus on:
- Making instructions clearer and more actionable
- Adding relevant context where needed
- Improving structure and flow
- Ensuring the prompt will generate better results from AI models

Return only the improved prompt without any explanations.`;

  const request = {
    systemPrompt,
    userPrompt: `Please improve this prompt:\n\n"${prompt}"`,
    maxTokens: options?.maxTokens || 1000,
    temperature: options?.temperature ?? 0.7,
    model: options?.model,
    operation: 'prompt-improve',
  };

  try {
    if (options?.useFallback) {
      return await manager.generateWithFallback(request);
    } else {
      return await manager.generate(request);
    }
  } catch (error) {
    console.error('Failed to improve prompt:', error);
    throw error;
  }
}

export async function generatePrompt(
  description: string,
  options?: {
    maxTokens?: number;
    temperature?: number;
    model?: string;
    useFallback?: boolean;
  }
) {
  const manager = getLLMManager();

  const systemPrompt = `You are an expert at creating effective AI prompts. Create a well-structured prompt based on the user's description. The prompt should be clear, specific, and optimized for AI models. Return only the generated prompt without any explanations.`;

  const request = {
    systemPrompt,
    userPrompt: `Create a prompt for: ${description}`,
    maxTokens: options?.maxTokens || 500,
    temperature: options?.temperature ?? 0.7,
    model: options?.model,
    operation: 'prompt-generate',
  };

  try {
    if (options?.useFallback) {
      return await manager.generateWithFallback(request);
    } else {
      return await manager.generate(request);
    }
  } catch (error) {
    console.error('Failed to generate prompt:', error);
    throw error;
  }
}

// Health monitoring utilities
export async function getProviderHealth(): Promise<any> {
  const manager = getLLMManager();
  const healthStatus = await manager.checkAllProviders();
  const stats = manager.getProviderStats();

  return {
    health: healthStatus,
    stats: stats,
    timestamp: new Date().toISOString(),
  };
}

export async function getProviderStats(): Promise<any> {
  const manager = getLLMManager();
  return manager.getProviderStats();
}
