import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/supabase/server';
import { improvePrompt } from '@/lib/llm';
import { config } from '@/lib/config';

interface AIImproveRequest {
  prompt: string;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Get user session
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body: AIImproveRequest = await request.json();
    const { prompt } = body;

    // Input validation and sanitization
    if (!prompt?.trim()) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Sanitize input
    const sanitizedPrompt = sanitizeInput(prompt);
    if (sanitizedPrompt.length > 10000) {
      return NextResponse.json(
        { error: 'Prompt too long (max 10,000 characters)' },
        { status: 400 }
      );
    }

    // Get user quota
    const supabase = await createClient();
    let quota = { ai_improve_calls_used: 0, ai_improve_calls_limit: 10 };

    try {
      const { data: quotaData, error: quotaErrorData } = await supabase
        .from('user_quotas')
        .select('ai_improve_calls_used, ai_improve_calls_limit')
        .eq('user_id', user.id)
        .single();

      if (quotaData) {
        quota = quotaData;
      }
      // If table doesn't exist, use default values
    } catch (error) {
      console.log('User quotas table not found, using default values');
      quota = { ai_improve_calls_used: 0, ai_improve_calls_limit: 10 };
    }

    // Check if user has exceeded quota (skip in mock mode)
    if (
      !config.skipAIRequest &&
      quota.ai_improve_calls_used >= quota.ai_improve_calls_limit
    ) {
      return NextResponse.json(
        { error: 'Monthly AI improvement limit reached' },
        { status: 429 }
      );
    }

    // Use the new LLM abstraction to improve the prompt
    const response = await improvePrompt(sanitizedPrompt, {
      useFallback: true, // Enable fallback to other providers
      maxTokens: 1000,
      temperature: 0.7,
    });

    // Validate response
    if (!response.content || response.content.trim().length === 0) {
      return NextResponse.json(
        { error: 'AI provider returned empty response' },
        { status: 500 }
      );
    }

    // Log usage with accurate token counts (skip in mock mode)
    if (!config.skipAIRequest) {
      const { error: logError } = await supabase.from('ai_usage_logs').insert({
        user_id: user.id,
        operation_type: 'improve',
        input_tokens: response.usage.inputTokens,
        output_tokens: response.usage.outputTokens,
        cost_cents: response.usage.costCents,
        provider: response.provider,
        model: response.model,
        response_time_ms: response.responseTimeMs,
        success: true,
      });

      if (logError) {
        console.error('Error logging AI usage:', logError);
      }

      // Update quota
      const { error: updateError } = await supabase
        .from('user_quotas')
        .update({ ai_improve_calls_used: quota.ai_improve_calls_used + 1 })
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Error updating quota:', updateError);
      }
    }

    return NextResponse.json({
      improvedPrompt: response.content,
      usageStats: {
        inputTokens: response.usage.inputTokens,
        outputTokens: response.usage.outputTokens,
        costCents: response.usage.costCents,
        provider: response.provider,
        model: response.model,
        responseTimeMs: response.responseTimeMs,
      },
      isMockMode: config.skipAIRequest,
    });
  } catch (error) {
    console.error('AI improve error:', error);

    // Provide more helpful error messages
    let errorMessage = 'Internal server error';
    let statusCode = 500;

    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        errorMessage =
          'AI provider API key not configured. Please check your environment variables.';
        statusCode = 500;
      } else if (error.message.includes('rate limit')) {
        errorMessage = 'Rate limit exceeded. Please try again later.';
        statusCode = 429;
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Request timeout. Please try again.';
        statusCode = 408;
      } else {
        errorMessage = error.message;
      }
    }

    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}

/**
 * Sanitize input to prevent XSS and other attacks
 */
function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '') // Remove iframes
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '') // Remove objects
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, ''); // Remove embeds
}
