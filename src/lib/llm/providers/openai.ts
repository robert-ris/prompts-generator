import { BaseLLMProvider } from '../base-provider';
import { LLMRequest, LLMResponse, ProviderConfig } from '../types';

export class OpenAIProvider extends BaseLLMProvider {
  constructor(config: ProviderConfig) {
    super('openai', config);
  }

  async generate(request: LLMRequest): Promise<LLMResponse> {
    const startTime = Date.now();

    try {
      const formattedRequest = this.formatPrompt(request);
      const model =
        request.model || this.getDefaultModel()?.name || 'gpt-4o-mini';

      const response = await this.makeRequest(
        'https://api.openai.com/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formattedRequest),
        }
      );

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`OpenAI API error: ${response.status} - ${errorData}`);
      }

      const data = await response.json();
      const result = this.parseResponse(data);

      // Log the request
      this.logRequest(request, result);

      return result;
    } catch (error) {
      const errorMessage = this.handleError(error);
      const errorResponse = this.createResponse(
        '',
        this.createTokenUsage(0, 0, request.model || 'gpt-4o-mini'),
        request.model || 'gpt-4o-mini',
        Date.now() - startTime,
        false,
        errorMessage
      );

      this.logRequest(request, errorResponse);
      throw error;
    }
  }

  formatPrompt(request: LLMRequest): any {
    const model =
      request.model || this.getDefaultModel()?.name || 'gpt-4o-mini';
    const maxTokens = request.maxTokens || 1000;
    const temperature = request.temperature ?? 0.7;

    return {
      model,
      messages: [
        { role: 'system', content: request.systemPrompt },
        { role: 'user', content: request.userPrompt },
      ],
      max_tokens: maxTokens,
      temperature,
      stream: false,
    };
  }

  parseResponse(response: any): LLMResponse {
    const content = response.choices[0]?.message?.content?.trim() || '';
    const model = response.model || 'gpt-4o-mini';

    // Get actual token usage from response
    const inputTokens =
      response.usage?.prompt_tokens ||
      this.estimateTokens(response.choices[0]?.message?.content || '');
    const outputTokens =
      response.usage?.completion_tokens || this.estimateTokens(content);

    const usage = this.createTokenUsage(inputTokens, outputTokens, model);

    return this.createResponse(
      content,
      usage,
      model,
      0, // Will be set by the calling method
      true
    );
  }

  handleError(error: any): string {
    if (error.name === 'AbortError') {
      return 'Request timeout';
    }

    if (error.message?.includes('OpenAI API error:')) {
      const statusMatch = error.message.match(/OpenAI API error: (\d+)/);
      if (statusMatch) {
        const status = parseInt(statusMatch[1]);

        switch (status) {
          case 401:
            return 'Invalid API key';
          case 429:
            return 'Rate limit exceeded';
          case 500:
            return 'OpenAI server error';
          case 503:
            return 'OpenAI service unavailable';
          default:
            return `OpenAI API error (${status})`;
        }
      }
    }

    return error.message || 'Unknown error occurred';
  }

  isRetryableError(error: any): boolean {
    const errorMessage = error.message || '';

    // Retry on rate limits, server errors, and timeouts
    return (
      errorMessage.includes('Rate limit') ||
      errorMessage.includes('server error') ||
      errorMessage.includes('timeout') ||
      errorMessage.includes('service unavailable') ||
      error.name === 'AbortError'
    );
  }

  protected getDefaultModel() {
    return this.config.models.find(
      model =>
        model.name === 'gpt-4o-mini' ||
        model.name === 'gpt-4o' ||
        model.name === 'gpt-3.5-turbo'
    );
  }
}
