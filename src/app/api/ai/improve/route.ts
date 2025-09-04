import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/supabase/server';
import { config } from '@/lib/config';

interface AIImproveRequest {
  prompt: string;
  mode: 'tighten' | 'expand';
}

export async function POST(request: NextRequest) {
  try {
    // Get user session
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body: AIImproveRequest = await request.json();
    const { prompt, mode } = body;

    if (!prompt?.trim()) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    if (!['tighten', 'expand'].includes(mode)) {
      return NextResponse.json({ error: 'Invalid mode' }, { status: 400 });
    }

    // Get user quota
    const supabase = await createClient();
    const { data: quota, error: quotaError } = await supabase
      .from('user_quotas')
      .select('ai_improve_calls_used, ai_improve_calls_limit')
      .eq('user_id', user.id)
      .single();

    if (quotaError) {
      console.error('Error fetching user quota:', quotaError);
      return NextResponse.json(
        { error: 'Failed to check quota' },
        { status: 500 }
      );
    }

    // Check if user has exceeded quota
    if (quota.ai_improve_calls_used >= quota.ai_improve_calls_limit) {
      return NextResponse.json(
        { error: 'Monthly AI improvement limit reached' },
        { status: 429 }
      );
    }

    // Call AI provider
    const improvedPrompt = await improvePromptWithAI(prompt, mode);

    // Log usage
    const { error: logError } = await supabase.from('ai_usage_logs').insert({
      user_id: user.id,
      operation_type: mode,
      input_tokens: Math.ceil(prompt.length / 4), // Rough estimate
      output_tokens: Math.ceil(improvedPrompt.length / 4),
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

    return NextResponse.json({ improvedPrompt });
  } catch (error) {
    console.error('AI improve error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function improvePromptWithAI(
  prompt: string,
  mode: 'tighten' | 'expand'
): Promise<string> {
  const systemPrompt =
    mode === 'tighten'
      ? `You are an expert at making prompts more concise and focused. Your task is to tighten the given prompt by removing unnecessary words, making it more direct, and ensuring it gets straight to the point while maintaining all essential information. Return only the improved prompt without any explanations.`
      : `You are an expert at expanding prompts with more detail and context. Your task is to enhance the given prompt by adding relevant details, clarifying instructions, and providing more context to help get better results from AI models. Return only the improved prompt without any explanations.`;

  const userPrompt = `Please ${mode} this prompt:\n\n"${prompt}"`;

  // Try OpenAI first, fallback to Anthropic
  try {
    if (config.openaiApiKey) {
      return await callOpenAI(systemPrompt, userPrompt);
    }
  } catch (error) {
    console.error('OpenAI error:', error);
  }

  try {
    if (config.anthropicApiKey) {
      return await callAnthropic(systemPrompt, userPrompt);
    }
  } catch (error) {
    console.error('Anthropic error:', error);
  }

  throw new Error('No AI provider available');
}

async function callOpenAI(
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 1000,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content?.trim() || '';
}

async function callAnthropic(
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.anthropicApiKey}`,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1000,
      messages: [{ role: 'user', content: `${systemPrompt}\n\n${userPrompt}` }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Anthropic API error: ${response.status}`);
  }

  const data = await response.json();
  return data.content[0]?.text?.trim() || '';
}
