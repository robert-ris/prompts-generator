import { NextRequest } from 'next/server';
import { improvePrompt } from '@/lib/llm';

// Mock the LLM factory
jest.mock('@/lib/llm', () => ({
  improvePrompt: jest.fn(),
}));

const MockImprovePrompt = improvePrompt as jest.MockedFunction<
  typeof improvePrompt
>;

// Mock Supabase
jest.mock('@/lib/supabase/server', () => ({
  createServerClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
      insert: jest.fn(() => ({
        select: jest.fn(),
      })),
    })),
  })),
}));

// Import the route handler
const { POST } = require('@/app/api/ai/improve/route');

describe('AI Improve API Route', () => {
  let mockRequest: NextRequest;
  let mockResponse: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock request
    mockRequest = {
      json: jest.fn(),
      headers: {
        get: jest.fn(),
      },
    } as any;

    // Mock response
    mockResponse = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    };
  });

  describe('POST /api/ai/improve', () => {
    it('should improve prompt successfully', async () => {
      const mockRequestBody = {
        prompt: 'Original prompt text',
        mode: 'tighten',
      };

      const mockLLMResponse = {
        content: 'Improved prompt text',
        usage: {
          inputTokens: 20,
          outputTokens: 15,
          totalTokens: 35,
          costCents: 25,
        },
        provider: 'openai',
        model: 'gpt-4o-mini',
        responseTimeMs: 1000,
        success: true,
      };

      mockRequest.json.mockResolvedValue(mockRequestBody);
      MockImprovePrompt.mockResolvedValue(mockLLMResponse);

      const response = await POST(mockRequest);

      expect(MockImprovePrompt).toHaveBeenCalledWith(
        'Original prompt text',
        'tighten',
        expect.objectContaining({
          maxTokens: 1000,
          temperature: 0.7,
        })
      );

      expect(response.status).toBe(200);
      expect(response.json).toHaveBeenCalledWith({
        success: true,
        improvedPrompt: 'Improved prompt text',
        usage: {
          inputTokens: 20,
          outputTokens: 15,
          totalTokens: 35,
          costCents: 25,
        },
        provider: 'openai',
        model: 'gpt-4o-mini',
        responseTimeMs: 1000,
      });
    });

    it('should handle expand mode', async () => {
      const mockRequestBody = {
        prompt: 'Original prompt text',
        mode: 'expand',
      };

      const mockLLMResponse = {
        content: 'Expanded prompt text',
        usage: {
          inputTokens: 20,
          outputTokens: 25,
          totalTokens: 45,
          costCents: 35,
        },
        provider: 'anthropic',
        model: 'claude-3-haiku-20240307',
        responseTimeMs: 1200,
        success: true,
      };

      mockRequest.json.mockResolvedValue(mockRequestBody);
      MockImprovePrompt.mockResolvedValue(mockLLMResponse);

      const response = await POST(mockRequest);

      expect(MockImprovePrompt).toHaveBeenCalledWith(
        'Original prompt text',
        'expand',
        expect.objectContaining({
          maxTokens: 1000,
          temperature: 0.7,
        })
      );

      expect(response.status).toBe(200);
      expect(response.json).toHaveBeenCalledWith({
        success: true,
        improvedPrompt: 'Expanded prompt text',
        usage: {
          inputTokens: 20,
          outputTokens: 25,
          totalTokens: 45,
          costCents: 35,
        },
        provider: 'anthropic',
        model: 'claude-3-haiku-20240307',
        responseTimeMs: 1200,
      });
    });

    it('should handle missing prompt', async () => {
      const mockRequestBody = {
        mode: 'tighten',
      };

      mockRequest.json.mockResolvedValue(mockRequestBody);

      const response = await POST(mockRequest);

      expect(response.status).toBe(400);
      expect(response.json).toHaveBeenCalledWith({
        success: false,
        error: 'Prompt is required',
      });
    });

    it('should handle missing mode', async () => {
      const mockRequestBody = {
        prompt: 'Original prompt text',
      };

      mockRequest.json.mockResolvedValue(mockRequestBody);

      const response = await POST(mockRequest);

      expect(response.status).toBe(400);
      expect(response.json).toHaveBeenCalledWith({
        success: false,
        error: 'Mode is required and must be "tighten" or "expand"',
      });
    });

    it('should handle invalid mode', async () => {
      const mockRequestBody = {
        prompt: 'Original prompt text',
        mode: 'invalid',
      };

      mockRequest.json.mockResolvedValue(mockRequestBody);

      const response = await POST(mockRequest);

      expect(response.status).toBe(400);
      expect(response.json).toHaveBeenCalledWith({
        success: false,
        error: 'Mode is required and must be "tighten" or "expand"',
      });
    });

    it('should handle empty prompt', async () => {
      const mockRequestBody = {
        prompt: '',
        mode: 'tighten',
      };

      mockRequest.json.mockResolvedValue(mockRequestBody);

      const response = await POST(mockRequest);

      expect(response.status).toBe(400);
      expect(response.json).toHaveBeenCalledWith({
        success: false,
        error: 'Prompt cannot be empty',
      });
    });

    it('should handle LLM errors', async () => {
      const mockRequestBody = {
        prompt: 'Original prompt text',
        mode: 'tighten',
      };

      mockRequest.json.mockResolvedValue(mockRequestBody);
      MockImprovePrompt.mockRejectedValue(new Error('LLM API error'));

      const response = await POST(mockRequest);

      expect(response.status).toBe(500);
      expect(response.json).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to improve prompt: LLM API error',
      });
    });

    it('should handle JSON parsing errors', async () => {
      mockRequest.json.mockRejectedValue(new Error('Invalid JSON'));

      const response = await POST(mockRequest);

      expect(response.status).toBe(400);
      expect(response.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid JSON in request body',
      });
    });

    it('should sanitize input prompt', async () => {
      const mockRequestBody = {
        prompt: '<script>alert("xss")</script>Original prompt text',
        mode: 'tighten',
      };

      const mockLLMResponse = {
        content: 'Improved prompt text',
        usage: {
          inputTokens: 20,
          outputTokens: 15,
          totalTokens: 35,
          costCents: 25,
        },
        provider: 'openai',
        model: 'gpt-4o-mini',
        responseTimeMs: 1000,
        success: true,
      };

      mockRequest.json.mockResolvedValue(mockRequestBody);
      MockImprovePrompt.mockResolvedValue(mockLLMResponse);

      const response = await POST(mockRequest);

      // Check that the sanitized prompt was passed to LLM
      expect(MockImprovePrompt).toHaveBeenCalledWith(
        'Original prompt text', // Should be sanitized
        'tighten',
        expect.any(Object)
      );

      expect(response.status).toBe(200);
    });

    it('should handle custom options', async () => {
      const mockRequestBody = {
        prompt: 'Original prompt text',
        mode: 'tighten',
        maxTokens: 500,
        temperature: 0.5,
        model: 'gpt-4o',
      };

      const mockLLMResponse = {
        content: 'Improved prompt text',
        usage: {
          inputTokens: 20,
          outputTokens: 15,
          totalTokens: 35,
          costCents: 25,
        },
        provider: 'openai',
        model: 'gpt-4o',
        responseTimeMs: 1000,
        success: true,
      };

      mockRequest.json.mockResolvedValue(mockRequestBody);
      MockImprovePrompt.mockResolvedValue(mockLLMResponse);

      const response = await POST(mockRequest);

      expect(MockImprovePrompt).toHaveBeenCalledWith(
        'Original prompt text',
        'tighten',
        expect.objectContaining({
          maxTokens: 500,
          temperature: 0.5,
          model: 'gpt-4o',
        })
      );

      expect(response.status).toBe(200);
    });

    it('should validate maxTokens range', async () => {
      const mockRequestBody = {
        prompt: 'Original prompt text',
        mode: 'tighten',
        maxTokens: 10000, // Too high
      };

      mockRequest.json.mockResolvedValue(mockRequestBody);

      const response = await POST(mockRequest);

      expect(response.status).toBe(400);
      expect(response.json).toHaveBeenCalledWith({
        success: false,
        error: 'maxTokens must be between 1 and 4000',
      });
    });

    it('should validate temperature range', async () => {
      const mockRequestBody = {
        prompt: 'Original prompt text',
        mode: 'tighten',
        temperature: 2.0, // Too high
      };

      mockRequest.json.mockResolvedValue(mockRequestBody);

      const response = await POST(mockRequest);

      expect(response.status).toBe(400);
      expect(response.json).toHaveBeenCalledWith({
        success: false,
        error: 'temperature must be between 0 and 2',
      });
    });
  });
});
