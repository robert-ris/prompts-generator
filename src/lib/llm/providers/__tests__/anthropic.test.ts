import { AnthropicProvider } from '../providers/anthropic';
import { LLMRequest, LLMResponse, ProviderConfig, ModelConfig } from '../types';

// Mock fetch globally
global.fetch = jest.fn();

describe('AnthropicProvider', () => {
  let provider: AnthropicProvider;
  let mockConfig: ProviderConfig;

  beforeEach(() => {
    const models: ModelConfig[] = [
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
      {
        name: 'claude-3-sonnet-20240229',
        provider: 'anthropic',
        maxTokens: 4096,
        inputCostPer1K: 3,
        outputCostPer1K: 15,
        contextWindow: 200000,
        capabilities: ['medium', 'high'],
        recommendedFor: ['code-review', 'analysis'],
      },
    ];

    mockConfig = {
      name: 'anthropic',
      apiKey: 'test-anthropic-key',
      timeout: 30000,
      maxRetries: 3,
      models,
      priority: 2,
      enabled: true,
    };

    provider = new AnthropicProvider(mockConfig);
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with correct name', () => {
      expect(provider.name).toBe('anthropic');
      expect(provider.config).toEqual(mockConfig);
    });
  });

  describe('generate', () => {
    const mockRequest: LLMRequest = {
      systemPrompt: 'You are a helpful assistant.',
      userPrompt: 'Hello, how are you?',
      maxTokens: 100,
      temperature: 0.7,
      model: 'claude-3-haiku-20240307',
      operation: 'prompt-improve',
    };

    it('should generate successful response', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          content: [{ text: 'Hello! I am doing well, thank you for asking.' }],
          usage: {
            input_tokens: 20,
            output_tokens: 15,
          },
          model: 'claude-3-haiku-20240307',
        }),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const response = await provider.generate(mockRequest);

      expect(response.success).toBe(true);
      expect(response.content).toBe(
        'Hello! I am doing well, thank you for asking.'
      );
      expect(response.provider).toBe('anthropic');
      expect(response.model).toBe('claude-3-haiku-20240307');
      expect(response.usage.inputTokens).toBe(20);
      expect(response.usage.outputTokens).toBe(15);
      expect(response.usage.totalTokens).toBe(35);
      expect(response.responseTimeMs).toBeGreaterThan(0);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.anthropic.com/v1/messages',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'x-api-key': 'test-anthropic-key',
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json',
          },
          body: expect.stringContaining('claude-3-haiku-20240307'),
        })
      );
    });

    it('should handle API errors', async () => {
      const mockResponse = {
        ok: false,
        status: 429,
        text: jest.fn().mockResolvedValue('Rate limit exceeded'),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      await expect(provider.generate(mockRequest)).rejects.toThrow(
        'Anthropic API error: 429 - Rate limit exceeded'
      );
    });

    it('should handle network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(provider.generate(mockRequest)).rejects.toThrow(
        'Network error'
      );
    });

    it('should handle empty response', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          content: [{ text: '' }],
          usage: { input_tokens: 20, output_tokens: 0 },
          model: 'claude-3-haiku-20240307',
        }),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const response = await provider.generate(mockRequest);

      expect(response.success).toBe(true);
      expect(response.content).toBe('');
    });

    it('should use default model when none specified', async () => {
      const requestWithoutModel: LLMRequest = {
        systemPrompt: 'You are a helpful assistant.',
        userPrompt: 'Hello',
        maxTokens: 100,
      };

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          content: [{ text: 'Hello!' }],
          usage: { input_tokens: 10, output_tokens: 5 },
          model: 'claude-3-haiku-20240307',
        }),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      await provider.generate(requestWithoutModel);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.anthropic.com/v1/messages',
        expect.objectContaining({
          body: expect.stringContaining('claude-3-haiku-20240307'),
        })
      );
    });
  });

  describe('formatPrompt', () => {
    it('should format prompt correctly', () => {
      const request: LLMRequest = {
        systemPrompt: 'You are a helpful assistant.',
        userPrompt: 'Hello, how are you?',
        maxTokens: 100,
        temperature: 0.7,
        model: 'claude-3-haiku-20240307',
      };

      const formatted = provider.formatPrompt(request);

      expect(formatted).toEqual({
        model: 'claude-3-haiku-20240307',
        max_tokens: 100,
        temperature: 0.7,
        system: 'You are a helpful assistant.',
        messages: [{ role: 'user', content: 'Hello, how are you?' }],
      });
    });

    it('should use default values when not specified', () => {
      const request: LLMRequest = {
        systemPrompt: 'You are a helpful assistant.',
        userPrompt: 'Hello',
      };

      const formatted = provider.formatPrompt(request);

      expect(formatted.max_tokens).toBe(1000);
      expect(formatted.temperature).toBe(0.7);
      expect(formatted.model).toBe('claude-3-haiku-20240307');
    });

    it('should handle request without system prompt', () => {
      const request: LLMRequest = {
        userPrompt: 'Hello, how are you?',
        maxTokens: 100,
        temperature: 0.7,
        model: 'claude-3-haiku-20240307',
      };

      const formatted = provider.formatPrompt(request);

      expect(formatted.system).toBeUndefined();
      expect(formatted.messages).toEqual([
        { role: 'user', content: 'Hello, how are you?' },
      ]);
    });
  });

  describe('parseResponse', () => {
    it('should parse successful response', () => {
      const mockApiResponse = {
        content: [{ text: 'Hello! How can I help you?' }],
        usage: {
          input_tokens: 20,
          output_tokens: 15,
        },
        model: 'claude-3-haiku-20240307',
      };

      const response = provider.parseResponse(mockApiResponse);

      expect(response.content).toBe('Hello! How can I help you?');
      expect(response.provider).toBe('anthropic');
      expect(response.model).toBe('claude-3-haiku-20240307');
      expect(response.usage.inputTokens).toBe(20);
      expect(response.usage.outputTokens).toBe(15);
      expect(response.usage.totalTokens).toBe(35);
      expect(response.success).toBe(true);
    });

    it('should handle missing usage data', () => {
      const mockApiResponse = {
        content: [{ text: 'Hello!' }],
        model: 'claude-3-haiku-20240307',
      };

      const response = provider.parseResponse(mockApiResponse);

      expect(response.content).toBe('Hello!');
      expect(response.usage.inputTokens).toBeGreaterThan(0); // Estimated
      expect(response.usage.outputTokens).toBeGreaterThan(0); // Estimated
    });

    it('should handle empty content', () => {
      const mockApiResponse = {
        content: [{ text: '' }],
        usage: { input_tokens: 10, output_tokens: 0 },
        model: 'claude-3-haiku-20240307',
      };

      const response = provider.parseResponse(mockApiResponse);

      expect(response.content).toBe('');
      expect(response.usage.outputTokens).toBe(0);
    });

    it('should handle multiple content blocks', () => {
      const mockApiResponse = {
        content: [{ text: 'Hello! ' }, { text: 'How can I help you?' }],
        usage: { input_tokens: 10, output_tokens: 10 },
        model: 'claude-3-haiku-20240307',
      };

      const response = provider.parseResponse(mockApiResponse);

      expect(response.content).toBe('Hello! How can I help you?');
    });
  });

  describe('handleError', () => {
    it('should handle timeout errors', () => {
      const error = { name: 'AbortError' };
      const message = provider.handleError(error);
      expect(message).toBe('Request timeout');
    });

    it('should handle rate limit errors', () => {
      const error = {
        message: 'Anthropic API error: 429 - Rate limit exceeded',
      };
      const message = provider.handleError(error);
      expect(message).toBe('Rate limit exceeded');
    });

    it('should handle authentication errors', () => {
      const error = { message: 'Anthropic API error: 401 - Invalid API key' };
      const message = provider.handleError(error);
      expect(message).toBe('Invalid API key');
    });

    it('should handle server errors', () => {
      const error = {
        message: 'Anthropic API error: 500 - Internal server error',
      };
      const message = provider.handleError(error);
      expect(message).toBe('Anthropic server error');
    });

    it('should handle service unavailable errors', () => {
      const error = {
        message: 'Anthropic API error: 503 - Service unavailable',
      };
      const message = provider.handleError(error);
      expect(message).toBe('Anthropic service unavailable');
    });

    it('should handle unknown errors', () => {
      const error = { message: 'Anthropic API error: 999 - Unknown error' };
      const message = provider.handleError(error);
      expect(message).toBe('Anthropic API error (999)');
    });

    it('should handle generic errors', () => {
      const error = { message: 'Some other error' };
      const message = provider.handleError(error);
      expect(message).toBe('Some other error');
    });
  });

  describe('isRetryableError', () => {
    it('should identify retryable errors', () => {
      const retryableErrors = [
        { message: 'Rate limit exceeded' },
        { message: 'Anthropic server error' },
        { message: 'Request timeout' },
        { message: 'Anthropic service unavailable' },
        { name: 'AbortError' },
      ];

      retryableErrors.forEach(error => {
        expect(provider.isRetryableError(error)).toBe(true);
      });
    });

    it('should identify non-retryable errors', () => {
      const nonRetryableErrors = [
        { message: 'Invalid API key' },
        { message: 'Some other error' },
      ];

      nonRetryableErrors.forEach(error => {
        expect(provider.isRetryableError(error)).toBe(false);
      });
    });
  });

  describe('getDefaultModel', () => {
    it('should return claude-3-haiku-20240307 as default', () => {
      const model = (provider as any).getDefaultModel();
      expect(model.name).toBe('claude-3-haiku-20240307');
    });

    it('should return claude-3-sonnet-20240229 if haiku not available', () => {
      // Mock config without haiku
      const configWithoutHaiku = {
        ...mockConfig,
        models: mockConfig.models.filter(
          m => m.name !== 'claude-3-haiku-20240307'
        ),
      };
      const providerWithoutHaiku = new AnthropicProvider(configWithoutHaiku);

      const model = (providerWithoutHaiku as any).getDefaultModel();
      expect(model.name).toBe('claude-3-sonnet-20240229');
    });

    it('should return claude-3-opus-20240229 as fallback', () => {
      // Mock config with only opus
      const configWithOpus = {
        ...mockConfig,
        models: [
          {
            name: 'claude-3-opus-20240229',
            provider: 'anthropic',
            maxTokens: 4096,
            inputCostPer1K: 15,
            outputCostPer1K: 75,
            contextWindow: 200000,
            capabilities: ['high'],
            recommendedFor: ['analysis'],
          },
        ],
      };
      const providerWithOpus = new AnthropicProvider(configWithOpus);

      const model = (providerWithOpus as any).getDefaultModel();
      expect(model.name).toBe('claude-3-opus-20240229');
    });
  });
});
