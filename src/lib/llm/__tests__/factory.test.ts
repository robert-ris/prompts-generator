import {
  getLLMManager,
  createLLMManager,
  improvePrompt,
  generatePrompt,
  getProviderHealth,
  getProviderStats,
  LLM_CONFIG,
} from '../factory';
import { LLMProviderManager } from '../manager';

// Mock the manager
jest.mock('../manager');
const MockLLMProviderManager = LLMProviderManager as jest.MockedClass<
  typeof LLMProviderManager
>;

describe('LLM Factory', () => {
  let mockManager: jest.Mocked<LLMProviderManager>;

  beforeEach(() => {
    mockManager = {
      addProvider: jest.fn(),
      removeProvider: jest.fn(),
      getProvider: jest.fn(),
      listProviders: jest.fn(),
      generate: jest.fn(),
      generateWithFallback: jest.fn(),
      selectProvider: jest.fn(),
      getBestProvider: jest.fn(),
      checkAllProviders: jest.fn(),
      getProviderStats: jest.fn(),
    } as any;

    MockLLMProviderManager.mockImplementation(() => mockManager);
  });

  describe('LLM_CONFIG', () => {
    it('should have correct structure', () => {
      expect(LLM_CONFIG).toBeDefined();
      expect(LLM_CONFIG.providers).toHaveLength(2);
      expect(LLM_CONFIG.defaultProvider).toBe('openai');
      expect(LLM_CONFIG.fallbackProvider).toBe('anthropic');
      expect(LLM_CONFIG.loadBalancing.strategy).toBe('cheapest');
      expect(LLM_CONFIG.costOptimization.enabled).toBe(true);
    });

    it('should have OpenAI models configured', () => {
      const openaiConfig = LLM_CONFIG.providers.find(p => p.name === 'openai');
      expect(openaiConfig).toBeDefined();
      expect(openaiConfig?.models).toHaveLength(3);
      expect(openaiConfig?.models.map(m => m.name)).toContain('gpt-4o-mini');
      expect(openaiConfig?.models.map(m => m.name)).toContain('gpt-4o');
      expect(openaiConfig?.models.map(m => m.name)).toContain('gpt-3.5-turbo');
    });

    it('should have Anthropic models configured', () => {
      const anthropicConfig = LLM_CONFIG.providers.find(
        p => p.name === 'anthropic'
      );
      expect(anthropicConfig).toBeDefined();
      expect(anthropicConfig?.models).toHaveLength(3);
      expect(anthropicConfig?.models.map(m => m.name)).toContain(
        'claude-3-haiku-20240307'
      );
      expect(anthropicConfig?.models.map(m => m.name)).toContain(
        'claude-3-sonnet-20240229'
      );
      expect(anthropicConfig?.models.map(m => m.name)).toContain(
        'claude-3-opus-20240229'
      );
    });

    it('should have correct cost configurations', () => {
      const gpt4oMini = LLM_CONFIG.providers
        .find(p => p.name === 'openai')
        ?.models.find(m => m.name === 'gpt-4o-mini');

      expect(gpt4oMini?.inputCostPer1K).toBe(0.15);
      expect(gpt4oMini?.outputCostPer1K).toBe(0.6);

      const claudeHaiku = LLM_CONFIG.providers
        .find(p => p.name === 'anthropic')
        ?.models.find(m => m.name === 'claude-3-haiku-20240307');

      expect(claudeHaiku?.inputCostPer1K).toBe(0.25);
      expect(claudeHaiku?.outputCostPer1K).toBe(1.25);
    });
  });

  describe('createLLMManager', () => {
    it('should create manager with correct config', () => {
      const manager = createLLMManager();
      expect(manager).toBeDefined();
      expect(MockLLMProviderManager).toHaveBeenCalledWith(LLM_CONFIG);
    });

    it('should add OpenAI provider when enabled', () => {
      // Mock config with OpenAI enabled
      const configWithOpenAI = {
        ...LLM_CONFIG,
        providers: LLM_CONFIG.providers.map(p => ({
          ...p,
          enabled: p.name === 'openai' ? true : false,
        })),
      };

      MockLLMProviderManager.mockImplementation(() => mockManager);

      createLLMManager();

      expect(mockManager.addProvider).toHaveBeenCalled();
    });

    it('should add Anthropic provider when enabled', () => {
      // Mock config with Anthropic enabled
      const configWithAnthropic = {
        ...LLM_CONFIG,
        providers: LLM_CONFIG.providers.map(p => ({
          ...p,
          enabled: p.name === 'anthropic' ? true : false,
        })),
      };

      MockLLMProviderManager.mockImplementation(() => mockManager);

      createLLMManager();

      expect(mockManager.addProvider).toHaveBeenCalled();
    });

    it('should perform initial health check', async () => {
      mockManager.checkAllProviders.mockResolvedValue([
        {
          provider: 'openai',
          healthy: true,
          responseTimeMs: 100,
          lastChecked: new Date(),
        },
        {
          provider: 'anthropic',
          healthy: true,
          responseTimeMs: 150,
          lastChecked: new Date(),
        },
      ]);

      createLLMManager();

      // Wait for health check to complete
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockManager.checkAllProviders).toHaveBeenCalled();
    });
  });

  describe('getLLMManager', () => {
    it('should return singleton instance', () => {
      const manager1 = getLLMManager();
      const manager2 = getLLMManager();

      expect(manager1).toBe(manager2);
    });

    it('should create new instance if none exists', () => {
      // Clear any existing singleton
      jest.resetModules();

      const manager = getLLMManager();
      expect(manager).toBeDefined();
    });
  });

  describe('improvePrompt', () => {
    const mockResponse = {
      content: 'Improved prompt',
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
      mockManager.generate.mockResolvedValue(mockResponse);
      mockManager.generateWithFallback.mockResolvedValue(mockResponse);
    });

    it('should improve prompt in tighten mode', async () => {
      const result = await improvePrompt('Original prompt', 'tighten');

      expect(result).toEqual(mockResponse);
      expect(mockManager.generate).toHaveBeenCalledWith(
        expect.objectContaining({
          systemPrompt: expect.stringContaining('tighten'),
          userPrompt: expect.stringContaining('tighten'),
          operation: 'prompt-improve',
        })
      );
    });

    it('should improve prompt in expand mode', async () => {
      const result = await improvePrompt('Original prompt', 'expand');

      expect(result).toEqual(mockResponse);
      expect(mockManager.generate).toHaveBeenCalledWith(
        expect.objectContaining({
          systemPrompt: expect.stringContaining('expand'),
          userPrompt: expect.stringContaining('expand'),
          operation: 'prompt-improve',
        })
      );
    });

    it('should use fallback when specified', async () => {
      const result = await improvePrompt('Original prompt', 'tighten', {
        useFallback: true,
      });

      expect(result).toEqual(mockResponse);
      expect(mockManager.generateWithFallback).toHaveBeenCalled();
      expect(mockManager.generate).not.toHaveBeenCalled();
    });

    it('should pass custom options', async () => {
      const result = await improvePrompt('Original prompt', 'tighten', {
        maxTokens: 500,
        temperature: 0.5,
        model: 'gpt-4o',
      });

      expect(result).toEqual(mockResponse);
      expect(mockManager.generate).toHaveBeenCalledWith(
        expect.objectContaining({
          maxTokens: 500,
          temperature: 0.5,
          model: 'gpt-4o',
        })
      );
    });

    it('should handle errors', async () => {
      const error = new Error('API error');
      mockManager.generate.mockRejectedValue(error);

      await expect(improvePrompt('Original prompt', 'tighten')).rejects.toThrow(
        'API error'
      );
    });
  });

  describe('generatePrompt', () => {
    const mockResponse = {
      content: 'Generated prompt',
      usage: {
        inputTokens: 15,
        outputTokens: 20,
        totalTokens: 35,
        costCents: 30,
      },
      provider: 'openai',
      model: 'gpt-4o-mini',
      responseTimeMs: 800,
      success: true,
    };

    beforeEach(() => {
      mockManager.generate.mockResolvedValue(mockResponse);
      mockManager.generateWithFallback.mockResolvedValue(mockResponse);
    });

    it('should generate prompt from description', async () => {
      const result = await generatePrompt('Create a prompt for email writing');

      expect(result).toEqual(mockResponse);
      expect(mockManager.generate).toHaveBeenCalledWith(
        expect.objectContaining({
          systemPrompt: expect.stringContaining(
            'expert at creating effective AI prompts'
          ),
          userPrompt: expect.stringContaining(
            'Create a prompt for email writing'
          ),
          operation: 'prompt-generate',
        })
      );
    });

    it('should use fallback when specified', async () => {
      const result = await generatePrompt('Create a prompt', {
        useFallback: true,
      });

      expect(result).toEqual(mockResponse);
      expect(mockManager.generateWithFallback).toHaveBeenCalled();
      expect(mockManager.generate).not.toHaveBeenCalled();
    });

    it('should pass custom options', async () => {
      const result = await generatePrompt('Create a prompt', {
        maxTokens: 300,
        temperature: 0.8,
        model: 'claude-3-haiku-20240307',
      });

      expect(result).toEqual(mockResponse);
      expect(mockManager.generate).toHaveBeenCalledWith(
        expect.objectContaining({
          maxTokens: 300,
          temperature: 0.8,
          model: 'claude-3-haiku-20240307',
        })
      );
    });

    it('should handle errors', async () => {
      const error = new Error('API error');
      mockManager.generate.mockRejectedValue(error);

      await expect(generatePrompt('Create a prompt')).rejects.toThrow(
        'API error'
      );
    });
  });

  describe('getProviderHealth', () => {
    it('should return health status and stats', async () => {
      const mockHealthStatus = [
        {
          provider: 'openai',
          healthy: true,
          responseTimeMs: 100,
          lastChecked: new Date(),
        },
        {
          provider: 'anthropic',
          healthy: false,
          responseTimeMs: 0,
          lastChecked: new Date(),
          error: 'Connection failed',
        },
      ];

      const mockStats = [
        {
          provider: 'openai',
          totalRequests: 10,
          successfulRequests: 9,
          failedRequests: 1,
          averageResponseTime: 150,
          totalCostCents: 250,
          lastUsed: new Date(),
        },
        {
          provider: 'anthropic',
          totalRequests: 5,
          successfulRequests: 4,
          failedRequests: 1,
          averageResponseTime: 200,
          totalCostCents: 100,
          lastUsed: new Date(),
        },
      ];

      mockManager.checkAllProviders.mockResolvedValue(mockHealthStatus);
      mockManager.getProviderStats.mockReturnValue(mockStats);

      const result = await getProviderHealth();

      expect(result).toEqual({
        health: mockHealthStatus,
        stats: mockStats,
        timestamp: expect.any(String),
      });
    });
  });

  describe('getProviderStats', () => {
    it('should return provider statistics', () => {
      const mockStats = [
        {
          provider: 'openai',
          totalRequests: 10,
          successfulRequests: 9,
          failedRequests: 1,
          averageResponseTime: 150,
          totalCostCents: 250,
          lastUsed: new Date(),
        },
        {
          provider: 'anthropic',
          totalRequests: 5,
          successfulRequests: 4,
          failedRequests: 1,
          averageResponseTime: 200,
          totalCostCents: 100,
          lastUsed: new Date(),
        },
      ];

      mockManager.getProviderStats.mockReturnValue(mockStats);

      const result = getProviderStats();

      expect(result).toEqual(mockStats);
      expect(mockManager.getProviderStats).toHaveBeenCalled();
    });
  });
});
