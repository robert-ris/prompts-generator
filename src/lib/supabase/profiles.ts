import { supabase } from './client';
import type { Profile, ProfileInsert, ProfileUpdate } from '@/types/database';

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }

  return data;
}

export async function createProfile(
  profile: ProfileInsert
): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .insert(profile)
    .select()
    .single();

  if (error) {
    console.error('Error creating profile:', error);
    return null;
  }

  return data;
}

export async function updateProfile(
  userId: string,
  updates: ProfileUpdate
): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating profile:', error);
    return null;
  }

  return data;
}

export async function deleteProfile(userId: string): Promise<boolean> {
  const { error } = await supabase.from('profiles').delete().eq('id', userId);

  if (error) {
    console.error('Error deleting profile:', error);
    return false;
  }

  return true;
}

export async function getProfilesBySubscriptionTier(
  tier: 'free' | 'pro'
): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('subscription_tier', tier);

  if (error) {
    console.error('Error fetching profiles by tier:', error);
    return [];
  }

  return data || [];
}
