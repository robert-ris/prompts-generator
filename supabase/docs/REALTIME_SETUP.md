# Real-time Subscriptions Setup Guide

This document provides a comprehensive overview of the real-time subscriptions implementation for live data updates across the application.

## Overview

The real-time implementation provides:

- **Live Data Updates**: Real-time synchronization across all tables
- **User-Specific Subscriptions**: Personalized real-time notifications and updates
- **Community Features**: Live comments, ratings, and interactions
- **Performance Monitoring**: Tools for tracking real-time performance
- **Event Logging**: Comprehensive audit trail of real-time events

## Real-time Architecture

### Database Level

- **PostgreSQL Replication**: Uses Supabase's built-in real-time replication
- **Publication Management**: All tables added to `supabase_realtime` publication
- **Event Logging**: Custom `realtime_events` table for audit trail
- **Triggers**: Automatic event logging for community interactions

### Application Level

- **TypeScript Utilities**: Comprehensive real-time management functions
- **React Hooks**: Easy-to-use hooks for real-time subscriptions
- **Event Handlers**: Specialized handlers for different event types
- **Connection Management**: Automatic subscription lifecycle management

## Enabled Tables

All application tables have real-time enabled:

### Core Tables

- `profiles` - User profile updates
- `prompt_templates` - Template changes and updates
- `ai_usage_logs` - Usage tracking and analytics
- `user_quotas` - Quota updates and limits
- `ai_provider_configs` - Provider configuration changes

### Subscription Tables

- `subscriptions` - Subscription status changes
- `subscription_plans` - Plan updates and pricing changes
- `feature_entitlements` - Feature access updates
- `billing_events` - Billing and payment events

### Community Tables

- `community_prompts` - Community prompt updates
- `community_saves` - Save/unsave actions
- `community_ratings` - Rating and review updates
- `community_comments` - Comment interactions
- `community_follows` - Follow/unfollow events
- `community_notifications` - User notifications

### System Tables

- `realtime_events` - Real-time event audit trail

## Real-time Functions

### Database Functions

#### Configuration Management

```sql
-- Get real-time status for all tables
SELECT * FROM get_realtime_status();

-- Enable real-time for a specific table
SELECT enable_realtime_for_table('table_name');

-- Disable real-time for a specific table
SELECT disable_realtime_for_table('table_name');
```

#### Event Logging

```sql
-- Log a real-time event
SELECT log_realtime_event(
  'table_name',
  'INSERT',
  'record_id',
  'user_id',
  '{"key": "value"}'::jsonb
);
```

#### Performance Monitoring

```sql
-- Get real-time performance metrics
SELECT * FROM get_realtime_performance_metrics();

-- Get real-time configuration summary
SELECT * FROM get_realtime_config_summary();

-- Get available channels
SELECT * FROM get_realtime_channels();
```

#### Maintenance

```sql
-- Clean up old real-time events
SELECT cleanup_old_realtime_events(30);
```

### TypeScript Utilities

#### Basic Subscription

```typescript
import { subscribeToTable } from '@/lib/supabase/realtime-utils';

const channel = subscribeToTable('profiles', payload => {
  console.log('Profile updated:', payload.new);
});
```

#### User-Specific Subscriptions

```typescript
import { subscribeToUserNotifications } from '@/lib/supabase/realtime-utils';

const channel = subscribeToUserNotifications(userId, payload => {
  console.log('New notification:', payload.new);
});
```

#### Community Subscriptions

```typescript
import { subscribeToPromptComments } from '@/lib/supabase/realtime-utils';

const channel = subscribeToPromptComments(promptId, payload => {
  console.log('New comment:', payload.new);
});
```

## React Hooks

### Basic Real-time Hook

```typescript
import { useRealtimeSubscription } from '@/hooks/useRealtime';

function MyComponent() {
  const { isConnected, error } = useRealtimeSubscription(
    'profiles',
    { event: 'UPDATE' },
    (payload) => {
      console.log('Profile updated:', payload.new);
    }
  );

  return (
    <div>
      {isConnected ? 'Connected' : 'Disconnected'}
      {error && <div>Error: {error}</div>}
    </div>
  );
}
```

### User Notifications Hook

```typescript
import { useUserNotifications } from '@/hooks/useRealtime';

function NotificationsComponent({ userId }: { userId: string }) {
  const { isConnected } = useUserNotifications(
    userId,
    (notification) => {
      // Handle new notification
      showToast(notification.title);
    },
    (notification) => {
      // Handle notification update
      updateNotificationList(notification);
    }
  );

  return (
    <div>
      {isConnected ? 'Notifications active' : 'Notifications inactive'}
    </div>
  );
}
```

### Community Interactions Hook

```typescript
import { usePromptComments } from '@/hooks/useRealtime';

function CommentsComponent({ promptId }: { promptId: string }) {
  const { isConnected } = usePromptComments(
    promptId,
    (comment) => {
      // Handle new comment
      addCommentToList(comment);
    },
    (comment) => {
      // Handle comment update
      updateCommentInList(comment);
    },
    (comment) => {
      // Handle comment deletion
      removeCommentFromList(comment.id);
    }
  );

  return (
    <div>
      {isConnected ? 'Comments live' : 'Comments offline'}
    </div>
  );
}
```

### Multiple Subscriptions Hook

```typescript
import { useMultipleSubscriptions } from '@/hooks/useRealtime';

function DashboardComponent() {
  const { addSubscription, removeSubscription, getSubscriptionCount } =
    useMultipleSubscriptions();

  useEffect(() => {
    // Add multiple subscriptions
    addSubscription('profiles', 'profiles', { event: 'UPDATE' });
    addSubscription('notifications', 'community_notifications');
    addSubscription('quota', 'user_quotas');

    return () => {
      // Cleanup handled automatically
    };
  }, []);

  return (
    <div>
      Active subscriptions: {getSubscriptionCount()}
    </div>
  );
}
```

## Event Types and Handlers

### Notification Events

```typescript
import { handleNotificationEvents } from '@/lib/supabase/realtime-utils';

handleNotificationEvents(
  payload,
  notification => {
    // New notification
    showNotificationToast(notification);
  },
  notification => {
    // Updated notification
    updateNotificationBadge(notification);
  }
);
```

### Comment Events

```typescript
import { handleCommentEvents } from '@/lib/supabase/realtime-utils';

handleCommentEvents(
  payload,
  comment => {
    // New comment
    addCommentToUI(comment);
  },
  comment => {
    // Updated comment
    updateCommentInUI(comment);
  },
  comment => {
    // Deleted comment
    removeCommentFromUI(comment.id);
  }
);
```

### Rating Events

```typescript
import { handleRatingEvents } from '@/lib/supabase/realtime-utils';

handleRatingEvents(
  payload,
  rating => {
    // New rating
    updateAverageRating(rating);
  },
  rating => {
    // Updated rating
    updateRatingDisplay(rating);
  }
);
```

## Performance Considerations

### Subscription Limits

- **Per User**: Maximum 10 concurrent subscriptions
- **Per Table**: Maximum 100 concurrent subscriptions
- **Total**: Maximum 1000 concurrent subscriptions

### Event Filtering

```typescript
// Subscribe only to INSERT events
subscribeToTable('profiles', callback, { event: 'INSERT' });

// Subscribe to specific user's data
subscribeToTable('profiles', callback, {
  filter: `user_id=eq.${userId}`,
});

// Subscribe to specific record
subscribeToTable('prompt_templates', callback, {
  filter: `id=eq.${templateId}`,
});
```

### Connection Management

```typescript
// Automatic cleanup on component unmount
useEffect(() => {
  const channel = subscribeToTable('profiles', callback);

  return () => {
    unsubscribeFromChannel(channel);
  };
}, []);

// Manual cleanup
const { unsubscribe } = useRealtimeSubscription('profiles', callback);

// Cleanup all subscriptions
await unsubscribeFromAllChannels();
```

## Monitoring and Debugging

### Real-time Status

```typescript
import { getRealtimeStatus } from '@/lib/supabase/realtime-utils';

const status = await getRealtimeStatus();
console.log('Real-time status:', status);
```

### Performance Metrics

```typescript
import { getRealtimePerformanceMetrics } from '@/lib/supabase/realtime-utils';

const metrics = await getRealtimePerformanceMetrics();
console.log('Performance metrics:', metrics);
```

### Event Logging

```typescript
import { logRealtimeEvent } from '@/lib/supabase/realtime-utils';

await logRealtimeEvent('profiles', 'UPDATE', 'user-id', 'user-id', {
  field: 'email',
  old_value: 'old@email.com',
  new_value: 'new@email.com',
});
```

## Best Practices

### 1. Subscription Management

- Always unsubscribe when components unmount
- Use React hooks for automatic lifecycle management
- Limit the number of concurrent subscriptions
- Filter subscriptions to specific data when possible

### 2. Event Handling

- Handle errors gracefully
- Implement retry logic for failed connections
- Use debouncing for frequent updates
- Cache data to reduce unnecessary re-renders

### 3. Performance Optimization

- Use specific event filters (INSERT, UPDATE, DELETE)
- Subscribe only to necessary data
- Implement connection pooling for multiple subscriptions
- Monitor subscription count and performance metrics

### 4. Error Handling

```typescript
const { isConnected, error } = useRealtimeSubscription('profiles', callback);

if (error) {
  console.error('Real-time error:', error);
  // Implement fallback or retry logic
}

if (!isConnected) {
  // Show offline indicator or implement reconnection
}
```

## Common Use Cases

### 1. Live Notifications

```typescript
function NotificationCenter({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState([]);

  useUserNotifications(userId,
    (notification) => {
      setNotifications(prev => [notification, ...prev]);
      showToast(notification.title);
    }
  );

  return (
    <div>
      {notifications.map(notification => (
        <NotificationItem key={notification.id} notification={notification} />
      ))}
    </div>
  );
}
```

### 2. Live Comments

```typescript
function CommentsSection({ promptId }: { promptId: string }) {
  const [comments, setComments] = useState([]);

  usePromptComments(promptId,
    (comment) => {
      setComments(prev => [...prev, comment]);
    },
    (comment) => {
      setComments(prev =>
        prev.map(c => c.id === comment.id ? comment : c)
      );
    },
    (comment) => {
      setComments(prev =>
        prev.filter(c => c.id !== comment.id)
      );
    }
  );

  return (
    <div>
      {comments.map(comment => (
        <CommentItem key={comment.id} comment={comment} />
      ))}
    </div>
  );
}
```

### 3. Live Quota Updates

```typescript
function QuotaDisplay({ userId }: { userId: string }) {
  const [quota, setQuota] = useState(null);

  useUserQuotas(userId, (quotaUpdate) => {
    setQuota(quotaUpdate);
    if (quotaUpdate.ai_improve_calls_used >= quotaUpdate.ai_improve_calls_limit) {
      showQuotaExceededWarning();
    }
  });

  return (
    <div>
      {quota && (
        <div>
          AI Calls: {quota.ai_improve_calls_used} / {quota.ai_improve_calls_limit}
        </div>
      )}
    </div>
  );
}
```

## Troubleshooting

### Common Issues

#### 1. Connection Failures

- Check network connectivity
- Verify Supabase configuration
- Check subscription limits
- Review error logs

#### 2. Missing Updates

- Verify table is enabled for real-time
- Check subscription filters
- Ensure proper event handling
- Review RLS policies

#### 3. Performance Issues

- Reduce subscription count
- Implement event filtering
- Use connection pooling
- Monitor performance metrics

### Debug Tools

```typescript
// Enable debug logging
import { supabase } from '@/lib/supabase/client';
supabase.realtime.setDebug(true);

// Check connection status
const { data, error } = await supabase.realtime.getChannels();
console.log('Active channels:', data);
```

## Future Enhancements

### Planned Features

1. **Connection Pooling**: Optimize multiple subscriptions
2. **Event Batching**: Batch multiple events for efficiency
3. **Offline Support**: Queue events when offline
4. **Advanced Filtering**: Complex subscription filters
5. **Performance Analytics**: Detailed performance monitoring

### Advanced Patterns

1. **Event Sourcing**: Complete audit trail of all changes
2. **CQRS**: Separate read and write models
3. **Event-Driven Architecture**: Decoupled event handling
4. **Real-time Analytics**: Live dashboard updates

## Conclusion

This real-time implementation provides a robust foundation for live data updates across the application. The comprehensive set of utilities, hooks, and monitoring tools ensures optimal performance and user experience while maintaining scalability and reliability.

Regular monitoring and maintenance will help maintain real-time performance as the application scales and usage patterns evolve.
