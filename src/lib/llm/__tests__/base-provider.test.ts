import { BaseLLMProvider } from '../base-provider';
import {
  LLMRequest,
  LLMResponse,
  TokenUsage,
  ProviderConfig,
  ModelConfig,
} from '../types';

// Mock provider for testing
class MockProvider extends BaseLLMProvider {
  constructor(config: ProviderConfig) {
    super('mock', config);
  }

  async generate(request: LLMRequest): Promise<LLMResponse> {
    const startTime = Date.now();

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 100));

    const content = `Mock response to: ${request.userPrompt}`;
    const inputTokens = this.estimateTokens(
      request.systemPrompt + request.userPrompt
    );
    const outputTokens = this.estimateTokens(content);
    const usage = this.createTokenUsage(
      inputTokens,
      outputTokens,
      request.model || 'mock-model'
    );

    return this.createResponse(
      content,
      usage,
      request.model || 'mock-model',
      Date.now() - startTime,
      true
    );
  }

  formatPrompt(request: LLMRequest): any {
    return {
      system: request.systemPrompt,
      user: request.userPrompt,
      maxTokens: request.maxTokens || 1000,
      temperature: request.temperature ?? 0.7,
    };
  }

  parseResponse(response: any): LLMResponse {
    return {
      content: response.content || '',
      usage: {
        inputTokens: response.inputTokens || 0,
        outputTokens: response.outputTokens || 0,
        totalTokens: (response.inputTokens || 0) + (response.outputTokens || 0),
        costCents: response.costCents || 0,
      },
      provider: this.name,
      model: response.model || 'mock-model',
      responseTimeMs: response.responseTimeMs || 0,
      success: response.success !== false,
    };
  }

  handleError(error: any): string {
    return `Mock error: ${error.message || 'Unknown error'}`;
  }

  isRetryableError(error: any): boolean {
    return error.message?.includes('retryable') || false;
  }
}

describe('BaseLLMProvider', () => {
  let mockConfig: ProviderConfig;
  let provider: MockProvider;

  beforeEach(() => {
    const models: ModelConfig[] = [
      {
        name: 'mock-model',
        provider: 'mock',
        maxTokens: 4096,
        inputCostPer1K: 0.1,
        outputCostPer1K: 0.2,
        contextWindow: 8192,
        capabilities: ['low', 'medium'],
        recommendedFor: ['prompt-improve'],
      },
    ];

    mockConfig = {
      name: 'mock',
      apiKey: 'test-api-key',
      timeout: 30000,
      maxRetries: 3,
      models,
      priority: 1,
      enabled: true,
    };

    provider = new MockProvider(mockConfig);
  });

  describe('constructor', () => {
    it('should initialize with correct name and config', () => {
      expect(provider.name).toBe('mock');
      expect(provider.config).toEqual(mockConfig);
    });
  });

  describe('estimateTokens', () => {
    it('should estimate tokens correctly', () => {
      const text = 'Hello world, this is a test message.';
      const estimatedTokens = provider.estimateTokens(text);

      // Rough estimate: 1 token ≈ 4 characters
      const expectedTokens = Math.ceil(text.length / 4);
      expect(estimatedTokens).toBe(expectedTokens);
    });

    it('should handle empty string', () => {
      expect(provider.estimateTokens('')).toBe(0);
    });

    it('should handle long text', () => {
      const longText = 'A'.repeat(1000);
      const estimatedTokens = provider.estimateTokens(longText);
      expect(estimatedTokens).toBe(250); // 1000 / 4
    });
  });

  describe('calculateCost', () => {
    it('should calculate cost correctly', () => {
      const usage: TokenUsage = {
        inputTokens: 1000,
        outputTokens: 500,
        totalTokens: 1500,
        costCents: 0,
      };

      const cost = provider.calculateCost(usage);
      // Expected: (1000 * 0.1) + (500 * 0.2) = 100 + 100 = 200 cents = $2.00
      expect(cost).toBe(200);
    });

    it('should handle zero tokens', () => {
      const usage: TokenUsage = {
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        costCents: 0,
      };

      const cost = provider.calculateCost(usage);
      expect(cost).toBe(0);
    });

    it('should handle missing model', () => {
      const usage: TokenUsage = {
        inputTokens: 1000,
        outputTokens: 500,
        totalTokens: 1500,
        costCents: 0,
      };

      // Mock getDefaultModel to return undefined
      jest.spyOn(provider as any, 'getDefaultModel').mockReturnValue(undefined);

      const cost = provider.calculateCost(usage);
      expect(cost).toBe(0);
    });
  });

  describe('healthCheck', () => {
    it('should return true for successful health check', async () => {
      const isHealthy = await provider.healthCheck();
      expect(isHealthy).toBe(true);
    });

    it('should return false for failed health check', async () => {
      // Mock generate to throw an error
      jest
        .spyOn(provider, 'generate')
        .mockRejectedValue(new Error('Health check failed'));

      const isHealthy = await provider.healthCheck();
      expect(isHealthy).toBe(false);
    });
  });

  describe('createTokenUsage', () => {
    it('should create token usage correctly', () => {
      const inputTokens = 100;
      const outputTokens = 50;
      const model = 'mock-model';

      const usage = (provider as any).createTokenUsage(
        inputTokens,
        outputTokens,
        model
      );

      expect(usage.inputTokens).toBe(inputTokens);
      expect(usage.outputTokens).toBe(outputTokens);
      expect(usage.totalTokens).toBe(inputTokens + outputTokens);
      expect(usage.costCents).toBeGreaterThan(0);
    });
  });

  describe('createResponse', () => {
    it('should create successful response', () => {
      const content = 'Test response';
      const usage: TokenUsage = {
        inputTokens: 100,
        outputTokens: 50,
        totalTokens: 150,
        costCents: 25,
      };
      const model = 'mock-model';
      const responseTimeMs = 1000;

      const response = (provider as any).createResponse(
        content,
        usage,
        model,
        responseTimeMs,
        true
      );

      expect(response.content).toBe(content);
      expect(response.usage).toEqual(usage);
      expect(response.provider).toBe('mock');
      expect(response.model).toBe(model);
      expect(response.responseTimeMs).toBe(responseTimeMs);
      expect(response.success).toBe(true);
      expect(response.error).toBeUndefined();
    });

    it('should create error response', () => {
      const content = '';
      const usage: TokenUsage = {
        inputTokens: 100,
        outputTokens: 0,
        totalTokens: 100,
        costCents: 0,
      };
      const model = 'mock-model';
      const responseTimeMs = 500;
      const error = 'Test error';

      const response = (provider as any).createResponse(
        content,
        usage,
        model,
        responseTimeMs,
        false,
        error
      );

      expect(response.content).toBe(content);
      expect(response.usage).toEqual(usage);
      expect(response.provider).toBe('mock');
      expect(response.model).toBe(model);
      expect(response.responseTimeMs).toBe(responseTimeMs);
      expect(response.success).toBe(false);
      expect(response.error).toBe(error);
    });
  });

  describe('parseProviderError', () => {
    it('should parse rate limit error', () => {
      const error = { status: 429, message: 'Rate limit exceeded' };
      const parsedError = (provider as any).parseProviderError(error);

      expect(parsedError.code).toBe('RATE_LIMIT');
      expect(parsedError.retryable).toBe(true);
      expect(parsedError.rateLimit).toBeDefined();
    });

    it('should parse authentication error', () => {
      const error = { status: 401, message: 'Invalid API key' };
      const parsedError = (provider as any).parseProviderError(error);

      expect(parsedError.code).toBe('AUTHENTICATION_ERROR');
      expect(parsedError.retryable).toBe(false);
    });

    it('should parse server error', () => {
      const error = { status: 500, message: 'Internal server error' };
      const parsedError = (provider as any).parseProviderError(error);

      expect(parsedError.code).toBe('SERVER_ERROR');
      expect(parsedError.retryable).toBe(true);
    });

    it('should parse unknown error', () => {
      const error = { message: 'Unknown error' };
      const parsedError = (provider as any).parseProviderError(error);

      expect(parsedError.code).toBe('UNKNOWN_ERROR');
      expect(parsedError.retryable).toBe(false);
    });
  });

  describe('makeRequest', () => {
    beforeEach(() => {
      global.fetch = jest.fn();
    });

    it('should make successful request', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ data: 'test' }),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const response = await (provider as any).makeRequest(
        'https://api.test.com',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ test: 'data' }),
        }
      );

      expect(response).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.test.com',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ test: 'data' }),
        })
      );
    });

    it('should handle timeout', async () => {
      // Mock a slow response
      (global.fetch as jest.Mock).mockImplementation(
        () =>
          new Promise(resolve => setTimeout(() => resolve({ ok: true }), 1000))
      );

      // Set a short timeout
      provider.config.timeout = 100;

      await expect(
        (provider as any).makeRequest('https://api.test.com', { method: 'GET' })
      ).rejects.toThrow();
    });
  });

  describe('getDefaultModel', () => {
    it('should return default model', () => {
      const model = (provider as any).getDefaultModel();
      expect(model).toBeDefined();
      expect(model.name).toBe('mock-model');
    });
  });

  describe('getModelByName', () => {
    it('should return model by name', () => {
      const model = (provider as any).getModelByName('mock-model');
      expect(model).toBeDefined();
      expect(model.name).toBe('mock-model');
    });

    it('should return undefined for non-existent model', () => {
      const model = (provider as any).getModelByName('non-existent-model');
      expect(model).toBeUndefined();
    });
  });
});
