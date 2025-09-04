import { NextRequest } from 'next/server';
import { getProviderHealth, getProviderStats } from '@/lib/llm';

// Mock the LLM factory
jest.mock('@/lib/llm', () => ({
  getProviderHealth: jest.fn(),
  getProviderStats: jest.fn(),
}));

const MockGetProviderHealth = getProviderHealth as jest.MockedFunction<
  typeof getProviderHealth
>;
const MockGetProviderStats = getProviderStats as jest.MockedFunction<
  typeof getProviderStats
>;

// Import the route handler
const { GET } = require('@/app/api/ai/monitoring/route');

describe('AI Monitoring API Route', () => {
  let mockRequest: NextRequest;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock request
    mockRequest = {
      nextUrl: {
        searchParams: {
          get: jest.fn(),
        },
      },
    } as any;
  });

  describe('GET /api/ai/monitoring', () => {
    it('should return health status when type=health', async () => {
      const mockHealthData = [
        {
          provider: 'openai',
          healthy: true,
          responseTimeMs: 100,
          lastChecked: new Date(),
        },
        {
          provider: 'anthropic',
          healthy: false,
          responseTimeMs: 0,
          lastChecked: new Date(),
          error: 'Connection failed',
        },
      ];

      mockRequest.nextUrl.searchParams.get.mockReturnValue('health');
      MockGetProviderHealth.mockResolvedValue({
        health: mockHealthData,
        stats: [],
        timestamp: '2024-01-01T00:00:00Z',
      });

      const response = await GET(mockRequest);

      expect(response.status).toBe(200);
      expect(response.json).toHaveBeenCalledWith({
        success: true,
        data: mockHealthData,
        timestamp: '2024-01-01T00:00:00Z',
      });
    });

    it('should return stats when type=stats', async () => {
      const mockStatsData = [
        {
          provider: 'openai',
          totalRequests: 10,
          successfulRequests: 9,
          failedRequests: 1,
          averageResponseTime: 150,
          totalCostCents: 250,
          lastUsed: new Date(),
        },
        {
          provider: 'anthropic',
          totalRequests: 5,
          successfulRequests: 4,
          failedRequests: 1,
          averageResponseTime: 200,
          totalCostCents: 100,
          lastUsed: new Date(),
        },
      ];

      mockRequest.nextUrl.searchParams.get.mockReturnValue('stats');
      MockGetProviderStats.mockReturnValue(mockStatsData);

      const response = await GET(mockRequest);

      expect(response.status).toBe(200);
      expect(response.json).toHaveBeenCalledWith({
        success: true,
        data: mockStatsData,
      });
    });

    it('should return both health and stats when no type specified', async () => {
      const mockHealthData = [
        {
          provider: 'openai',
          healthy: true,
          responseTimeMs: 100,
          lastChecked: new Date(),
        },
      ];

      const mockStatsData = [
        {
          provider: 'openai',
          totalRequests: 10,
          successfulRequests: 9,
          failedRequests: 1,
          averageResponseTime: 150,
          totalCostCents: 250,
          lastUsed: new Date(),
        },
      ];

      mockRequest.nextUrl.searchParams.get.mockReturnValue(null);
      MockGetProviderHealth.mockResolvedValue({
        health: mockHealthData,
        stats: mockStatsData,
        timestamp: '2024-01-01T00:00:00Z',
      });

      const response = await GET(mockRequest);

      expect(response.status).toBe(200);
      expect(response.json).toHaveBeenCalledWith({
        success: true,
        data: {
          health: mockHealthData,
          stats: mockStatsData,
          timestamp: '2024-01-01T00:00:00Z',
        },
      });
    });

    it('should return both health and stats when type=all', async () => {
      const mockHealthData = [
        {
          provider: 'openai',
          healthy: true,
          responseTimeMs: 100,
          lastChecked: new Date(),
        },
      ];

      const mockStatsData = [
        {
          provider: 'openai',
          totalRequests: 10,
          successfulRequests: 9,
          failedRequests: 1,
          averageResponseTime: 150,
          totalCostCents: 250,
          lastUsed: new Date(),
        },
      ];

      mockRequest.nextUrl.searchParams.get.mockReturnValue('all');
      MockGetProviderHealth.mockResolvedValue({
        health: mockHealthData,
        stats: mockStatsData,
        timestamp: '2024-01-01T00:00:00Z',
      });

      const response = await GET(mockRequest);

      expect(response.status).toBe(200);
      expect(response.json).toHaveBeenCalledWith({
        success: true,
        data: {
          health: mockHealthData,
          stats: mockStatsData,
          timestamp: '2024-01-01T00:00:00Z',
        },
      });
    });

    it('should handle invalid type parameter', async () => {
      mockRequest.nextUrl.searchParams.get.mockReturnValue('invalid');

      const response = await GET(mockRequest);

      expect(response.status).toBe(400);
      expect(response.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid type parameter. Must be "health", "stats", or "all"',
      });
    });

    it('should handle health check errors', async () => {
      mockRequest.nextUrl.searchParams.get.mockReturnValue('health');
      MockGetProviderHealth.mockRejectedValue(new Error('Health check failed'));

      const response = await GET(mockRequest);

      expect(response.status).toBe(500);
      expect(response.json).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to get provider health: Health check failed',
      });
    });

    it('should handle stats retrieval errors', async () => {
      mockRequest.nextUrl.searchParams.get.mockReturnValue('stats');
      MockGetProviderStats.mockImplementation(() => {
        throw new Error('Stats retrieval failed');
      });

      const response = await GET(mockRequest);

      expect(response.status).toBe(500);
      expect(response.json).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to get provider stats: Stats retrieval failed',
      });
    });

    it('should handle combined data retrieval errors', async () => {
      mockRequest.nextUrl.searchParams.get.mockReturnValue(null);
      MockGetProviderHealth.mockRejectedValue(
        new Error('Combined data failed')
      );

      const response = await GET(mockRequest);

      expect(response.status).toBe(500);
      expect(response.json).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to get monitoring data: Combined data failed',
      });
    });

    it('should return empty arrays when no data available', async () => {
      mockRequest.nextUrl.searchParams.get.mockReturnValue('health');
      MockGetProviderHealth.mockResolvedValue({
        health: [],
        stats: [],
        timestamp: '2024-01-01T00:00:00Z',
      });

      const response = await GET(mockRequest);

      expect(response.status).toBe(200);
      expect(response.json).toHaveBeenCalledWith({
        success: true,
        data: [],
        timestamp: '2024-01-01T00:00:00Z',
      });
    });

    it('should handle case-insensitive type parameter', async () => {
      const mockHealthData = [
        {
          provider: 'openai',
          healthy: true,
          responseTimeMs: 100,
          lastChecked: new Date(),
        },
      ];

      mockRequest.nextUrl.searchParams.get.mockReturnValue('HEALTH');
      MockGetProviderHealth.mockResolvedValue({
        health: mockHealthData,
        stats: [],
        timestamp: '2024-01-01T00:00:00Z',
      });

      const response = await GET(mockRequest);

      expect(response.status).toBe(200);
      expect(response.json).toHaveBeenCalledWith({
        success: true,
        data: mockHealthData,
        timestamp: '2024-01-01T00:00:00Z',
      });
    });
  });
});
