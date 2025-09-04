import {
  LLMProvider,
  LLMRequest,
  LLMResponse,
  TokenUsage,
  ProviderConfig,
  ProviderError,
} from './types';

export abstract class BaseLLMProvider implements LLMProvider {
  name: string;
  config: ProviderConfig;

  constructor(name: string, config: ProviderConfig) {
    this.name = name;
    this.config = config;
  }

  // Abstract methods that must be implemented by concrete providers
  abstract generate(request: LLMRequest): Promise<LLMResponse>;
  abstract formatPrompt(request: LLMRequest): any;
  abstract parseResponse(response: any): LLMResponse;
  abstract handleError(error: any): string;
  abstract isRetryableError(error: any): boolean;

  // Common utility methods
  estimateTokens(text: string): number {
    // Rough estimate: 1 token ≈ 4 characters for English text
    return Math.ceil(text.length / 4);
  }

  calculateCost(usage: TokenUsage): number {
    const { inputTokens, outputTokens } = usage;
    const model = this.getDefaultModel();

    if (!model) return 0;

    const inputCost = (inputTokens / 1000) * model.inputCostPer1K;
    const outputCost = (outputTokens / 1000) * model.outputCostPer1K;
    return Math.round((inputCost + outputCost) * 100) / 100; // Round to 2 decimal places
  }

  async healthCheck(): Promise<boolean> {
    try {
      const testRequest: LLMRequest = {
        systemPrompt: 'You are a helpful assistant.',
        userPrompt: 'Say "Hello"',
        maxTokens: 10,
        operation: 'health-check',
      };

      const response = await this.generate(testRequest);
      return (
        response.success && response.content.toLowerCase().includes('hello')
      );
    } catch (error) {
      console.error(`Health check failed for ${this.name}:`, error);
      return false;
    }
  }

  protected getDefaultModel() {
    return this.config.models.find(
      model =>
        model.name.includes('gpt-4o-mini') ||
        model.name.includes('claude-3-haiku')
    );
  }

  protected getModelByName(modelName: string) {
    return this.config.models.find(model => model.name === modelName);
  }

  protected async makeRequest(
    url: string,
    options: RequestInit
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  protected createTokenUsage(
    inputTokens: number,
    outputTokens: number,
    model: string
  ): TokenUsage {
    const totalTokens = inputTokens + outputTokens;
    const modelConfig = this.getModelByName(model);
    const costCents = modelConfig
      ? this.calculateCost({
          inputTokens,
          outputTokens,
          totalTokens,
          costCents: 0,
        })
      : 0;

    return {
      inputTokens,
      outputTokens,
      totalTokens,
      costCents,
    };
  }

  protected createResponse(
    content: string,
    usage: TokenUsage,
    model: string,
    responseTimeMs: number,
    success: boolean = true,
    error?: string
  ): LLMResponse {
    return {
      content,
      usage,
      provider: this.name,
      model,
      responseTimeMs,
      success,
      error,
    };
  }

  protected parseProviderError(error: any): ProviderError {
    const baseError: ProviderError = {
      provider: this.name,
      code: 'UNKNOWN_ERROR',
      message: error.message || 'Unknown error occurred',
      retryable: false,
    };

    // Handle rate limiting
    if (error.status === 429) {
      baseError.code = 'RATE_LIMIT';
      baseError.retryable = true;
      baseError.rateLimit = {
        resetTime: new Date(Date.now() + 60000), // Assume 1 minute
        limit: 0,
        remaining: 0,
      };
    }

    // Handle authentication errors
    if (error.status === 401) {
      baseError.code = 'AUTHENTICATION_ERROR';
      baseError.retryable = false;
    }

    // Handle server errors
    if (error.status >= 500) {
      baseError.code = 'SERVER_ERROR';
      baseError.retryable = true;
    }

    return baseError;
  }

  protected logRequest(request: LLMRequest, response: LLMResponse) {
    if (this.config.enabled) {
      console.log(`[${this.name}] Request:`, {
        operation: request.operation,
        model: request.model || this.getDefaultModel()?.name,
        inputTokens: response.usage.inputTokens,
        outputTokens: response.usage.outputTokens,
        costCents: response.usage.costCents,
        responseTimeMs: response.responseTimeMs,
        success: response.success,
      });
    }
  }
}
