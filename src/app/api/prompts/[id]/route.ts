import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get user session
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const promptId = params.id;

    if (!promptId) {
      return NextResponse.json(
        { error: 'Prompt ID is required' },
        { status: 400 }
      );
    }

    // Get the prompt
    const supabase = await createClient();
    const { data: prompt, error } = await supabase
      .from('prompt_templates')
      .select('*')
      .eq('id', promptId)
      .eq('user_id', user.id) // Ensure user owns the prompt
      .single();

    if (error) {
      console.error('Error fetching prompt:', error);
      return NextResponse.json(
        { error: 'Failed to fetch prompt' },
        { status: 500 }
      );
    }

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json({ prompt });
  } catch (error) {
    console.error('Get prompt error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get user session
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const promptId = params.id;

    if (!promptId) {
      return NextResponse.json(
        { error: 'Prompt ID is required' },
        { status: 400 }
      );
    }

    // Delete the prompt
    const supabase = await createClient();
    const { error } = await supabase
      .from('prompt_templates')
      .delete()
      .eq('id', promptId)
      .eq('user_id', user.id); // Ensure user owns the prompt

    if (error) {
      console.error('Error deleting prompt:', error);
      return NextResponse.json(
        { error: 'Failed to delete prompt' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Prompt deleted successfully' });
  } catch (error) {
    console.error('Delete prompt error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get user session
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const promptId = params.id;

    if (!promptId) {
      return NextResponse.json(
        { error: 'Prompt ID is required' },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    const {
      title,
      description,
      templateContent,
      category,
      coreSettings,
      advancedSettings,
      tags,
      isPublic,
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

    // Update the prompt
    const supabase = await createClient();
    const { data: updatedPrompt, error: updateError } = await supabase
      .from('prompt_templates')
      .update({
        title: title.trim(),
        description: description?.trim() || '',
        content: templateContent.trim(),
        template_content: templateContent.trim(),
        category: category || 'custom',
        core_settings: coreSettings,
        advanced_settings: advancedSettings,
        tags: tags || [],
        is_public: isPublic,
        updated_at: new Date().toISOString(),
      })
      .eq('id', promptId)
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
