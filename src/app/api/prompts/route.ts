import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/supabase/server';

interface SavePromptRequest {
  title: string;
  templateContent: string;
  category: string;
  variables: Record<string, string>;
  tags: string[];
  isPublic?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    // Get user session
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body: SavePromptRequest = await request.json();
    const {
      title,
      templateContent,
      category,
      variables,
      tags,
      isPublic = false,
    } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    if (!templateContent?.trim()) {
      return NextResponse.json(
        { error: 'Template content is required' },
        { status: 400 }
      );
    }

    // Get user's current prompt count to check limits
    const supabase = await createClient();
    const { data: promptCount, error: countError } = await supabase
      .from('prompt_templates')
      .select('id', { count: 'exact' })
      .eq('user_id', user.id);

    if (countError) {
      console.error('Error checking prompt count:', countError);
      return NextResponse.json(
        { error: 'Failed to check prompt limits' },
        { status: 500 }
      );
    }

    // Check if user has exceeded their prompt limit (Free users: 20, Pro: unlimited)
    const userProfile = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', user.id)
      .single();

    const isFreeUser = userProfile?.data?.subscription_tier === 'free';
    const currentCount = promptCount?.length || 0;
    const maxPrompts = isFreeUser ? 20 : -1; // -1 means unlimited

    if (isFreeUser && currentCount >= maxPrompts) {
      return NextResponse.json(
        {
          error:
            'You have reached your prompt limit. Upgrade to Pro for unlimited prompts.',
        },
        { status: 429 }
      );
    }

    // Save the prompt
    const { data: savedPrompt, error: saveError } = await supabase
      .from('prompt_templates')
      .insert({
        user_id: user.id,
        title: title.trim(),
        template_content: templateContent.trim(),
        category: category || 'custom',
        variables,
        tags: tags || [],
        is_public: isPublic,
        metadata: {
          lastSaved: new Date().toISOString(),
          usageCount: 0,
          isFavorite: false,
        },
        usage_count: 0,
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving prompt:', saveError);
      return NextResponse.json(
        { error: 'Failed to save prompt' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      prompt: savedPrompt,
      message: 'Prompt saved successfully',
    });
  } catch (error) {
    console.error('Save prompt error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Get user session
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { id, title, templateContent, category, variables, tags, isPublic } =
      body;

    if (!id) {
      return NextResponse.json(
        { error: 'Prompt ID is required' },
        { status: 400 }
      );
    }

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    if (!templateContent?.trim()) {
      return NextResponse.json(
        { error: 'Template content is required' },
        { status: 400 }
      );
    }

    // Update the prompt
    const supabase = await createClient();
    const { data: updatedPrompt, error: updateError } = await supabase
      .from('prompt_templates')
      .update({
        title: title.trim(),
        template_content: templateContent.trim(),
        category: category || 'custom',
        variables,
        tags: tags || [],
        is_public: isPublic,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id) // Ensure user owns the prompt
      .select()
      .single();

    if (updateError) {
      console.error('Error updating prompt:', updateError);
      return NextResponse.json(
        { error: 'Failed to update prompt' },
        { status: 500 }
      );
    }

    if (!updatedPrompt) {
      return NextResponse.json(
        { error: 'Prompt not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      prompt: updatedPrompt,
      message: 'Prompt updated successfully',
    });
  } catch (error) {
    console.error('Update prompt error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
