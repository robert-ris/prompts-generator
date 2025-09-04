import { LLMProviderManager } from '../manager';
import {
  LLMConfig,
  ProviderConfig,
  ModelConfig,
  LLMRequest,
  LLMResponse,
} from '../types';
import { OpenAIProvider } from '../providers/openai';
import { AnthropicProvider } from '../providers/anthropic';

// Mock providers
jest.mock('../providers/openai');
jest.mock('../providers/anthropic');

const MockOpenAIProvider = OpenAIProvider as jest.MockedClass<
  typeof OpenAIProvider
>;
const MockAnthropicProvider = AnthropicProvider as jest.MockedClass<
  typeof AnthropicProvider
>;

describe('LLMProviderManager', () => {
  let manager: LLMProviderManager;
  let mockConfig: LLMConfig;
  let mockOpenAIProvider: jest.Mocked<OpenAIProvider>;
  let mockAnthropicProvider: jest.Mocked<AnthropicProvider>;

  beforeEach(() => {
    const models: ModelConfig[] = [
      {
        name: 'gpt-4o-mini',
        provider: 'openai',
        maxTokens: 4096,
        inputCostPer1K: 0.15,
        outputCostPer1K: 0.6,
        contextWindow: 128000,
        capabilities: ['low', 'medium', 'high'],
        recommendedFor: ['prompt-improve', 'prompt-generate'],
      },
      {
        name: 'claude-3-haiku-20240307',
        provider: 'anthropic',
        maxTokens: 4096,
        inputCostPer1K: 0.25,
        outputCostPer1K: 1.25,
        contextWindow: 200000,
        capabilities: ['low', 'medium', 'high'],
        recommendedFor: ['prompt-improve', 'prompt-generate'],
      },
    ];

    const openaiConfig: ProviderConfig = {
      name: 'openai',
      apiKey: 'test-openai-key',
      timeout: 30000,
      maxRetries: 3,
      models: [models[0]],
      priority: 1,
      enabled: true,
    };

    const anthropicConfig: ProviderConfig = {
      name: 'anthropic',
      apiKey: 'test-anthropic-key',
      timeout: 30000,
      maxRetries: 3,
      models: [models[1]],
      priority: 2,
      enabled: true,
    };

    mockConfig = {
      providers: [openaiConfig, anthropicConfig],
      defaultProvider: 'openai',
      fallbackProvider: 'anthropic',
      maxRetries: 3,
      timeout: 30000,
      costOptimization: {
        enabled: true,
        maxCostPerRequest: 50,
        preferredProviders: ['openai', 'anthropic'],
      },
      loadBalancing: {
        enabled: true,
        strategy: 'cheapest',
      },
      monitoring: {
        enabled: true,
        logRequests: true,
        logResponses: false,
        trackCosts: true,
      },
    };

    // Mock provider instances
    mockOpenAIProvider = {
      name: 'openai',
      config: openaiConfig,
      generate: jest.fn(),
      healthCheck: jest.fn(),
      estimateTokens: jest.fn(),
      calculateCost: jest.fn(),
      formatPrompt: jest.fn(),
      parseResponse: jest.fn(),
      handleError: jest.fn(),
      isRetryableError: jest.fn(),
    } as any;

    mockAnthropicProvider = {
      name: 'anthropic',
      config: anthropicConfig,
      generate: jest.fn(),
      healthCheck: jest.fn(),
      estimateTokens: jest.fn(),
      calculateCost: jest.fn(),
      formatPrompt: jest.fn(),
      parseResponse: jest.fn(),
      handleError: jest.fn(),
      isRetryableError: jest.fn(),
    } as any;

    MockOpenAIProvider.mockImplementation(() => mockOpenAIProvider);
    MockAnthropicProvider.mockImplementation(() => mockAnthropicProvider);

    manager = new LLMProviderManager(mockConfig);
  });

  describe('constructor', () => {
    it('should initialize with correct config', () => {
      expect(manager).toBeDefined();
    });
  });

  describe('addProvider', () => {
    it('should add provider successfully', () => {
      const newProvider = {
        name: 'test-provider',
        config: mockConfig.providers[0],
        generate: jest.fn(),
        healthCheck: jest.fn(),
        estimateTokens: jest.fn(),
        calculateCost: jest.fn(),
        formatPrompt: jest.fn(),
        parseResponse: jest.fn(),
        handleError: jest.fn(),
        isRetryableError: jest.fn(),
      } as any;

      manager.addProvider(newProvider);

      const providers = manager.listProviders();
      expect(providers).toContain(newProvider);
    });
  });

  describe('removeProvider', () => {
    it('should remove provider successfully', () => {
      const provider = manager.listProviders()[0];
      const providerName = provider.name;

      manager.removeProvider(providerName);

      const providers = manager.listProviders();
      expect(providers.find(p => p.name === providerName)).toBeUndefined();
    });
  });

  describe('getProvider', () => {
    it('should return provider by name', () => {
      const provider = manager.getProvider('openai');
      expect(provider).toBeDefined();
      expect(provider?.name).toBe('openai');
    });

    it('should return undefined for non-existent provider', () => {
      const provider = manager.getProvider('non-existent');
      expect(provider).toBeUndefined();
    });
  });

  describe('listProviders', () => {
    it('should return all providers', () => {
      const providers = manager.listProviders();
      expect(providers).toHaveLength(2);
      expect(providers.map(p => p.name)).toContain('openai');
      expect(providers.map(p => p.name)).toContain('anthropic');
    });
  });

  describe('generate', () => {
    const mockRequest: LLMRequest = {
      systemPrompt: 'You are a helpful assistant.',
      userPrompt: 'Hello, how are you?',
      maxTokens: 100,
      temperature: 0.7,
      operation: 'prompt-improve',
    };

    const mockResponse: LLMResponse = {
      content: 'Hello! I am doing well, thank you for asking.',
      usage: {
        inputTokens: 20,
        outputTokens: 15,
        totalTokens: 35,
        costCents: 25,
      },
      provider: 'openai',
      model: 'gpt-4o-mini',
      responseTimeMs: 1000,
      success: true,
    };

    beforeEach(() => {
      // Add providers to manager
      manager.addProvider(mockOpenAIProvider);
      manager.addProvider(mockAnthropicProvider);
    });

    it('should generate response successfully', async () => {
      mockOpenAIProvider.generate.mockResolvedValue(mockResponse);

      const response = await manager.generate(mockRequest);

      expect(response).toEqual(mockResponse);
      expect(mockOpenAIProvider.generate).toHaveBeenCalledWith(mockRequest);
    });

    it('should throw error when no providers available', async () => {
      // Remove all providers
      manager.removeProvider('openai');
      manager.removeProvider('anthropic');

      await expect(manager.generate(mockRequest)).rejects.toThrow(
        'No available LLM providers'
      );
    });

    it('should update stats on successful generation', async () => {
      mockOpenAIProvider.generate.mockResolvedValue(mockResponse);

      await manager.generate(mockRequest);

      const stats = manager.getProviderStats();
      const openaiStats = stats.find(s => s.provider === 'openai');
      expect(openaiStats?.totalRequests).toBe(1);
      expect(openaiStats?.successfulRequests).toBe(1);
      expect(openaiStats?.totalCostCents).toBe(25);
    });

    it('should update stats on failed generation', async () => {
      const error = new Error('API error');
      mockOpenAIProvider.generate.mockRejectedValue(error);

      await expect(manager.generate(mockRequest)).rejects.toThrow('API error');

      const stats = manager.getProviderStats();
      const openaiStats = stats.find(s => s.provider === 'openai');
      expect(openaiStats?.totalRequests).toBe(1);
      expect(openaiStats?.failedRequests).toBe(1);
    });
  });

  describe('generateWithFallback', () => {
    const mockRequest: LLMRequest = {
      systemPrompt: 'You are a helpful assistant.',
      userPrompt: 'Hello, how are you?',
      maxTokens: 100,
      temperature: 0.7,
      operation: 'prompt-improve',
    };

    const mockResponse: LLMResponse = {
      content: 'Hello! I am doing well, thank you for asking.',
      usage: {
        inputTokens: 20,
        outputTokens: 15,
        totalTokens: 35,
        costCents: 25,
      },
      provider: 'anthropic',
      model: 'claude-3-haiku-20240307',
      responseTimeMs: 1000,
      success: true,
    };

    beforeEach(() => {
      manager.addProvider(mockOpenAIProvider);
      manager.addProvider(mockAnthropicProvider);
    });

    it('should use fallback when primary provider fails', async () => {
      mockOpenAIProvider.generate.mockRejectedValue(new Error('OpenAI failed'));
      mockAnthropicProvider.generate.mockResolvedValue(mockResponse);

      const response = await manager.generateWithFallback(mockRequest);

      expect(response).toEqual(mockResponse);
      expect(mockOpenAIProvider.generate).toHaveBeenCalledWith(mockRequest);
      expect(mockAnthropicProvider.generate).toHaveBeenCalledWith(mockRequest);
    });

    it('should throw error when all providers fail', async () => {
      mockOpenAIProvider.generate.mockRejectedValue(new Error('OpenAI failed'));
      mockAnthropicProvider.generate.mockRejectedValue(
        new Error('Anthropic failed')
      );

      await expect(manager.generateWithFallback(mockRequest)).rejects.toThrow(
        'All LLM providers failed'
      );
    });

    it('should use first successful provider', async () => {
      mockOpenAIProvider.generate.mockResolvedValue(mockResponse);

      const response = await manager.generateWithFallback(mockRequest);

      expect(response).toEqual(mockResponse);
      expect(mockOpenAIProvider.generate).toHaveBeenCalledWith(mockRequest);
      expect(mockAnthropicProvider.generate).not.toHaveBeenCalled();
    });
  });

  describe('selectProvider', () => {
    beforeEach(() => {
      manager.addProvider(mockOpenAIProvider);
      manager.addProvider(mockAnthropicProvider);
    });

    it('should select cheapest provider by default', () => {
      const request: LLMRequest = {
        systemPrompt: 'Test',
        userPrompt: 'Test',
        operation: 'prompt-improve',
      };

      const provider = manager.selectProvider(request);
      expect(provider.name).toBe('openai'); // OpenAI is cheaper
    });

    it('should throw error when no providers available', () => {
      manager.removeProvider('openai');
      manager.removeProvider('anthropic');

      const request: LLMRequest = {
        systemPrompt: 'Test',
        userPrompt: 'Test',
      };

      expect(() => manager.selectProvider(request)).toThrow(
        'No available LLM providers'
      );
    });
  });

  describe('getBestProvider', () => {
    beforeEach(() => {
      manager.addProvider(mockOpenAIProvider);
      manager.addProvider(mockAnthropicProvider);
    });

    it('should return provider based on operation and complexity', () => {
      const provider = manager.getBestProvider('prompt-improve', 'low');
      expect(provider).toBeDefined();
    });

    it('should return cheapest provider when cost optimization is enabled', () => {
      const provider = manager.getBestProvider('prompt-improve', 'low');
      expect(provider?.name).toBe('openai'); // OpenAI is cheaper
    });
  });

  describe('checkAllProviders', () => {
    beforeEach(() => {
      manager.addProvider(mockOpenAIProvider);
      manager.addProvider(mockAnthropicProvider);
    });

    it('should check health of all providers', async () => {
      mockOpenAIProvider.healthCheck.mockResolvedValue(true);
      mockAnthropicProvider.healthCheck.mockResolvedValue(false);

      const healthStatus = await manager.checkAllProviders();

      expect(healthStatus).toHaveLength(2);
      expect(healthStatus.find(h => h.provider === 'openai')?.healthy).toBe(
        true
      );
      expect(healthStatus.find(h => h.provider === 'anthropic')?.healthy).toBe(
        false
      );
    });

    it('should handle provider health check failures', async () => {
      mockOpenAIProvider.healthCheck.mockRejectedValue(
        new Error('Health check failed')
      );

      const healthStatus = await manager.checkAllProviders();

      expect(healthStatus).toHaveLength(2);
      expect(healthStatus.find(h => h.provider === 'openai')?.healthy).toBe(
        false
      );
      expect(healthStatus.find(h => h.provider === 'openai')?.error).toBe(
        'Health check failed'
      );
    });
  });

  describe('getProviderStats', () => {
    it('should return provider statistics', () => {
      const stats = manager.getProviderStats();
      expect(stats).toHaveLength(2);
      expect(stats.find(s => s.provider === 'openai')).toBeDefined();
      expect(stats.find(s => s.provider === 'anthropic')).toBeDefined();
    });

    it('should initialize stats correctly', () => {
      const stats = manager.getProviderStats();
      const openaiStats = stats.find(s => s.provider === 'openai');

      expect(openaiStats?.totalRequests).toBe(0);
      expect(openaiStats?.successfulRequests).toBe(0);
      expect(openaiStats?.failedRequests).toBe(0);
      expect(openaiStats?.averageResponseTime).toBe(0);
      expect(openaiStats?.totalCostCents).toBe(0);
    });
  });

  describe('load balancing strategies', () => {
    beforeEach(() => {
      manager.addProvider(mockOpenAIProvider);
      manager.addProvider(mockAnthropicProvider);
    });

    it('should use round-robin strategy', () => {
      const config = { ...mockConfig };
      config.loadBalancing.strategy = 'round-robin';
      const roundRobinManager = new LLMProviderManager(config);
      roundRobinManager.addProvider(mockOpenAIProvider);
      roundRobinManager.addProvider(mockAnthropicProvider);

      const request: LLMRequest = {
        systemPrompt: 'Test',
        userPrompt: 'Test',
      };

      const provider1 = roundRobinManager.selectProvider(request);
      const provider2 = roundRobinManager.selectProvider(request);

      expect(provider1.name).not.toBe(provider2.name);
    });

    it('should use cheapest strategy', () => {
      const request: LLMRequest = {
        systemPrompt: 'Test',
        userPrompt: 'Test',
      };

      const provider = manager.selectProvider(request);
      expect(provider.name).toBe('openai'); // OpenAI is cheaper
    });
  });

  describe('complexity assessment', () => {
    it('should assess complexity correctly', () => {
      const shortRequest: LLMRequest = {
        systemPrompt: 'Short',
        userPrompt: 'Short prompt',
      };

      const longRequest: LLMRequest = {
        systemPrompt: 'A'.repeat(1000),
        userPrompt: 'A'.repeat(1000),
      };

      const shortComplexity = (manager as any).assessComplexity(shortRequest);
      const longComplexity = (manager as any).assessComplexity(longRequest);

      expect(shortComplexity).toBe('low');
      expect(longComplexity).toBe('high');
    });
  });
});
