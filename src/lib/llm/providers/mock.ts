import { BaseLLMProvider } from '../base-provider';
import { LLMRequest, LLMResponse, ProviderConfig } from '../types';
import { MockDataGenerator } from '../mock-generator';

export class MockProvider extends BaseLLMProvider {
  private mockGenerator: MockDataGenerator;

  constructor(config: ProviderConfig) {
    super('mock', config);
    this.mockGenerator = MockDataGenerator.getInstance();
  }

  async generate(request: LLMRequest): Promise<LLMResponse> {
    const startTime = Date.now();

    try {
      // Simulate network delay
      await new Promise(resolve =>
        setTimeout(resolve, Math.random() * 1000 + 200)
      );

      // Generate mock content based on the operation
      let content = '';
      const model =
        request.model || this.getDefaultModel()?.name || 'gpt-4o-mini';

      if (request.operation === 'prompt-improve') {
        // Extract mode from system prompt
        const mode = this.extractModeFromSystemPrompt(request.systemPrompt);
        content = this.mockGenerator.generateImprovedPrompt(
          request.userPrompt,
          mode
        );
      } else {
        // Generic mock response
        content = this.generateGenericMockResponse(request);
      }

      const response = this.mockGenerator.generateMockResponse(content, model);
      response.responseTimeMs = Date.now() - startTime;

      // Log the request
      this.logRequest(request, response);

      return response;
    } catch (error) {
      const errorResponse = this.mockGenerator.generateMockError(
        error instanceof Error ? error.message : 'Mock error occurred',
        request.model || this.getDefaultModel()?.name || 'gpt-4o-mini'
      );
      errorResponse.responseTimeMs = Date.now() - startTime;

      this.logRequest(request, errorResponse);
      throw error;
    }
  }

  formatPrompt(request: LLMRequest): LLMRequest {
    // Mock providers don't need to format prompts
    return request;
  }

  parseResponse(response: LLMResponse): LLMResponse {
    // Mock providers don't need to parse responses
    return response;
  }

  handleError(error: Error | unknown): string {
    return error instanceof Error ? error.message : 'Mock error occurred';
  }

  isRetryableError(error: Error | unknown): boolean {
    // Mock errors are generally not retryable
    return false;
  }

  private extractModeFromSystemPrompt(
    systemPrompt: string
  ): 'tighten' | 'expand' {
    if (
      systemPrompt.toLowerCase().includes('tighten') ||
      systemPrompt.toLowerCase().includes('concise')
    ) {
      return 'tighten';
    }
    return 'expand';
  }

  private generateGenericMockResponse(request: LLMRequest): string {
    const responses = [
      'This is a mock response for development purposes.',
      'Mock data generated for testing.',
      'Development mode: This would be the actual AI response.',
      'Test response - no actual AI processing performed.',
      'Mock content generated based on your request.',
    ];

    const randomResponse =
      responses[Math.floor(Math.random() * responses.length)];
    return `${randomResponse}\n\nOriginal request: ${request.userPrompt}`;
  }

  async healthCheck(): Promise<boolean> {
    // Mock provider is always healthy
    return true;
  }
}
