import { supabase } from './client';

// ============================================================================
// PERFORMANCE MONITORING TYPES
// ============================================================================

export interface IndexUsageStats {
  schemaname: string;
  tablename: string;
  indexname: string;
  idx_scan: number;
  idx_tup_read: number;
  idx_tup_fetch: number;
}

export interface TableStats {
  tablename: string;
  table_size: string;
  index_size: string;
  total_size: string;
  row_count: number;
}

export interface SlowQueryStats {
  query: string;
  calls: number;
  total_time: number;
  mean_time: number;
  rows: number;
}

export interface TrendingPrompt {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  usage_count: number;
  rating_average: number;
  rating_count: number;
  created_at: string;
  trend_score: number;
}

export interface UserActivitySummary {
  total_templates: number;
  total_usage: number;
  total_cost_cents: number;
  last_activity: string | null;
  subscription_status: string | null;
}

export interface CleanupResult {
  table_name: string;
  deleted_count: number;
}

// ============================================================================
// PERFORMANCE MONITORING FUNCTIONS
// ============================================================================

/**
 * Analyze index usage across all tables
 * @returns Promise<IndexUsageStats[]> - Index usage statistics
 */
export async function analyzeIndexUsage(): Promise<IndexUsageStats[]> {
  const { data, error } = await supabase.rpc('analyze_index_usage');

  if (error) {
    console.error('Error analyzing index usage:', error);
    return [];
  }

  return data || [];
}

/**
 * Get table statistics including sizes and row counts
 * @returns Promise<TableStats[]> - Table statistics
 */
export async function getTableStats(): Promise<TableStats[]> {
  const { data, error } = await supabase.rpc('get_table_stats');

  if (error) {
    console.error('Error getting table stats:', error);
    return [];
  }

  return data || [];
}

/**
 * Get slowest queries (requires pg_stat_statements extension)
 * @param limitCount - Number of slow queries to return (default: 10)
 * @returns Promise<SlowQueryStats[]> - Slow query statistics
 */
export async function getSlowQueries(limitCount: number = 10): Promise<SlowQueryStats[]> {
  const { data, error } = await supabase.rpc('get_slow_queries', {
    limit_count: limitCount,
  });

  if (error) {
    console.error('Error getting slow queries:', error);
    return [];
  }

  return data || [];
}

// ============================================================================
// QUERY OPTIMIZATION FUNCTIONS
// ============================================================================

/**
 * Get trending prompts with optimized scoring
 * @param days - Number of days to look back (default: 7)
 * @param limitCount - Number of prompts to return (default: 20)
 * @returns Promise<TrendingPrompt[]> - Trending prompts
 */
export async function getTrendingPromptsOptimized(
  days: number = 7,
  limitCount: number = 20
): Promise<TrendingPrompt[]> {
  const { data, error } = await supabase.rpc('get_trending_prompts_optimized', {
    days,
    limit_count: limitCount,
  });

  if (error) {
    console.error('Error getting trending prompts:', error);
    return [];
  }

  return data || [];
}

/**
 * Get comprehensive user activity summary
 * @param userId - The user ID to get summary for
 * @returns Promise<UserActivitySummary | null> - User activity summary
 */
export async function getUserActivitySummary(
  userId: string
): Promise<UserActivitySummary | null> {
  const { data, error } = await supabase.rpc('get_user_activity_summary', {
    user_uuid: userId,
  });

  if (error) {
    console.error('Error getting user activity summary:', error);
    return null;
  }

  return data?.[0] || null;
}

// ============================================================================
// MAINTENANCE FUNCTIONS
// ============================================================================

/**
 * Update table statistics for better query planning
 * @returns Promise<boolean> - Success status
 */
export async function updateTableStatistics(): Promise<boolean> {
  const { error } = await supabase.rpc('update_table_statistics');

  if (error) {
    console.error('Error updating table statistics:', error);
    return false;
  }

  return true;
}

/**
 * Clean up old data based on retention policy
 * @param daysToKeep - Number of days to keep data (default: 365)
 * @returns Promise<CleanupResult[]> - Cleanup results
 */
export async function cleanupOldData(daysToKeep: number = 365): Promise<CleanupResult[]> {
  const { data, error } = await supabase.rpc('cleanup_old_data', {
    days_to_keep: daysToKeep,
  });

  if (error) {
    console.error('Error cleaning up old data:', error);
    return [];
  }

  return data || [];
}

// ============================================================================
// PERFORMANCE ANALYSIS UTILITIES
// ============================================================================

/**
 * Get performance insights for a specific table
 * @param tableName - The table to analyze
 * @returns Promise<object> - Performance insights
 */
export async function getTablePerformanceInsights(tableName: string): Promise<{
  tableStats: TableStats | null;
  indexUsage: IndexUsageStats[];
  recommendations: string[];
}> {
  const [tableStats, indexUsage] = await Promise.all([
    getTableStats().then(stats => stats.find(s => s.tablename === tableName) || null),
    analyzeIndexUsage().then(usage => usage.filter(u => u.tablename === tableName)),
  ]);

  const recommendations: string[] = [];

  // Analyze table size
  if (tableStats) {
    const totalSizeMB = parseFloat(tableStats.total_size.replace(/[^\d.]/g, ''));
    if (totalSizeMB > 1000) {
      recommendations.push('Consider table partitioning for large table size');
    }
  }

  // Analyze index usage
  const unusedIndexes = indexUsage.filter(idx => idx.idx_scan === 0);
  if (unusedIndexes.length > 0) {
    recommendations.push(`Consider dropping ${unusedIndexes.length} unused indexes`);
  }

  // Analyze index efficiency
  const inefficientIndexes = indexUsage.filter(idx => 
    idx.idx_scan > 0 && (idx.idx_tup_read / idx.idx_scan) > 1000
  );
  if (inefficientIndexes.length > 0) {
    recommendations.push('Some indexes may need optimization due to low selectivity');
  }

  return {
    tableStats,
    indexUsage,
    recommendations,
  };
}

/**
 * Get overall database performance summary
 * @returns Promise<object> - Database performance summary
 */
export async function getDatabasePerformanceSummary(): Promise<{
  totalTables: number;
  totalIndexes: number;
  totalSize: string;
  unusedIndexes: number;
  slowQueries: number;
  recommendations: string[];
}> {
  const [tableStats, indexUsage, slowQueries] = await Promise.all([
    getTableStats(),
    analyzeIndexUsage(),
    getSlowQueries(5),
  ]);

  const totalSize = tableStats.reduce((acc, stat) => {
    const sizeMB = parseFloat(stat.total_size.replace(/[^\d.]/g, ''));
    return acc + sizeMB;
  }, 0);

  const unusedIndexes = indexUsage.filter(idx => idx.idx_scan === 0).length;
  const slowQueriesCount = slowQueries.filter(q => q.mean_time > 1000).length;

  const recommendations: string[] = [];

  if (unusedIndexes > 0) {
    recommendations.push(`Consider dropping ${unusedIndexes} unused indexes`);
  }

  if (slowQueriesCount > 0) {
    recommendations.push(`Investigate ${slowQueriesCount} slow queries`);
  }

  if (totalSize > 10000) {
    recommendations.push('Consider data archiving for large database size');
  }

  return {
    totalTables: tableStats.length,
    totalIndexes: indexUsage.length,
    totalSize: `${Math.round(totalSize)} MB`,
    unusedIndexes,
    slowQueries: slowQueriesCount,
    recommendations,
  };
}

// ============================================================================
// PERFORMANCE MONITORING DASHBOARD DATA
// ============================================================================

/**
 * Get data for performance monitoring dashboard
 * @returns Promise<object> - Dashboard data
 */
export async function getPerformanceDashboardData(): Promise<{
  summary: {
    totalTables: number;
    totalIndexes: number;
    totalSize: string;
    unusedIndexes: number;
    slowQueries: number;
  };
  topTables: TableStats[];
  topIndexes: IndexUsageStats[];
  slowQueries: SlowQueryStats[];
  recommendations: string[];
}> {
  const [
    summary,
    tableStats,
    indexUsage,
    slowQueries,
  ] = await Promise.all([
    getDatabasePerformanceSummary(),
    getTableStats(),
    analyzeIndexUsage(),
    getSlowQueries(10),
  ]);

  const topTables = tableStats
    .sort((a, b) => parseFloat(b.total_size.replace(/[^\d.]/g, '')) - parseFloat(a.total_size.replace(/[^\d.]/g, '')))
    .slice(0, 10);

  const topIndexes = indexUsage
    .sort((a, b) => b.idx_scan - a.idx_scan)
    .slice(0, 10);

  return {
    summary: {
      totalTables: summary.totalTables,
      totalIndexes: summary.totalIndexes,
      totalSize: summary.totalSize,
      unusedIndexes: summary.unusedIndexes,
      slowQueries: summary.slowQueries,
    },
    topTables,
    topIndexes,
    slowQueries,
    recommendations: summary.recommendations,
  };
}

// ============================================================================
// PERFORMANCE ALERTING
// ============================================================================

/**
 * Check for performance issues and generate alerts
 * @returns Promise<string[]> - Performance alerts
 */
export async function checkPerformanceAlerts(): Promise<string[]> {
  const alerts: string[] = [];

  try {
    const [tableStats, indexUsage, slowQueries] = await Promise.all([
      getTableStats(),
      analyzeIndexUsage(),
      getSlowQueries(5),
    ]);

    // Check for large tables
    const largeTables = tableStats.filter(stat => {
      const sizeMB = parseFloat(stat.total_size.replace(/[^\d.]/g, ''));
      return sizeMB > 1000;
    });

    if (largeTables.length > 0) {
      alerts.push(`Large tables detected: ${largeTables.map(t => t.tablename).join(', ')}`);
    }

    // Check for unused indexes
    const unusedIndexes = indexUsage.filter(idx => idx.idx_scan === 0);
    if (unusedIndexes.length > 5) {
      alerts.push(`${unusedIndexes.length} unused indexes detected`);
    }

    // Check for slow queries
    const verySlowQueries = slowQueries.filter(q => q.mean_time > 5000);
    if (verySlowQueries.length > 0) {
      alerts.push(`${verySlowQueries.length} very slow queries detected (>5s average)`);
    }

    // Check for inefficient indexes
    const inefficientIndexes = indexUsage.filter(idx => 
      idx.idx_scan > 0 && (idx.idx_tup_read / idx.idx_scan) > 10000
    );
    if (inefficientIndexes.length > 0) {
      alerts.push(`${inefficientIndexes.length} inefficient indexes detected`);
    }

  } catch (error) {
    console.error('Error checking performance alerts:', error);
    alerts.push('Error checking performance metrics');
  }

  return alerts;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Format bytes to human readable format
 * @param bytes - Number of bytes
 * @returns string - Formatted size
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Format milliseconds to human readable format
 * @param ms - Number of milliseconds
 * @returns string - Formatted time
 */
export function formatMilliseconds(ms: number): string {
  if (ms < 1000) return `${ms.toFixed(2)}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
  return `${(ms / 60000).toFixed(2)}m`;
}

/**
 * Calculate index efficiency score
 * @param indexUsage - Index usage statistics
 * @returns number - Efficiency score (0-100)
 */
export function calculateIndexEfficiency(indexUsage: IndexUsageStats): number {
  if (indexUsage.idx_scan === 0) return 0;
  
  const efficiency = (indexUsage.idx_tup_fetch / indexUsage.idx_tup_read) * 100;
  return Math.min(100, Math.max(0, efficiency));
}

// ============================================================================
// EXPORT TYPES
// ============================================================================

// Types are already exported above
