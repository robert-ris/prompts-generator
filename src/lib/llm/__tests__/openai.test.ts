import { OpenAIProvider } from '../providers/openai';
import { LLMRequest, LLMResponse, ProviderConfig, ModelConfig } from '../types';

// Mock fetch globally
global.fetch = jest.fn();

describe('OpenAIProvider', () => {
  let provider: OpenAIProvider;
  let mockConfig: ProviderConfig;

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
        name: 'gpt-4o',
        provider: 'openai',
        maxTokens: 4096,
        inputCostPer1K: 2.5,
        outputCostPer1K: 10,
        contextWindow: 128000,
        capabilities: ['medium', 'high'],
        recommendedFor: ['code-review', 'analysis'],
      },
    ];

    mockConfig = {
      name: 'openai',
      apiKey: 'test-openai-key',
      timeout: 30000,
      maxRetries: 3,
      models,
      priority: 1,
      enabled: true,
    };

    provider = new OpenAIProvider(mockConfig);
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with correct name', () => {
      expect(provider.name).toBe('openai');
      expect(provider.config).toEqual(mockConfig);
    });
  });

  describe('generate', () => {
    const mockRequest: LLMRequest = {
      systemPrompt: 'You are a helpful assistant.',
      userPrompt: 'Hello, how are you?',
      maxTokens: 100,
      temperature: 0.7,
      model: 'gpt-4o-mini',
      operation: 'prompt-improve',
    };

    it('should generate successful response', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          choices: [
            {
              message: {
                content: 'Hello! I am doing well, thank you for asking.',
              },
            },
          ],
          usage: {
            prompt_tokens: 20,
            completion_tokens: 15,
            total_tokens: 35,
          },
          model: 'gpt-4o-mini',
        }),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const response = await provider.generate(mockRequest);

      expect(response.success).toBe(true);
      expect(response.content).toBe(
        'Hello! I am doing well, thank you for asking.'
      );
      expect(response.provider).toBe('openai');
      expect(response.model).toBe('gpt-4o-mini');
      expect(response.usage.inputTokens).toBe(20);
      expect(response.usage.outputTokens).toBe(15);
      expect(response.usage.totalTokens).toBe(35);
      expect(response.responseTimeMs).toBeGreaterThan(0);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: {
            Authorization: 'Bearer test-openai-key',
            'Content-Type': 'application/json',
          },
          body: expect.stringContaining('gpt-4o-mini'),
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
        'OpenAI API error: 429 - Rate limit exceeded'
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
          choices: [{ message: { content: '' } }],
          usage: { prompt_tokens: 20, completion_tokens: 0, total_tokens: 20 },
          model: 'gpt-4o-mini',
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
          choices: [{ message: { content: 'Hello!' } }],
          usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
          model: 'gpt-4o-mini',
        }),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      await provider.generate(requestWithoutModel);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.objectContaining({
          body: expect.stringContaining('gpt-4o-mini'),
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
        model: 'gpt-4o-mini',
      };

      const formatted = provider.formatPrompt(request);

      expect(formatted).toEqual({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: 'Hello, how are you?' },
        ],
        max_tokens: 100,
        temperature: 0.7,
        stream: false,
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
      expect(formatted.model).toBe('gpt-4o-mini');
    });
  });

  describe('parseResponse', () => {
    it('should parse successful response', () => {
      const mockApiResponse = {
        choices: [{ message: { content: 'Hello! How can I help you?' } }],
        usage: {
          prompt_tokens: 20,
          completion_tokens: 15,
          total_tokens: 35,
        },
        model: 'gpt-4o-mini',
      };

      const response = provider.parseResponse(mockApiResponse);

      expect(response.content).toBe('Hello! How can I help you?');
      expect(response.provider).toBe('openai');
      expect(response.model).toBe('gpt-4o-mini');
      expect(response.usage.inputTokens).toBe(20);
      expect(response.usage.outputTokens).toBe(15);
      expect(response.usage.totalTokens).toBe(35);
      expect(response.success).toBe(true);
    });

    it('should handle missing usage data', () => {
      const mockApiResponse = {
        choices: [{ message: { content: 'Hello!' } }],
        model: 'gpt-4o-mini',
      };

      const response = provider.parseResponse(mockApiResponse);

      expect(response.content).toBe('Hello!');
      expect(response.usage.inputTokens).toBeGreaterThan(0); // Estimated
      expect(response.usage.outputTokens).toBeGreaterThan(0); // Estimated
    });

    it('should handle empty content', () => {
      const mockApiResponse = {
        choices: [{ message: { content: '' } }],
        usage: { prompt_tokens: 10, completion_tokens: 0, total_tokens: 10 },
        model: 'gpt-4o-mini',
      };

      const response = provider.parseResponse(mockApiResponse);

      expect(response.content).toBe('');
      expect(response.usage.outputTokens).toBe(0);
    });
  });

  describe('handleError', () => {
    it('should handle timeout errors', () => {
      const error = { name: 'AbortError' };
      const message = provider.handleError(error);
      expect(message).toBe('Request timeout');
    });

    it('should handle rate limit errors', () => {
      const error = { message: 'OpenAI API error: 429 - Rate limit exceeded' };
      const message = provider.handleError(error);
      expect(message).toBe('Rate limit exceeded');
    });

    it('should handle authentication errors', () => {
      const error = { message: 'OpenAI API error: 401 - Invalid API key' };
      const message = provider.handleError(error);
      expect(message).toBe('Invalid API key');
    });

    it('should handle server errors', () => {
      const error = {
        message: 'OpenAI API error: 500 - Internal server error',
      };
      const message = provider.handleError(error);
      expect(message).toBe('OpenAI server error');
    });

    it('should handle service unavailable errors', () => {
      const error = { message: 'OpenAI API error: 503 - Service unavailable' };
      const message = provider.handleError(error);
      expect(message).toBe('OpenAI service unavailable');
    });

    it('should handle unknown errors', () => {
      const error = { message: 'OpenAI API error: 999 - Unknown error' };
      const message = provider.handleError(error);
      expect(message).toBe('OpenAI API error (999)');
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
        { message: 'OpenAI server error' },
        { message: 'Request timeout' },
        { message: 'OpenAI service unavailable' },
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
    it('should return gpt-4o-mini as default', () => {
      const model = (provider as any).getDefaultModel();
      expect(model.name).toBe('gpt-4o-mini');
    });

    it('should return gpt-4o if gpt-4o-mini not available', () => {
      // Mock config without gpt-4o-mini
      const configWithoutMini = {
        ...mockConfig,
        models: mockConfig.models.filter(m => m.name !== 'gpt-4o-mini'),
      };
      const providerWithoutMini = new OpenAIProvider(configWithoutMini);

      const model = (providerWithoutMini as any).getDefaultModel();
      expect(model.name).toBe('gpt-4o');
    });

    it('should return gpt-3.5-turbo as fallback', () => {
      // Mock config with only gpt-3.5-turbo
      const configWithTurbo = {
        ...mockConfig,
        models: [
          {
            name: 'gpt-3.5-turbo',
            provider: 'openai',
            maxTokens: 4096,
            inputCostPer1K: 0.5,
            outputCostPer1K: 1.5,
            contextWindow: 16385,
            capabilities: ['low', 'medium'],
            recommendedFor: ['prompt-improve'],
          },
        ],
      };
      const providerWithTurbo = new OpenAIProvider(configWithTurbo);

      const model = (providerWithTurbo as any).getDefaultModel();
      expect(model.name).toBe('gpt-3.5-turbo');
    });
  });
});
