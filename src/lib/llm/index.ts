// LLM Provider Abstraction System
// This module provides a flexible, extensible system for managing multiple LLM providers

// Core types and interfaces
export * from './types';

// Base provider class
export { BaseLLMProvider } from './base-provider';

// Provider implementations
export { OpenAIProvider } from './providers/openai';
export { AnthropicProvider } from './providers/anthropic';
export { MockProvider } from './providers/mock';

// Mock data generator
export { MockDataGenerator } from './mock-generator';

// Manager and factory
export { LLMProviderManager } from './manager';
export {
  getLLMManager,
  createLLMManager,
  improvePrompt,
  generatePrompt,
  getProviderHealth,
  getProviderStats,
  LLM_CONFIG,
} from './factory';

// Re-export commonly used types
export type {
  LLMRequest,
  LLMResponse,
  LLMProvider,
  LLMManager,
  AIOperation,
  ComplexityLevel,
} from './types';
