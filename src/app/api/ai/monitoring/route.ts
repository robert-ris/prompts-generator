import { NextRequest, NextResponse } from 'next/server';
import { getProviderHealth, getProviderStats } from '@/lib/llm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    if (type === 'health') {
      const healthData = await getProviderHealth();
      return NextResponse.json(healthData);
    } else if (type === 'stats') {
      const statsData = await getProviderStats();
      return NextResponse.json(statsData);
    } else {
      // Return both health and stats
      const healthData = await getProviderHealth();
      const statsData = await getProviderStats();

      return NextResponse.json({
        health: healthData,
        stats: statsData,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('LLM monitoring error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch LLM provider data' },
      { status: 500 }
    );
  }
}
