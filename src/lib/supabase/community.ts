import { supabase } from './client';
import type {
  CommunityPrompt,
  CommunityPromptInsert,
  CommunityPromptUpdate,
  CommunitySave,
  CommunityRating,
  CommunityRatingInsert,
  CommunityComment,
  CommunityCommentInsert,
  CommunityFollow,
  CommunityNotification,
  CommunityNotificationInsert,
  CommentEditHistory,
  TemplateVariables,
} from '@/types/database';

// Community Prompts Management
export async function createCommunityPrompt(
  prompt: CommunityPromptInsert
): Promise<CommunityPrompt | null> {
  const { data, error } = await supabase
    .from('community_prompts')
    .insert(prompt)
    .select()
    .single();

  if (error) {
    console.error('Error creating community prompt:', error);
    return null;
  }

  return data;
}

export async function getCommunityPrompt(
  promptId: string
): Promise<CommunityPrompt | null> {
  const { data, error } = await supabase
    .from('community_prompts')
    .select('*')
    .eq('id', promptId)
    .single();

  if (error) {
    console.error('Error fetching community prompt:', error);
    return null;
  }

  return data;
}

export async function getCommunityPromptWithStats(
  promptId: string,
  userId?: string
): Promise<{
  id: string;
  original_template_id: string;
  user_id: string;
  title: string;
  content: string;
  description: string | null;
  category: string | null;
  tags: string[] | null;
  variables: TemplateVariables | null;
  is_featured: boolean;
  is_approved: boolean;
  approval_status: string;
  view_count: number;
  save_count: number;
  rating_average: number;
  rating_count: number;
  created_at: string;
  updated_at: string;
  author_name: string | null;
  author_avatar: string | null;
  is_saved: boolean;
  user_rating: number | null;
  user_review: string | null;
} | null> {
  const { data, error } = await supabase.rpc(
    'get_community_prompt_with_stats',
    {
      prompt_uuid: promptId,
      user_uuid: userId,
    }
  );

  if (error) {
    console.error('Error fetching community prompt with stats:', error);
    return null;
  }

  return data?.[0] || null;
}

export async function getCommunityPrompts(
  filters: {
    category?: string;
    is_featured?: boolean;
    is_approved?: boolean;
    userId?: string;
  } = {},
  limit = 20,
  offset = 0
): Promise<CommunityPrompt[]> {
  let query = supabase
    .from('community_prompts')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters.category) {
    query = query.eq('category', filters.category);
  }
  if (filters.is_featured !== undefined) {
    query = query.eq('is_featured', filters.is_featured);
  }
  if (filters.is_approved !== undefined) {
    query = query.eq('is_approved', filters.is_approved);
  }
  if (filters.userId) {
    query = query.eq('user_id', filters.userId);
  }

  const { data, error } = await query.range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching community prompts:', error);
    return [];
  }

  return data || [];
}

export async function getTrendingCommunityPrompts(
  days = 7,
  limit = 20
): Promise<
  {
    id: string;
    title: string;
    description: string | null;
    category: string | null;
    tags: string[] | null;
    view_count: number;
    save_count: number;
    rating_average: number;
    rating_count: number;
    created_at: string;
    author_name: string | null;
    author_avatar: string | null;
    trend_score: number;
  }[]
> {
  const { data, error } = await supabase.rpc('get_trending_community_prompts', {
    days,
    limit_count: limit,
  });

  if (error) {
    console.error('Error fetching trending community prompts:', error);
    return [];
  }

  return data || [];
}

export async function updateCommunityPrompt(
  promptId: string,
  updates: CommunityPromptUpdate
): Promise<CommunityPrompt | null> {
  const { data, error } = await supabase
    .from('community_prompts')
    .update(updates)
    .eq('id', promptId)
    .select()
    .single();

  if (error) {
    console.error('Error updating community prompt:', error);
    return null;
  }

  return data;
}

export async function deleteCommunityPrompt(
  promptId: string
): Promise<boolean> {
  const { error } = await supabase
    .from('community_prompts')
    .delete()
    .eq('id', promptId);

  if (error) {
    console.error('Error deleting community prompt:', error);
    return false;
  }

  return true;
}

export async function incrementCommunityPromptViews(
  promptId: string
): Promise<boolean> {
  const { error } = await supabase.rpc('increment_community_prompt_views', {
    prompt_id: promptId,
  });

  if (error) {
    console.error('Error incrementing community prompt views:', error);
    return false;
  }

  return true;
}

// Community Saves Management
export async function saveCommunityPrompt(
  userId: string,
  promptId: string
): Promise<CommunitySave | null> {
  const { data, error } = await supabase
    .from('community_saves')
    .insert({
      user_id: userId,
      community_prompt_id: promptId,
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving community prompt:', error);
    return null;
  }

  return data;
}

export async function unsaveCommunityPrompt(
  userId: string,
  promptId: string
): Promise<boolean> {
  const { error } = await supabase
    .from('community_saves')
    .delete()
    .eq('user_id', userId)
    .eq('community_prompt_id', promptId);

  if (error) {
    console.error('Error unsaving community prompt:', error);
    return false;
  }

  return true;
}

export async function getUserSavedPrompts(
  userId: string,
  limit = 20,
  offset = 0
): Promise<CommunityPrompt[]> {
  const { data, error } = await supabase
    .from('community_saves')
    .select(
      `
      community_prompt_id,
      community_prompts (*)
    `
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching user saved prompts:', error);
    return [];
  }

  return (
    (data as unknown as Array<{ community_prompts: CommunityPrompt }>)?.map(
      item => item.community_prompts
    ) || []
  );
}

export async function isCommunityPromptSaved(
  userId: string,
  promptId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('community_saves')
    .select('id')
    .eq('user_id', userId)
    .eq('community_prompt_id', promptId)
    .single();

  if (error) {
    return false;
  }

  return !!data;
}

// Community Ratings Management
export async function rateCommunityPrompt(
  rating: CommunityRatingInsert
): Promise<CommunityRating | null> {
  const { data, error } = await supabase
    .from('community_ratings')
    .upsert(rating, { onConflict: 'user_id,community_prompt_id' })
    .select()
    .single();

  if (error) {
    console.error('Error rating community prompt:', error);
    return null;
  }

  return data;
}

export async function getCommunityPromptRatings(
  promptId: string,
  limit = 20,
  offset = 0
): Promise<CommunityRating[]> {
  const { data, error } = await supabase
    .from('community_ratings')
    .select(
      `
      *,
      profiles (full_name, avatar_url)
    `
    )
    .eq('community_prompt_id', promptId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching community prompt ratings:', error);
    return [];
  }

  return data || [];
}

export async function getUserRating(
  userId: string,
  promptId: string
): Promise<CommunityRating | null> {
  const { data, error } = await supabase
    .from('community_ratings')
    .select('*')
    .eq('user_id', userId)
    .eq('community_prompt_id', promptId)
    .single();

  if (error) {
    return null;
  }

  return data;
}

// Community Comments Management
export async function createCommunityComment(
  comment: CommunityCommentInsert
): Promise<CommunityComment | null> {
  const { data, error } = await supabase
    .from('community_comments')
    .insert(comment)
    .select()
    .single();

  if (error) {
    console.error('Error creating community comment:', error);
    return null;
  }

  return data;
}

export async function getCommunityComments(
  promptId: string,
  parentCommentId?: string,
  limit = 20,
  offset = 0
): Promise<CommunityComment[]> {
  let query = supabase
    .from('community_comments')
    .select(
      `
      *,
      profiles (full_name, avatar_url)
    `
    )
    .eq('community_prompt_id', promptId)
    .order('created_at', { ascending: true });

  if (parentCommentId) {
    query = query.eq('parent_comment_id', parentCommentId);
  } else {
    query = query.is('parent_comment_id', null);
  }

  const { data, error } = await query.range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching community comments:', error);
    return [];
  }

  return data || [];
}

export async function updateCommunityComment(
  commentId: string,
  updates: Partial<CommunityComment>,
  editHistory?: CommentEditHistory[]
): Promise<CommunityComment | null> {
  const updateData = {
    ...updates,
    is_edited: true,
    edit_history: editHistory,
  };

  const { data, error } = await supabase
    .from('community_comments')
    .update(updateData)
    .eq('id', commentId)
    .select()
    .single();

  if (error) {
    console.error('Error updating community comment:', error);
    return null;
  }

  return data;
}

export async function deleteCommunityComment(
  commentId: string
): Promise<boolean> {
  const { error } = await supabase
    .from('community_comments')
    .delete()
    .eq('id', commentId);

  if (error) {
    console.error('Error deleting community comment:', error);
    return false;
  }

  return true;
}

// Community Follows Management
export async function followUser(
  followerId: string,
  followingId: string
): Promise<CommunityFollow | null> {
  const { data, error } = await supabase
    .from('community_follows')
    .insert({
      follower_id: followerId,
      following_id: followingId,
    })
    .select()
    .single();

  if (error) {
    console.error('Error following user:', error);
    return null;
  }

  return data;
}

export async function unfollowUser(
  followerId: string,
  followingId: string
): Promise<boolean> {
  const { error } = await supabase
    .from('community_follows')
    .delete()
    .eq('follower_id', followerId)
    .eq('following_id', followingId);

  if (error) {
    console.error('Error unfollowing user:', error);
    return false;
  }

  return true;
}

export async function getFollowers(
  userId: string,
  limit = 20,
  offset = 0
): Promise<
  {
    follower: {
      id: string;
      full_name: string | null;
      avatar_url: string | null;
      bio: string | null;
    };
    follow: CommunityFollow;
  }[]
> {
  const { data, error } = await supabase
    .from('community_follows')
    .select(
      `
      *,
      profiles!follower_id (id, full_name, avatar_url, bio)
    `
    )
    .eq('following_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching followers:', error);
    return [];
  }

  return (
    data?.map(item => ({
      follower: item.profiles,
      follow: item,
    })) || []
  );
}

export async function getFollowing(
  userId: string,
  limit = 20,
  offset = 0
): Promise<
  {
    following: {
      id: string;
      full_name: string | null;
      avatar_url: string | null;
      bio: string | null;
    };
    follow: CommunityFollow;
  }[]
> {
  const { data, error } = await supabase
    .from('community_follows')
    .select(
      `
      *,
      profiles!following_id (id, full_name, avatar_url, bio)
    `
    )
    .eq('follower_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching following:', error);
    return [];
  }

  return (
    data?.map(item => ({
      following: item.profiles,
      follow: item,
    })) || []
  );
}

export async function isFollowing(
  followerId: string,
  followingId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('community_follows')
    .select('id')
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
    .single();

  if (error) {
    return false;
  }

  return !!data;
}

// Community Notifications Management
export async function createNotification(
  notification: CommunityNotificationInsert
): Promise<CommunityNotification | null> {
  const { data, error } = await supabase
    .from('community_notifications')
    .insert(notification)
    .select()
    .single();

  if (error) {
    console.error('Error creating notification:', error);
    return null;
  }

  return data;
}

export async function getUserNotifications(
  userId: string,
  limit = 50,
  offset = 0
): Promise<CommunityNotification[]> {
  const { data, error } = await supabase
    .from('community_notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching user notifications:', error);
    return [];
  }

  return data || [];
}

export async function markNotificationAsRead(
  notificationId: string
): Promise<boolean> {
  const { error } = await supabase
    .from('community_notifications')
    .update({ is_read: true })
    .eq('id', notificationId);

  if (error) {
    console.error('Error marking notification as read:', error);
    return false;
  }

  return true;
}

export async function markAllNotificationsAsRead(
  userId: string
): Promise<boolean> {
  const { error } = await supabase
    .from('community_notifications')
    .update({ is_read: true })
    .eq('user_id', userId);

  if (error) {
    console.error('Error marking all notifications as read:', error);
    return false;
  }

  return true;
}

export async function getUnreadNotificationCount(
  userId: string
): Promise<number> {
  const { count, error } = await supabase
    .from('community_notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) {
    console.error('Error getting unread notification count:', error);
    return 0;
  }

  return count || 0;
}

// Utility Functions
export function formatViewCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  } else if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
}

export function formatRating(rating: number): string {
  return rating.toFixed(1);
}

export function getTimeAgo(date: string): string {
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 31536000) {
    const months = Math.floor(diffInSeconds / 2592000);
    return `${months} month${months > 1 ? 's' : ''} ago`;
  } else {
    const years = Math.floor(diffInSeconds / 31536000);
    return `${years} year${years > 1 ? 's' : ''} ago`;
  }
}

// Search and Discovery
export async function searchCommunityPrompts(
  query: string,
  filters: {
    category?: string;
    tags?: string[];
    minRating?: number;
  } = {},
  limit = 20,
  offset = 0
): Promise<CommunityPrompt[]> {
  let searchQuery = supabase
    .from('community_prompts')
    .select('*')
    .eq('is_approved', true)
    .textSearch('title', query, {
      type: 'websearch',
      config: 'english',
    });

  if (filters.category) {
    searchQuery = searchQuery.eq('category', filters.category);
  }
  if (filters.tags && filters.tags.length > 0) {
    searchQuery = searchQuery.overlaps('tags', filters.tags);
  }
  if (filters.minRating) {
    searchQuery = searchQuery.gte('rating_average', filters.minRating);
  }

  const { data, error } = await searchQuery
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error searching community prompts:', error);
    return [];
  }

  return data || [];
}
