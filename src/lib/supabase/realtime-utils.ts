import { supabase } from './client';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

// ============================================================================
// REAL-TIME TYPES
// ============================================================================

export interface RealtimeEvent {
  id: string;
  table_name: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  record_id: string;
  user_id?: string;
  event_data?: Record<string, any>;
  created_at: string;
}

export interface RealtimeStatus {
  table_name: string;
  is_realtime_enabled: boolean;
  publication_name: string;
}

export interface RealtimeChannelInfo {
  channel_name: string;
  table_name: string;
  description: string;
}

export interface RealtimePerformanceMetrics {
  metric_name: string;
  metric_value: number;
  description: string;
}

export interface RealtimeConfigSummary {
  setting_name: string;
  setting_value: string;
  description: string;
}

// ============================================================================
// REAL-TIME SUBSCRIPTION MANAGEMENT
// ============================================================================

/**
 * Subscribe to real-time changes for a specific table
 * @param tableName - The table to subscribe to
 * @param callback - Callback function to handle changes
 * @param filter - Optional filter for specific records
 * @returns RealtimeChannel - The subscription channel
 */
export function subscribeToTable(
  tableName: string,
  callback: (payload: RealtimePostgresChangesPayload<any>) => void,
  filter?: {
    event?: 'INSERT' | 'UPDATE' | 'DELETE';
    schema?: string;
    table?: string;
    filter?: string;
  }
): any {
  return supabase
    .channel(`table-${tableName}`)
    .on(
      'postgres_changes' as any,
      {
        event: filter?.event || '*',
        schema: filter?.schema || 'public',
        table: filter?.table || tableName,
        filter: filter?.filter,
      },
      callback
    )
    .subscribe();
}

/**
 * Subscribe to user-specific notifications
 * @param userId - The user ID to subscribe to notifications for
 * @param callback - Callback function to handle notification changes
 * @returns RealtimeChannel - The subscription channel
 */
export function subscribeToUserNotifications(
  userId: string,
  callback: (payload: RealtimePostgresChangesPayload<any>) => void
): any {
  return supabase
    .channel(`user-notifications-${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'community_notifications',
        filter: `user_id=eq.${userId}`,
      },
      callback
    )
    .subscribe();
}

/**
 * Subscribe to community prompt updates
 * @param promptId - The prompt ID to subscribe to (optional)
 * @param callback - Callback function to handle changes
 * @returns RealtimeChannel - The subscription channel
 */
export function subscribeToCommunityPrompts(
  promptId?: string,
  callback?: (payload: RealtimePostgresChangesPayload<any>) => void
): any {
  const channel = supabase.channel('community-prompts');

  if (promptId) {
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'community_prompts',
        filter: `id=eq.${promptId}`,
      },
      callback || (() => {})
    );
  } else {
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'community_prompts',
      },
      callback || (() => {})
    );
  }

  return channel.subscribe();
}

/**
 * Subscribe to community comments for a specific prompt
 * @param promptId - The prompt ID to subscribe to comments for
 * @param callback - Callback function to handle comment changes
 * @returns RealtimeChannel - The subscription channel
 */
export function subscribeToPromptComments(
  promptId: string,
  callback: (payload: RealtimePostgresChangesPayload<any>) => void
): any {
  return supabase
    .channel(`prompt-comments-${promptId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'community_comments',
        filter: `community_prompt_id=eq.${promptId}`,
      },
      callback
    )
    .subscribe();
}

/**
 * Subscribe to community ratings for a specific prompt
 * @param promptId - The prompt ID to subscribe to ratings for
 * @param callback - Callback function to handle rating changes
 * @returns RealtimeChannel - The subscription channel
 */
export function subscribeToPromptRatings(
  promptId: string,
  callback: (payload: RealtimePostgresChangesPayload<any>) => void
): any {
  return supabase
    .channel(`prompt-ratings-${promptId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'community_ratings',
        filter: `community_prompt_id=eq.${promptId}`,
      },
      callback
    )
    .subscribe();
}

/**
 * Subscribe to user quota updates
 * @param userId - The user ID to subscribe to quota updates for
 * @param callback - Callback function to handle quota changes
 * @returns RealtimeChannel - The subscription channel
 */
export function subscribeToUserQuotas(
  userId: string,
  callback: (payload: RealtimePostgresChangesPayload<any>) => void
): any {
  return supabase
    .channel(`user-quotas-${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'user_quotas',
        filter: `user_id=eq.${userId}`,
      },
      callback
    )
    .subscribe();
}

/**
 * Subscribe to subscription changes
 * @param userId - The user ID to subscribe to subscription changes for
 * @param callback - Callback function to handle subscription changes
 * @returns RealtimeChannel - The subscription channel
 */
export function subscribeToSubscriptions(
  userId: string,
  callback: (payload: RealtimePostgresChangesPayload<any>) => void
): any {
  return supabase
    .channel(`user-subscriptions-${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'subscriptions',
        filter: `user_id=eq.${userId}`,
      },
      callback
    )
    .subscribe();
}

// ============================================================================
// REAL-TIME UTILITY FUNCTIONS
// ============================================================================

/**
 * Unsubscribe from a real-time channel
 * @param channel - The channel to unsubscribe from
 * @returns Promise<boolean> - Success status
 */
export async function unsubscribeFromChannel(channel: any): Promise<boolean> {
  try {
    const result = await supabase.removeChannel(channel);
    return result === 'ok';
  } catch (error) {
    console.error('Error unsubscribing from channel:', error);
    return false;
  }
}

/**
 * Unsubscribe from all channels
 * @returns Promise<boolean> - Success status
 */
export async function unsubscribeFromAllChannels(): Promise<boolean> {
  try {
    const results = await supabase.removeAllChannels();
    return results.every(result => result === 'ok');
  } catch (error) {
    console.error('Error unsubscribing from all channels:', error);
    return false;
  }
}

/**
 * Get real-time subscription status for all tables
 * @returns Promise<RealtimeStatus[]> - Real-time status for all tables
 */
export async function getRealtimeStatus(): Promise<RealtimeStatus[]> {
  const { data, error } = await supabase.rpc('get_realtime_status');

  if (error) {
    console.error('Error getting real-time status:', error);
    return [];
  }

  return data || [];
}

/**
 * Enable real-time for a specific table
 * @param tableName - The table to enable real-time for
 * @returns Promise<boolean> - Success status
 */
export async function enableRealtimeForTable(
  tableName: string
): Promise<boolean> {
  const { data, error } = await supabase.rpc('enable_realtime_for_table', {
    table_name: tableName,
  });

  if (error) {
    console.error('Error enabling real-time for table:', error);
    return false;
  }

  return data || false;
}

/**
 * Disable real-time for a specific table
 * @param tableName - The table to disable real-time for
 * @returns Promise<boolean> - Success status
 */
export async function disableRealtimeForTable(
  tableName: string
): Promise<boolean> {
  const { data, error } = await supabase.rpc('disable_realtime_for_table', {
    table_name: tableName,
  });

  if (error) {
    console.error('Error disabling real-time for table:', error);
    return false;
  }

  return data || false;
}

// ============================================================================
// REAL-TIME EVENT LOGGING
// ============================================================================

/**
 * Log a real-time event
 * @param tableName - The table name
 * @param operation - The operation type
 * @param recordId - The record ID
 * @param userId - The user ID (optional)
 * @param eventData - Additional event data (optional)
 * @returns Promise<string | null> - Event ID or null
 */
export async function logRealtimeEvent(
  tableName: string,
  operation: 'INSERT' | 'UPDATE' | 'DELETE',
  recordId: string,
  userId?: string,
  eventData?: Record<string, any>
): Promise<string | null> {
  const { data, error } = await supabase.rpc('log_realtime_event', {
    p_table_name: tableName,
    p_operation: operation,
    p_record_id: recordId,
    p_user_id: userId,
    p_event_data: eventData,
  });

  if (error) {
    console.error('Error logging real-time event:', error);
    return null;
  }

  return data;
}

// ============================================================================
// REAL-TIME CHANNEL MANAGEMENT
// ============================================================================

/**
 * Get available real-time channels
 * @returns Promise<RealtimeChannel[]> - Available channels
 */
export async function getRealtimeChannels(): Promise<RealtimeChannelInfo[]> {
  const { data, error } = await supabase.rpc('get_realtime_channels');

  if (error) {
    console.error('Error getting real-time channels:', error);
    return [];
  }

  return data || [];
}

// ============================================================================
// REAL-TIME PERFORMANCE MONITORING
// ============================================================================

/**
 * Get real-time performance metrics
 * @returns Promise<RealtimePerformanceMetrics[]> - Performance metrics
 */
export async function getRealtimePerformanceMetrics(): Promise<
  RealtimePerformanceMetrics[]
> {
  const { data, error } = await supabase.rpc(
    'get_realtime_performance_metrics'
  );

  if (error) {
    console.error('Error getting real-time performance metrics:', error);
    return [];
  }

  return data || [];
}

/**
 * Get real-time configuration summary
 * @returns Promise<RealtimeConfigSummary[]> - Configuration summary
 */
export async function getRealtimeConfigSummary(): Promise<
  RealtimeConfigSummary[]
> {
  const { data, error } = await supabase.rpc('get_realtime_config_summary');

  if (error) {
    console.error('Error getting real-time config summary:', error);
    return [];
  }

  return data || [];
}

// ============================================================================
// REAL-TIME MAINTENANCE
// ============================================================================

/**
 * Clean up old real-time events
 * @param daysToKeep - Number of days to keep events (default: 30)
 * @returns Promise<number> - Number of deleted events
 */
export async function cleanupOldRealtimeEvents(
  daysToKeep: number = 30
): Promise<number> {
  const { data, error } = await supabase.rpc('cleanup_old_realtime_events', {
    days_to_keep: daysToKeep,
  });

  if (error) {
    console.error('Error cleaning up old real-time events:', error);
    return 0;
  }

  return data || 0;
}

// ============================================================================
// REAL-TIME HOOKS AND UTILITIES
// ============================================================================

/**
 * Create a real-time hook for React components
 * @param tableName - The table to subscribe to
 * @param filter - Optional filter
 * @returns Object with subscription and unsubscribe functions
 */
export function createRealtimeHook(
  tableName: string,
  filter?: {
    event?: 'INSERT' | 'UPDATE' | 'DELETE';
    schema?: string;
    table?: string;
    filter?: string;
  }
) {
  let channel: any = null;

  const subscribe = (
    callback: (payload: RealtimePostgresChangesPayload<any>) => void
  ) => {
    if (channel) {
      unsubscribeFromChannel(channel);
    }

    channel = subscribeToTable(tableName, callback, filter);
    return channel;
  };

  const unsubscribe = async () => {
    if (channel) {
      await unsubscribeFromChannel(channel);
      channel = null;
    }
  };

  return {
    subscribe,
    unsubscribe,
  };
}

/**
 * Create a user-specific real-time hook
 * @param userId - The user ID
 * @param tableName - The table to subscribe to
 * @returns Object with subscription and unsubscribe functions
 */
export function createUserRealtimeHook(userId: string, tableName: string) {
  let channel: any = null;

  const subscribe = (
    callback: (payload: RealtimePostgresChangesPayload<any>) => void
  ) => {
    if (channel) {
      unsubscribeFromChannel(channel);
    }

    channel = supabase
      .channel(`user-${tableName}-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: tableName,
          filter: `user_id=eq.${userId}`,
        },
        callback
      )
      .subscribe();

    return channel;
  };

  const unsubscribe = async () => {
    if (channel) {
      await unsubscribeFromChannel(channel);
      channel = null;
    }
  };

  return {
    subscribe,
    unsubscribe,
  };
}

// ============================================================================
// REAL-TIME EVENT HANDLERS
// ============================================================================

/**
 * Handle real-time notification events
 * @param payload - The real-time payload
 * @param onNewNotification - Callback for new notifications
 * @param onNotificationUpdate - Callback for notification updates
 */
export function handleNotificationEvents(
  payload: RealtimePostgresChangesPayload<any>,
  onNewNotification?: (notification: any) => void,
  onNotificationUpdate?: (notification: any) => void
) {
  switch (payload.eventType) {
    case 'INSERT':
      if (onNewNotification) {
        onNewNotification(payload.new);
      }
      break;
    case 'UPDATE':
      if (onNotificationUpdate) {
        onNotificationUpdate(payload.new);
      }
      break;
  }
}

/**
 * Handle real-time comment events
 * @param payload - The real-time payload
 * @param onNewComment - Callback for new comments
 * @param onCommentUpdate - Callback for comment updates
 * @param onCommentDelete - Callback for comment deletions
 */
export function handleCommentEvents(
  payload: RealtimePostgresChangesPayload<any>,
  onNewComment?: (comment: any) => void,
  onCommentUpdate?: (comment: any) => void,
  onCommentDelete?: (comment: any) => void
) {
  switch (payload.eventType) {
    case 'INSERT':
      if (onNewComment) {
        onNewComment(payload.new);
      }
      break;
    case 'UPDATE':
      if (onCommentUpdate) {
        onCommentUpdate(payload.new);
      }
      break;
    case 'DELETE':
      if (onCommentDelete) {
        onCommentDelete(payload.old);
      }
      break;
  }
}

/**
 * Handle real-time rating events
 * @param payload - The real-time payload
 * @param onNewRating - Callback for new ratings
 * @param onRatingUpdate - Callback for rating updates
 */
export function handleRatingEvents(
  payload: RealtimePostgresChangesPayload<any>,
  onNewRating?: (rating: any) => void,
  onRatingUpdate?: (rating: any) => void
) {
  switch (payload.eventType) {
    case 'INSERT':
      if (onNewRating) {
        onNewRating(payload.new);
      }
      break;
    case 'UPDATE':
      if (onRatingUpdate) {
        onRatingUpdate(payload.new);
      }
      break;
  }
}

// ============================================================================
// EXPORT TYPES
// ============================================================================

// Types are already exported above
