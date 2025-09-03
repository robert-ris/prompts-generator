# Database Performance Optimization Guide

This document provides a comprehensive overview of the database performance optimizations implemented to ensure optimal query performance and scalability.

## Overview

The performance optimization strategy focuses on:
- **Index Optimization**: Strategic placement of indexes for common query patterns
- **Query Optimization**: Optimized functions for complex operations
- **Monitoring**: Tools for tracking performance metrics
- **Maintenance**: Automated cleanup and statistics updates

## Index Strategy

### Index Types Implemented

#### 1. Single-Column Indexes
Basic indexes on frequently queried columns:
- Primary keys (automatically indexed)
- Foreign keys
- Frequently filtered columns
- Sort columns

#### 2. Composite Indexes
Multi-column indexes for common query patterns:
- User + date combinations
- Status + category combinations
- Rating + usage combinations

#### 3. Partial Indexes
Indexes that only include rows matching specific conditions:
- Active subscriptions only
- Public templates only
- High-rated content only
- Successful operations only

#### 4. Functional Indexes
Indexes on computed values:
- Full-text search vectors
- Date truncations
- JSONB path expressions

#### 5. GIN Indexes
Generalized Inverted Indexes for:
- Array columns (tags)
- JSONB columns (variables, metadata)
- Full-text search vectors

## Table-Specific Optimizations

### Profiles Table

**Indexes Added**:
- `idx_profiles_subscription_status` - Filter by subscription status
- `idx_profiles_stripe_customer_id` - Stripe customer lookups
- `idx_profiles_updated_at` - Recent updates
- `idx_profiles_full_name` - Name search
- `idx_profiles_location` - Location filtering
- `idx_profiles_name_search` - Full-text search on name and bio
- `idx_profiles_tier_status` - Composite: tier + status
- `idx_profiles_email_tier` - Composite: email + tier
- `idx_profiles_pro_tier` - Partial: pro users only
- `idx_profiles_active_status` - Partial: active users only

**Use Cases**:
- User search by name or location
- Subscription status filtering
- Pro user analytics
- Recent profile updates

### Prompt Templates Table

**Indexes Added**:
- `idx_prompt_templates_updated_at` - Recent updates
- `idx_prompt_templates_title` - Title search
- `idx_prompt_templates_rating_count` - Rating count sorting
- `idx_prompt_templates_user_created` - User's templates by date
- `idx_prompt_templates_public_featured` - Public featured templates
- `idx_prompt_templates_category_rating` - Category + rating sorting
- `idx_prompt_templates_usage_rating` - Usage + rating sorting
- `idx_prompt_templates_user_category` - User + category
- `idx_prompt_templates_public_category` - Public + category
- `idx_prompt_templates_featured_rating` - Featured + rating
- `idx_prompt_templates_public_only` - Partial: public templates
- `idx_prompt_templates_featured_only` - Partial: featured templates
- `idx_prompt_templates_high_rated` - Partial: high-rated templates
- `idx_prompt_templates_variables_gin` - JSONB variables search

**Use Cases**:
- Template search and filtering
- Trending templates
- User's template management
- Category-based browsing
- Featured content display

### AI Usage Logs Table

**Indexes Added**:
- `idx_ai_usage_logs_user_created` - User's usage by date
- `idx_ai_usage_logs_provider_model` - Provider + model combinations
- `idx_ai_usage_logs_success_created` - Successful operations
- `idx_ai_usage_logs_cost_range` - Cost analysis
- `idx_ai_usage_logs_response_time` - Performance analysis
- `idx_ai_usage_logs_user_operation` - User + operation type
- `idx_ai_usage_logs_provider_success` - Provider + success rate
- `idx_ai_usage_logs_template_operation` - Template + operation
- `idx_ai_usage_logs_successful_ops` - Partial: successful operations
- `idx_ai_usage_logs_expensive_ops` - Partial: expensive operations
- `idx_ai_usage_logs_date_trunc` - Daily aggregation

**Use Cases**:
- Usage analytics
- Cost tracking
- Performance monitoring
- Error analysis
- Quota enforcement

### Community Tables

#### Community Prompts
**Indexes Added**:
- `idx_community_prompts_approval_created` - Approval + date
- `idx_community_prompts_featured_rating` - Featured + rating
- `idx_community_prompts_category_rating` - Category + rating
- `idx_community_prompts_view_save_rating` - Popularity metrics
- `idx_community_prompts_user_approved` - User + approval status
- `idx_community_prompts_title_search` - Title search
- `idx_community_prompts_content_search` - Content search
- `idx_community_prompts_description_search` - Description search
- `idx_community_prompts_approved_category` - Approved + category
- `idx_community_prompts_featured_category` - Featured + category
- `idx_community_prompts_user_approval` - User + approval + date
- `idx_community_prompts_approved_only` - Partial: approved only
- `idx_community_prompts_featured_only` - Partial: featured only
- `idx_community_prompts_popular` - Partial: popular content
- `idx_community_prompts_variables_gin` - JSONB variables search
- `idx_community_prompts_created_date` - Daily aggregation

#### Community Interactions
**Indexes Added**:
- `idx_community_saves_prompt_user` - Save lookups
- `idx_community_saves_user_created` - User's saves
- `idx_community_ratings_prompt_rating` - Rating sorting
- `idx_community_ratings_user_created` - User's ratings
- `idx_community_ratings_helpful` - Helpful ratings
- `idx_community_ratings_rating_range` - High ratings
- `idx_community_comments_prompt_created` - Comments by prompt
- `idx_community_comments_parent_created` - Nested comments
- `idx_community_comments_user_created` - User's comments
- `idx_community_comments_votes` - Vote sorting
- `idx_community_comments_flagged` - Flagged comments
- `idx_community_comments_content_search` - Comment search
- `idx_community_follows_following_created` - Following relationships
- `idx_community_follows_follower_created` - Follower relationships
- `idx_community_notifications_user_type` - User notifications by type
- `idx_community_notifications_user_read` - Unread notifications
- `idx_community_notifications_related` - Related content
- `idx_community_notifications_type_created` - Notifications by type

## Performance Monitoring Functions

### Index Usage Analysis

```sql
-- Analyze which indexes are being used
SELECT * FROM analyze_index_usage();
```

**Returns**:
- `schemaname`: Schema name
- `tablename`: Table name
- `indexname`: Index name
- `idx_scan`: Number of index scans
- `idx_tup_read`: Number of tuples read
- `idx_tup_fetch`: Number of tuples fetched

### Table Statistics

```sql
-- Get table size and row count information
SELECT * FROM get_table_stats();
```

**Returns**:
- `tablename`: Table name
- `table_size`: Table size (formatted)
- `index_size`: Index size (formatted)
- `total_size`: Total size (formatted)
- `row_count`: Estimated row count

### Slow Query Analysis

```sql
-- Get slowest queries (requires pg_stat_statements extension)
SELECT * FROM get_slow_queries(10);
```

**Returns**:
- `query`: SQL query text
- `calls`: Number of calls
- `total_time`: Total execution time
- `mean_time`: Average execution time
- `rows`: Number of rows returned

## Query Optimization Functions

### Trending Prompts

```sql
-- Get trending prompts with optimized scoring
SELECT * FROM get_trending_prompts_optimized(7, 20);
```

**Features**:
- Optimized trend score calculation
- Efficient date filtering
- Public templates only
- Configurable time window and limit

### User Activity Summary

```sql
-- Get comprehensive user activity summary
SELECT * FROM get_user_activity_summary('user-uuid');
```

**Returns**:
- `total_templates`: Number of templates created
- `total_usage`: Number of AI operations
- `total_cost_cents`: Total cost in cents
- `last_activity`: Last activity timestamp
- `subscription_status`: Current subscription status

## Maintenance Functions

### Statistics Update

```sql
-- Update table statistics for better query planning
SELECT update_table_statistics();
```

**Purpose**:
- Updates table statistics for all tables
- Improves query planner decisions
- Should be run periodically (weekly/monthly)

### Data Cleanup

```sql
-- Clean up old data
SELECT * FROM cleanup_old_data(365);
```

**Cleanup Strategy**:
- AI usage logs: 1 year retention
- Billing events: 2 years retention
- Notifications: 6 months retention
- Configurable retention period

## Performance Configuration

### Recommended Settings

The migration includes commented configuration settings that should be adjusted based on your server capacity:

```sql
-- Memory settings (adjust based on server RAM)
-- ALTER SYSTEM SET work_mem = '256MB';
-- ALTER SYSTEM SET shared_buffers = '256MB';
-- ALTER SYSTEM SET effective_cache_size = '1GB';

-- Parallel query settings
-- ALTER SYSTEM SET max_parallel_workers_per_gather = 2;
-- ALTER SYSTEM SET max_parallel_workers = 4;
```

### Configuration Guidelines

#### Memory Settings
- `work_mem`: Memory for sort operations (256MB-1GB)
- `shared_buffers`: Cache size (25% of RAM)
- `effective_cache_size`: Estimated OS cache (75% of RAM)

#### Parallel Settings
- `max_parallel_workers_per_gather`: Workers per query (2-4)
- `max_parallel_workers`: Total parallel workers (4-8)

## Performance Best Practices

### 1. Index Maintenance
- Monitor index usage regularly
- Drop unused indexes
- Rebuild fragmented indexes
- Update statistics periodically

### 2. Query Optimization
- Use EXPLAIN ANALYZE for slow queries
- Avoid SELECT * when possible
- Use LIMIT for large result sets
- Leverage partial indexes for filtered queries

### 3. Data Management
- Implement data retention policies
- Archive old data to separate tables
- Use partitioning for large tables
- Regular VACUUM and ANALYZE

### 4. Monitoring
- Track query performance over time
- Monitor index usage patterns
- Alert on slow queries
- Regular performance reviews

## Common Query Patterns

### User Dashboard Queries
```sql
-- User's recent templates
SELECT * FROM prompt_templates 
WHERE user_id = $1 
ORDER BY created_at DESC 
LIMIT 10;

-- User's usage summary
SELECT * FROM get_user_activity_summary($1);
```

### Community Content Queries
```sql
-- Trending community prompts
SELECT * FROM get_trending_community_prompts(7, 20);

-- User's saved prompts
SELECT * FROM community_saves 
WHERE user_id = $1 
ORDER BY created_at DESC;
```

### Analytics Queries
```sql
-- Popular templates by category
SELECT category, COUNT(*), AVG(rating_average) 
FROM prompt_templates 
WHERE is_public = true 
GROUP BY category;

-- Usage by provider
SELECT provider, COUNT(*), SUM(cost_cents) 
FROM ai_usage_logs 
WHERE created_at >= NOW() - INTERVAL '30 days' 
GROUP BY provider;
```

## Troubleshooting

### Common Performance Issues

#### 1. Slow Queries
- Check if appropriate indexes exist
- Analyze query execution plan
- Consider query optimization
- Monitor for table bloat

#### 2. High Memory Usage
- Adjust work_mem setting
- Optimize sort operations
- Use LIMIT clauses
- Consider query pagination

#### 3. Index Bloat
- Rebuild fragmented indexes
- Drop unused indexes
- Monitor index size growth
- Regular maintenance

### Performance Monitoring

#### Key Metrics to Track
- Query execution time
- Index hit ratio
- Table and index sizes
- Memory usage
- Connection count

#### Alerting Thresholds
- Queries > 1 second
- Index hit ratio < 95%
- Table size growth > 50%
- Memory usage > 80%

## Future Optimizations

### Planned Improvements
1. **Query Result Caching**: Implement application-level caching
2. **Read Replicas**: Add read replicas for analytics
3. **Table Partitioning**: Partition large tables by date
4. **Materialized Views**: Pre-compute common aggregations
5. **Connection Pooling**: Optimize connection management

### Advanced Features
1. **Query Plan Analysis**: Automated query plan optimization
2. **Performance Regression Testing**: Automated performance testing
3. **Dynamic Indexing**: Automatic index creation based on usage
4. **Predictive Maintenance**: ML-based performance optimization

## Conclusion

This performance optimization implementation provides a solid foundation for scalable database operations. The comprehensive indexing strategy, monitoring tools, and maintenance functions ensure optimal performance while maintaining flexibility for future growth.

Regular monitoring and maintenance will help maintain performance as the application scales and usage patterns evolve.
