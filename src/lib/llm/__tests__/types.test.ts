import {
  LLMRequest,
  LLMResponse,
  TokenUsage,
  ModelConfig,
  ProviderConfig,
  AIOperation,
  ComplexityLevel,
} from '../types';

describe('LLM Types', () => {
  describe('LLMRequest', () => {
    it('should have required properties', () => {
      const request: LLMRequest = {
        systemPrompt: 'You are a helpful assistant',
        userPrompt: 'Hello world',
        maxTokens: 1000,
        temperature: 0.7,
        model: 'gpt-4o-mini',
        operation: 'prompt-improve',
      };

      expect(request.systemPrompt).toBe('You are a helpful assistant');
      expect(request.userPrompt).toBe('Hello world');
      expect(request.maxTokens).toBe(1000);
      expect(request.temperature).toBe(0.7);
      expect(request.model).toBe('gpt-4o-mini');
      expect(request.operation).toBe('prompt-improve');
    });

    it('should allow optional properties', () => {
      const request: LLMRequest = {
        systemPrompt: 'You are a helpful assistant',
        userPrompt: 'Hello world',
      };

      expect(request.systemPrompt).toBe('You are a helpful assistant');
      expect(request.userPrompt).toBe('Hello world');
      expect(request.maxTokens).toBeUndefined();
      expect(request.temperature).toBeUndefined();
      expect(request.model).toBeUndefined();
      expect(request.operation).toBeUndefined();
    });
  });

  describe('LLMResponse', () => {
    it('should have all required properties', () => {
      const usage: TokenUsage = {
        inputTokens: 100,
        outputTokens: 50,
        totalTokens: 150,
        costCents: 0.25,
      };

      const response: LLMResponse = {
        content: 'Hello! How can I help you?',
        usage,
        provider: 'openai',
        model: 'gpt-4o-mini',
        responseTimeMs: 1500,
        success: true,
      };

      expect(response.content).toBe('Hello! How can I help you?');
      expect(response.usage).toEqual(usage);
      expect(response.provider).toBe('openai');
      expect(response.model).toBe('gpt-4o-mini');
      expect(response.responseTimeMs).toBe(1500);
      expect(response.success).toBe(true);
      expect(response.error).toBeUndefined();
    });

    it('should handle error responses', () => {
      const usage: TokenUsage = {
        inputTokens: 100,
        outputTokens: 0,
        totalTokens: 100,
        costCents: 0,
      };

      const response: LLMResponse = {
        content: '',
        usage,
        provider: 'openai',
        model: 'gpt-4o-mini',
        responseTimeMs: 500,
        success: false,
        error: 'Rate limit exceeded',
      };

      expect(response.success).toBe(false);
      expect(response.error).toBe('Rate limit exceeded');
      expect(response.content).toBe('');
    });
  });

  describe('TokenUsage', () => {
    it('should calculate total tokens correctly', () => {
      const usage: TokenUsage = {
        inputTokens: 100,
        outputTokens: 50,
        totalTokens: 150,
        costCents: 0.25,
      };

      expect(usage.totalTokens).toBe(usage.inputTokens + usage.outputTokens);
    });
  });

  describe('ModelConfig', () => {
    it('should have all required properties', () => {
      const model: ModelConfig = {
        name: 'gpt-4o-mini',
        provider: 'openai',
        maxTokens: 4096,
        inputCostPer1K: 0.15,
        outputCostPer1K: 0.6,
        contextWindow: 128000,
        capabilities: ['low', 'medium', 'high'],
        recommendedFor: ['prompt-improve', 'prompt-generate'],
      };

      expect(model.name).toBe('gpt-4o-mini');
      expect(model.provider).toBe('openai');
      expect(model.maxTokens).toBe(4096);
      expect(model.inputCostPer1K).toBe(0.15);
      expect(model.outputCostPer1K).toBe(0.6);
      expect(model.contextWindow).toBe(128000);
      expect(model.capabilities).toEqual(['low', 'medium', 'high']);
      expect(model.recommendedFor).toEqual([
        'prompt-improve',
        'prompt-generate',
      ]);
    });
  });

  describe('ProviderConfig', () => {
    it('should have all required properties', () => {
      const models: ModelConfig[] = [
        {
          name: 'gpt-4o-mini',
          provider: 'openai',
          maxTokens: 4096,
          inputCostPer1K: 0.15,
          outputCostPer1K: 0.6,
          contextWindow: 128000,
          capabilities: ['low', 'medium', 'high'],
          recommendedFor: ['prompt-improve'],
        },
      ];

      const config: ProviderConfig = {
        name: 'openai',
        apiKey: 'test-api-key',
        timeout: 30000,
        maxRetries: 3,
        models,
        priority: 1,
        enabled: true,
      };

      expect(config.name).toBe('openai');
      expect(config.apiKey).toBe('test-api-key');
      expect(config.timeout).toBe(30000);
      expect(config.maxRetries).toBe(3);
      expect(config.models).toEqual(models);
      expect(config.priority).toBe(1);
      expect(config.enabled).toBe(true);
    });
  });

  describe('AIOperation', () => {
    it('should include all operation types', () => {
      const operations: AIOperation[] = [
        'prompt-improve',
        'prompt-generate',
        'content-summarize',
        'content-expand',
        'code-review',
        'translation',
        'analysis',
      ];

      expect(operations).toHaveLength(7);
      expect(operations).toContain('prompt-improve');
      expect(operations).toContain('prompt-generate');
      expect(operations).toContain('content-summarize');
      expect(operations).toContain('content-expand');
      expect(operations).toContain('code-review');
      expect(operations).toContain('translation');
      expect(operations).toContain('analysis');
    });
  });

  describe('ComplexityLevel', () => {
    it('should include all complexity levels', () => {
      const levels: ComplexityLevel[] = ['low', 'medium', 'high'];

      expect(levels).toHaveLength(3);
      expect(levels).toContain('low');
      expect(levels).toContain('medium');
      expect(levels).toContain('high');
    });
  });
});
