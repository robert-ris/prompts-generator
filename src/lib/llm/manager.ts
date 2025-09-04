import {
  LLMManager,
  LLMRequest,
  LLMResponse,
  LLMProvider,
  ProviderHealthStatus,
  ProviderStats,
  AIOperation,
  ComplexityLevel,
  LLMConfig,
} from './types';

export class LLMProviderManager implements LLMManager {
  private providers: Map<string, LLMProvider> = new Map();
  private stats: Map<string, ProviderStats> = new Map();
  private healthStatus: Map<string, ProviderHealthStatus> = new Map();
  private config: LLMConfig;
  private currentProviderIndex: number = 0;

  constructor(config: LLMConfig) {
    this.config = config;
    this.initializeStats();
  }

  addProvider(provider: LLMProvider): void {
    this.providers.set(provider.name, provider);
    this.stats.set(provider.name, {
      provider: provider.name,
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      totalCostCents: 0,
      lastUsed: new Date(),
    });
  }

  removeProvider(name: string): void {
    this.providers.delete(name);
    this.stats.delete(name);
    this.healthStatus.delete(name);
  }

  getProvider(name: string): LLMProvider | undefined {
    return this.providers.get(name);
  }

  listProviders(): LLMProvider[] {
    return Array.from(this.providers.values());
  }

  async generate(request: LLMRequest): Promise<LLMResponse> {
    const provider = this.selectProvider(request);
    if (!provider) {
      throw new Error('No available LLM providers');
    }

    try {
      const response = await provider.generate(request);
      this.updateStats(provider.name, response, true);
      return response;
    } catch (error) {
      this.updateStats(
        provider.name,
        {
          content: '',
          usage: {
            inputTokens: 0,
            outputTokens: 0,
            totalTokens: 0,
            costCents: 0,
          },
          provider: provider.name,
          model: request.model || 'unknown',
          responseTimeMs: 0,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        false
      );
      throw error;
    }
  }

  async generateWithFallback(request: LLMRequest): Promise<LLMResponse> {
    const providers = this.getAvailableProviders();

    for (const provider of providers) {
      try {
        const response = await provider.generate(request);
        this.updateStats(provider.name, response, true);
        return response;
      } catch (error) {
        console.warn(`Provider ${provider.name} failed:`, error);
        this.updateStats(
          provider.name,
          {
            content: '',
            usage: {
              inputTokens: 0,
              outputTokens: 0,
              totalTokens: 0,
              costCents: 0,
            },
            provider: provider.name,
            model: request.model || 'unknown',
            responseTimeMs: 0,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          },
          false
        );

        // Continue to next provider
        continue;
      }
    }

    throw new Error('All LLM providers failed');
  }

  selectProvider(request: LLMRequest): LLMProvider {
    const availableProviders = this.getAvailableProviders();

    if (availableProviders.length === 0) {
      throw new Error('No available LLM providers');
    }

    // If specific provider is requested
    if (request.operation && this.config.loadBalancing.enabled) {
      const bestProvider = this.getBestProvider(
        request.operation,
        this.assessComplexity(request)
      );
      if (bestProvider) {
        return bestProvider;
      }
    }

    // Use load balancing strategy
    switch (this.config.loadBalancing.strategy) {
      case 'round-robin':
        return this.selectRoundRobin(availableProviders);
      case 'least-used':
        return this.selectLeastUsed(availableProviders);
      case 'fastest':
        return this.selectFastest(availableProviders);
      case 'cheapest':
        return this.selectCheapest(availableProviders);
      default:
        return availableProviders[0];
    }
  }

  getBestProvider(
    operation: string,
    complexity: ComplexityLevel
  ): LLMProvider | undefined {
    const availableProviders = this.getAvailableProviders();

    // Filter providers based on operation and complexity
    const suitableProviders = availableProviders.filter(provider => {
      const model = provider.config.models.find(
        m =>
          m.recommendedFor.includes(operation) ||
          m.capabilities.includes(complexity)
      );
      return model !== undefined;
    });

    if (suitableProviders.length === 0) {
      return availableProviders[0]; // Fallback to any available provider
    }

    // Select based on cost optimization if enabled
    if (this.config.costOptimization.enabled) {
      return this.selectCheapest(suitableProviders);
    }

    return suitableProviders[0];
  }

  async checkAllProviders(): Promise<ProviderHealthStatus[]> {
    const healthChecks = await Promise.allSettled(
      Array.from(this.providers.values()).map(async provider => {
        const startTime = Date.now();
        const healthy = await provider.healthCheck();
        const responseTimeMs = Date.now() - startTime;

        const status: ProviderHealthStatus = {
          provider: provider.name,
          healthy,
          responseTimeMs,
          lastChecked: new Date(),
          error: healthy ? undefined : 'Health check failed',
        };

        this.healthStatus.set(provider.name, status);
        return status;
      })
    );

    return healthChecks.map(result =>
      result.status === 'fulfilled'
        ? result.value
        : {
            provider: 'unknown',
            healthy: false,
            responseTimeMs: 0,
            lastChecked: new Date(),
            error: 'Health check failed',
          }
    );
  }

  getProviderStats(): ProviderStats[] {
    return Array.from(this.stats.values());
  }

  private initializeStats(): void {
    // Initialize stats for all configured providers
    this.config.providers.forEach(providerConfig => {
      this.stats.set(providerConfig.name, {
        provider: providerConfig.name,
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0,
        totalCostCents: 0,
        lastUsed: new Date(),
      });
    });
  }

  private getAvailableProviders(): LLMProvider[] {
    return Array.from(this.providers.values()).filter(
      provider =>
        provider.config.enabled &&
        this.healthStatus.get(provider.name)?.healthy !== false
    );
  }

  private assessComplexity(request: LLMRequest): ComplexityLevel {
    const totalLength = request.systemPrompt.length + request.userPrompt.length;
    const estimatedTokens = Math.ceil(totalLength / 4);

    if (estimatedTokens < 500) return 'low';
    if (estimatedTokens < 2000) return 'medium';
    return 'high';
  }

  private selectRoundRobin(providers: LLMProvider[]): LLMProvider {
    if (providers.length === 0) throw new Error('No providers available');

    const provider = providers[this.currentProviderIndex % providers.length];
    this.currentProviderIndex =
      (this.currentProviderIndex + 1) % providers.length;
    return provider;
  }

  private selectLeastUsed(providers: LLMProvider[]): LLMProvider {
    return providers.reduce((leastUsed, current) => {
      const leastUsedStats = this.stats.get(leastUsed.name);
      const currentStats = this.stats.get(current.name);

      if (!leastUsedStats || !currentStats) return leastUsed;

      return currentStats.totalRequests < leastUsedStats.totalRequests
        ? current
        : leastUsed;
    });
  }

  private selectFastest(providers: LLMProvider[]): LLMProvider {
    return providers.reduce((fastest, current) => {
      const fastestStats = this.stats.get(fastest.name);
      const currentStats = this.stats.get(current.name);

      if (!fastestStats || !currentStats) return fastest;

      return currentStats.averageResponseTime < fastestStats.averageResponseTime
        ? current
        : fastest;
    });
  }

  private selectCheapest(providers: LLMProvider[]): LLMProvider {
    return providers.reduce((cheapest, current) => {
      const cheapestModel = cheapest.config.models[0];
      const currentModel = current.config.models[0];

      if (!cheapestModel || !currentModel) return cheapest;

      const cheapestCost =
        cheapestModel.inputCostPer1K + cheapestModel.outputCostPer1K;
      const currentCost =
        currentModel.inputCostPer1K + currentModel.outputCostPer1K;

      return currentCost < cheapestCost ? current : cheapest;
    });
  }

  private updateStats(
    providerName: string,
    response: LLMResponse,
    success: boolean
  ): void {
    const stats = this.stats.get(providerName);
    if (!stats) return;

    stats.totalRequests++;
    if (success) {
      stats.successfulRequests++;
      stats.totalCostCents += response.usage.costCents;

      // Update average response time
      const totalTime =
        stats.averageResponseTime * (stats.successfulRequests - 1) +
        response.responseTimeMs;
      stats.averageResponseTime = totalTime / stats.successfulRequests;
    } else {
      stats.failedRequests++;
    }

    stats.lastUsed = new Date();
  }
}
