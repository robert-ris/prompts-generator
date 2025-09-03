import { useEffect, useRef, useState, useCallback } from 'react';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import {
  subscribeToTable,
  subscribeToUserNotifications,
  subscribeToCommunityPrompts,
  subscribeToPromptComments,
  subscribeToPromptRatings,
  subscribeToUserQuotas,
  subscribeToSubscriptions,
  unsubscribeFromChannel,
  unsubscribeFromAllChannels,
  handleNotificationEvents,
  handleCommentEvents,
  handleRatingEvents,
} from '@/lib/supabase/realtime-utils';

// ============================================================================
// BASE REAL-TIME HOOK
// ============================================================================

/**
 * Base hook for real-time subscriptions
 * @param tableName - The table to subscribe to
 * @param filter - Optional filter for specific records
 * @param onData - Callback for data changes
 * @returns Object with subscription status and unsubscribe function
 */
export function useRealtimeSubscription<T extends Record<string, any> = any>(
  tableName: string,
  filter?: {
    event?: 'INSERT' | 'UPDATE' | 'DELETE';
    schema?: string;
    table?: string;
    filter?: string;
  },
  onData?: (payload: RealtimePostgresChangesPayload<T>) => void
) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<any>(null);

  const subscribe = useCallback(() => {
    try {
      if (channelRef.current) {
        unsubscribeFromChannel(channelRef.current);
      }

      channelRef.current = subscribeToTable(
        tableName,
        payload => {
          setIsConnected(true);
          setError(null);
          onData?.(payload);
        },
        filter
      );

      setIsConnected(true);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to subscribe');
      setIsConnected(false);
    }
  }, [tableName, filter, onData]);

  const unsubscribe = useCallback(async () => {
    if (channelRef.current) {
      await unsubscribeFromChannel(channelRef.current);
      channelRef.current = null;
      setIsConnected(false);
    }
  }, []);

  useEffect(() => {
    subscribe();
    return () => {
      unsubscribe();
    };
  }, [subscribe, unsubscribe]);

  return {
    isConnected,
    error,
    unsubscribe,
    subscribe,
  };
}

// ============================================================================
// USER-SPECIFIC REAL-TIME HOOKS
// ============================================================================

/**
 * Hook for user notifications
 * @param userId - The user ID
 * @param onNewNotification - Callback for new notifications
 * @param onNotificationUpdate - Callback for notification updates
 * @returns Object with subscription status and unsubscribe function
 */
export function useUserNotifications(
  userId: string,
  onNewNotification?: (notification: any) => void,
  onNotificationUpdate?: (notification: any) => void
) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<any>(null);

  const subscribe = useCallback(() => {
    try {
      if (channelRef.current) {
        unsubscribeFromChannel(channelRef.current);
      }

      channelRef.current = subscribeToUserNotifications(userId, payload => {
        setIsConnected(true);
        setError(null);
        handleNotificationEvents(
          payload,
          onNewNotification,
          onNotificationUpdate
        );
      });

      setIsConnected(true);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to subscribe to notifications'
      );
      setIsConnected(false);
    }
  }, [userId, onNewNotification, onNotificationUpdate]);

  const unsubscribe = useCallback(async () => {
    if (channelRef.current) {
      await unsubscribeFromChannel(channelRef.current);
      channelRef.current = null;
      setIsConnected(false);
    }
  }, []);

  useEffect(() => {
    if (userId) {
      subscribe();
    }
    return () => {
      unsubscribe();
    };
  }, [userId, subscribe, unsubscribe]);

  return {
    isConnected,
    error,
    unsubscribe,
    subscribe,
  };
}

/**
 * Hook for user quotas
 * @param userId - The user ID
 * @param onQuotaUpdate - Callback for quota updates
 * @returns Object with subscription status and unsubscribe function
 */
export function useUserQuotas(
  userId: string,
  onQuotaUpdate?: (quota: any) => void
) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<any>(null);

  const subscribe = useCallback(() => {
    try {
      if (channelRef.current) {
        unsubscribeFromChannel(channelRef.current);
      }

      channelRef.current = subscribeToUserQuotas(userId, payload => {
        setIsConnected(true);
        setError(null);
        onQuotaUpdate?.(payload.new);
      });

      setIsConnected(true);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to subscribe to quotas'
      );
      setIsConnected(false);
    }
  }, [userId, onQuotaUpdate]);

  const unsubscribe = useCallback(async () => {
    if (channelRef.current) {
      await unsubscribeFromChannel(channelRef.current);
      channelRef.current = null;
      setIsConnected(false);
    }
  }, []);

  useEffect(() => {
    if (userId) {
      subscribe();
    }
    return () => {
      unsubscribe();
    };
  }, [userId, subscribe, unsubscribe]);

  return {
    isConnected,
    error,
    unsubscribe,
    subscribe,
  };
}

/**
 * Hook for user subscriptions
 * @param userId - The user ID
 * @param onSubscriptionUpdate - Callback for subscription updates
 * @returns Object with subscription status and unsubscribe function
 */
export function useUserSubscriptions(
  userId: string,
  onSubscriptionUpdate?: (subscription: any) => void
) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<any>(null);

  const subscribe = useCallback(() => {
    try {
      if (channelRef.current) {
        unsubscribeFromChannel(channelRef.current);
      }

      channelRef.current = subscribeToSubscriptions(userId, payload => {
        setIsConnected(true);
        setError(null);
        onSubscriptionUpdate?.(payload.new);
      });

      setIsConnected(true);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to subscribe to subscriptions'
      );
      setIsConnected(false);
    }
  }, [userId, onSubscriptionUpdate]);

  const unsubscribe = useCallback(async () => {
    if (channelRef.current) {
      await unsubscribeFromChannel(channelRef.current);
      channelRef.current = null;
      setIsConnected(false);
    }
  }, []);

  useEffect(() => {
    if (userId) {
      subscribe();
    }
    return () => {
      unsubscribe();
    };
  }, [userId, subscribe, unsubscribe]);

  return {
    isConnected,
    error,
    unsubscribe,
    subscribe,
  };
}

// ============================================================================
// COMMUNITY REAL-TIME HOOKS
// ============================================================================

/**
 * Hook for community prompts
 * @param promptId - Optional prompt ID to subscribe to specific prompt
 * @param onPromptUpdate - Callback for prompt updates
 * @returns Object with subscription status and unsubscribe function
 */
export function useCommunityPrompts(
  promptId?: string,
  onPromptUpdate?: (prompt: any) => void
) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<any>(null);

  const subscribe = useCallback(() => {
    try {
      if (channelRef.current) {
        unsubscribeFromChannel(channelRef.current);
      }

      channelRef.current = subscribeToCommunityPrompts(promptId, payload => {
        setIsConnected(true);
        setError(null);
        onPromptUpdate?.(payload.new);
      });

      setIsConnected(true);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to subscribe to community prompts'
      );
      setIsConnected(false);
    }
  }, [promptId, onPromptUpdate]);

  const unsubscribe = useCallback(async () => {
    if (channelRef.current) {
      await unsubscribeFromChannel(channelRef.current);
      channelRef.current = null;
      setIsConnected(false);
    }
  }, []);

  useEffect(() => {
    subscribe();
    return () => {
      unsubscribe();
    };
  }, [subscribe, unsubscribe]);

  return {
    isConnected,
    error,
    unsubscribe,
    subscribe,
  };
}

/**
 * Hook for prompt comments
 * @param promptId - The prompt ID
 * @param onNewComment - Callback for new comments
 * @param onCommentUpdate - Callback for comment updates
 * @param onCommentDelete - Callback for comment deletions
 * @returns Object with subscription status and unsubscribe function
 */
export function usePromptComments(
  promptId: string,
  onNewComment?: (comment: any) => void,
  onCommentUpdate?: (comment: any) => void,
  onCommentDelete?: (comment: any) => void
) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<any>(null);

  const subscribe = useCallback(() => {
    try {
      if (channelRef.current) {
        unsubscribeFromChannel(channelRef.current);
      }

      channelRef.current = subscribeToPromptComments(promptId, payload => {
        setIsConnected(true);
        setError(null);
        handleCommentEvents(
          payload,
          onNewComment,
          onCommentUpdate,
          onCommentDelete
        );
      });

      setIsConnected(true);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to subscribe to comments'
      );
      setIsConnected(false);
    }
  }, [promptId, onNewComment, onCommentUpdate, onCommentDelete]);

  const unsubscribe = useCallback(async () => {
    if (channelRef.current) {
      await unsubscribeFromChannel(channelRef.current);
      channelRef.current = null;
      setIsConnected(false);
    }
  }, []);

  useEffect(() => {
    if (promptId) {
      subscribe();
    }
    return () => {
      unsubscribe();
    };
  }, [promptId, subscribe, unsubscribe]);

  return {
    isConnected,
    error,
    unsubscribe,
    subscribe,
  };
}

/**
 * Hook for prompt ratings
 * @param promptId - The prompt ID
 * @param onNewRating - Callback for new ratings
 * @param onRatingUpdate - Callback for rating updates
 * @returns Object with subscription status and unsubscribe function
 */
export function usePromptRatings(
  promptId: string,
  onNewRating?: (rating: any) => void,
  onRatingUpdate?: (rating: any) => void
) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<any>(null);

  const subscribe = useCallback(() => {
    try {
      if (channelRef.current) {
        unsubscribeFromChannel(channelRef.current);
      }

      channelRef.current = subscribeToPromptRatings(promptId, payload => {
        setIsConnected(true);
        setError(null);
        handleRatingEvents(payload, onNewRating, onRatingUpdate);
      });

      setIsConnected(true);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to subscribe to ratings'
      );
      setIsConnected(false);
    }
  }, [promptId, onNewRating, onRatingUpdate]);

  const unsubscribe = useCallback(async () => {
    if (channelRef.current) {
      await unsubscribeFromChannel(channelRef.current);
      channelRef.current = null;
      setIsConnected(false);
    }
  }, []);

  useEffect(() => {
    if (promptId) {
      subscribe();
    }
    return () => {
      unsubscribe();
    };
  }, [promptId, subscribe, unsubscribe]);

  return {
    isConnected,
    error,
    unsubscribe,
    subscribe,
  };
}

// ============================================================================
// MULTIPLE SUBSCRIPTION HOOK
// ============================================================================

/**
 * Hook for managing multiple real-time subscriptions
 * @returns Object with subscription management functions
 */
export function useMultipleSubscriptions() {
  const channelsRef = useRef<Map<string, any>>(new Map());

  const addSubscription = useCallback(
    (
      key: string,
      tableName: string,
      filter?: {
        event?: 'INSERT' | 'UPDATE' | 'DELETE';
        schema?: string;
        table?: string;
        filter?: string;
      },
      onData?: (payload: RealtimePostgresChangesPayload<any>) => void
    ) => {
      try {
        // Remove existing subscription if it exists
        removeSubscription(key);

        const channel = subscribeToTable(
          tableName,
          payload => {
            onData?.(payload);
          },
          filter
        );

        channelsRef.current.set(key, channel);
        return true;
      } catch (error) {
        console.error(`Failed to add subscription for key: ${key}`, error);
        return false;
      }
    },
    []
  );

  const removeSubscription = useCallback(async (key: string) => {
    const channel = channelsRef.current.get(key);
    if (channel) {
      await unsubscribeFromChannel(channel);
      channelsRef.current.delete(key);
    }
  }, []);

  const removeAllSubscriptions = useCallback(async () => {
    await unsubscribeFromAllChannels();
    channelsRef.current.clear();
  }, []);

  const getSubscriptionCount = useCallback(() => {
    return channelsRef.current.size;
  }, []);

  const hasSubscription = useCallback((key: string) => {
    return channelsRef.current.has(key);
  }, []);

  useEffect(() => {
    return () => {
      removeAllSubscriptions();
    };
  }, [removeAllSubscriptions]);

  return {
    addSubscription,
    removeSubscription,
    removeAllSubscriptions,
    getSubscriptionCount,
    hasSubscription,
  };
}

// ============================================================================
// REAL-TIME STATUS HOOK
// ============================================================================

/**
 * Hook for monitoring real-time connection status
 * @returns Object with connection status and management functions
 */
export function useRealtimeStatus() {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionCount, setConnectionCount] = useState(0);
  const [lastActivity, setLastActivity] = useState<Date | null>(null);

  const updateStatus = useCallback((connected: boolean) => {
    setIsConnected(connected);
    if (connected) {
      setConnectionCount(prev => prev + 1);
      setLastActivity(new Date());
    }
  }, []);

  const resetStatus = useCallback(() => {
    setIsConnected(false);
    setConnectionCount(0);
    setLastActivity(null);
  }, []);

  return {
    isConnected,
    connectionCount,
    lastActivity,
    updateStatus,
    resetStatus,
  };
}
