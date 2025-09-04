import { LLMResponse, TokenUsage } from './types';

/**
 * Mock data generator for development/testing when SKIP_AI_REQUEST=true
 */
export class MockDataGenerator {
  private static instance: MockDataGenerator;
  private requestCount = 0;

  static getInstance(): MockDataGenerator {
    if (!MockDataGenerator.instance) {
      MockDataGenerator.instance = new MockDataGenerator();
    }
    return MockDataGenerator.instance;
  }

  /**
   * Generate mock improved prompt based on mode and original prompt
   */
  generateImprovedPrompt(
    originalPrompt: string,
    mode: 'tighten' | 'expand'
  ): string {
    this.requestCount++;

    if (mode === 'tighten') {
      return this.generateTightenedPrompt(originalPrompt);
    } else {
      return this.generateExpandedPrompt(originalPrompt);
    }
  }

  /**
   * Generate mock tightened prompt
   */
  private generateTightenedPrompt(originalPrompt: string): string {
    const words = originalPrompt.split(' ');

    // Remove common filler words
    const fillerWords = [
      'very',
      'really',
      'quite',
      'rather',
      'somewhat',
      'kind of',
      'sort of',
      'basically',
      'actually',
      'literally',
    ];
    const filteredWords = words.filter(
      word => !fillerWords.includes(word.toLowerCase())
    );

    // Remove redundant phrases
    let result = filteredWords.join(' ');
    result = result.replace(
      /\b(please|kindly|if you could|would you mind)\b/gi,
      ''
    );
    result = result.replace(/\b(I would like|I want|I need)\b/gi, '');
    result = result.replace(/\b(can you|could you)\b/gi, '');
    result = result.replace(/\b(thank you|thanks)\b/gi, '');

    // Make it more direct
    result = result.replace(
      /\b(write|create|generate|produce)\s+(a|an)\s+/gi,
      ''
    );
    result = result.replace(/\b(that is|which is|who is)\b/gi, '');

    // Ensure it's not too short
    if (result.split(' ').length < 3) {
      result = originalPrompt; // Fallback to original if too aggressive
    }

    return result.trim() || originalPrompt;
  }

  /**
   * Generate mock expanded prompt
   */
  private generateExpandedPrompt(originalPrompt: string): string {
    const expansions = [
      'Provide detailed and comprehensive information.',
      'Include specific examples and practical applications.',
      'Consider different perspectives and approaches.',
      'Ensure the response is well-structured and easy to understand.',
      'Focus on actionable insights and practical recommendations.',
      'Address potential challenges and provide solutions.',
      'Include relevant context and background information.',
      'Make sure to cover all important aspects thoroughly.',
    ];

    const randomExpansions = this.shuffleArray(expansions).slice(0, 2);
    return `${originalPrompt}\n\n${randomExpansions.join(' ')}`;
  }

  /**
   * Generate mock LLM response with realistic token usage
   */
  generateMockResponse(
    content: string,
    model: string = 'gpt-4o-mini'
  ): LLMResponse {
    const inputTokens = Math.floor(content.length / 4); // Rough estimate
    const outputTokens = Math.floor(content.length / 3); // Rough estimate

    return {
      content,
      usage: {
        inputTokens,
        outputTokens,
        totalTokens: inputTokens + outputTokens,
        costCents: this.calculateMockCost(inputTokens, outputTokens, model),
      },
      provider: 'mock',
      model,
      responseTimeMs: Math.floor(Math.random() * 2000) + 500, // 500-2500ms
      success: true,
      error: undefined,
    };
  }

  /**
   * Calculate mock cost based on token usage and model
   */
  private calculateMockCost(
    inputTokens: number,
    outputTokens: number,
    model: string
  ): number {
    const rates = {
      'gpt-4o-mini': { input: 0.15, output: 0.6 },
      'gpt-4o': { input: 2.5, output: 10 },
      'gpt-3.5-turbo': { input: 0.5, output: 1.5 },
      'claude-3-haiku-20240307': { input: 0.25, output: 1.25 },
      'claude-3-sonnet-20240229': { input: 3, output: 15 },
      'claude-3-opus-20240229': { input: 15, output: 75 },
    };

    const rate = rates[model as keyof typeof rates] || rates['gpt-4o-mini'];
    const inputCost = (inputTokens / 1000) * rate.input;
    const outputCost = (outputTokens / 1000) * rate.output;

    return Math.round((inputCost + outputCost) * 100); // Convert to cents
  }

  /**
   * Generate mock error response
   */
  generateMockError(
    errorMessage: string,
    model: string = 'gpt-4o-mini'
  ): LLMResponse {
    return {
      content: '',
      usage: {
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        costCents: 0,
      },
      provider: 'mock',
      model,
      responseTimeMs: Math.floor(Math.random() * 1000) + 100,
      success: false,
      error: errorMessage,
    };
  }

  /**
   * Get mock provider stats
   */
  getMockStats() {
    return {
      totalRequests: this.requestCount,
      successRate: 0.95,
      averageResponseTime: 1500,
      lastUsed: new Date().toISOString(),
    };
  }

  /**
   * Utility function to shuffle array
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}
