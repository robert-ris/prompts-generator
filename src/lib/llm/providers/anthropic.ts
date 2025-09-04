import { BaseLLMProvider } from '../base-provider';
import { LLMRequest, LLMResponse, TokenUsage, ProviderConfig } from '../types';

export class AnthropicProvider extends BaseLLMProvider {
  constructor(config: ProviderConfig) {
    super('anthropic', config);
  }

  async generate(request: LLMRequest): Promise<LLMResponse> {
    const startTime = Date.now();

    try {
      const formattedRequest = this.formatPrompt(request);
      const model =
        request.model ||
        this.getDefaultModel()?.name ||
        'claude-3-haiku-20240307';

      const response = await this.makeRequest(
        'https://api.anthropic.com/v1/messages',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json',
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify(formattedRequest),
        }
      );

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(
          `Anthropic API error: ${response.status} - ${errorData}`
        );
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
        this.createTokenUsage(0, 0, request.model || 'claude-3-haiku-20240307'),
        request.model || 'claude-3-haiku-20240307',
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
      request.model ||
      this.getDefaultModel()?.name ||
      'claude-3-haiku-20240307';
    const maxTokens = request.maxTokens || 1000;
    const temperature = request.temperature ?? 0.7;

    // Anthropic uses a different format - combines system and user prompts
    const combinedPrompt = `${request.systemPrompt}\n\n${request.userPrompt}`;

    return {
      model,
      max_tokens: maxTokens,
      temperature,
      messages: [{ role: 'user', content: combinedPrompt }],
    };
  }

  parseResponse(response: any): LLMResponse {
    const content = response.content[0]?.text?.trim() || '';
    const model = response.model || 'claude-3-haiku-20240307';

    // Get actual token usage from response
    const inputTokens =
      response.usage?.input_tokens ||
      this.estimateTokens(response.content[0]?.text || '');
    const outputTokens =
      response.usage?.output_tokens || this.estimateTokens(content);

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

    if (error.message?.includes('Anthropic API error:')) {
      const statusMatch = error.message.match(/Anthropic API error: (\d+)/);
      if (statusMatch) {
        const status = parseInt(statusMatch[1]);

        switch (status) {
          case 401:
            return 'Invalid API key';
          case 429:
            return 'Rate limit exceeded';
          case 500:
            return 'Anthropic server error';
          case 503:
            return 'Anthropic service unavailable';
          default:
            return `Anthropic API error (${status})`;
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
        model.name === 'claude-3-haiku-20240307' ||
        model.name === 'claude-3-sonnet-20240229' ||
        model.name === 'claude-3-opus-20240229'
    );
  }
}
