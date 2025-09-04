'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';

interface UserQuota {
  used: number;
  limit: number;
  resetDate: Date;
}

export function useUserQuota() {
  const [quota, setQuota] = useState<UserQuota | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQuota = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError('User not authenticated');
        return;
      }

      console.log('User ID:', user.id); // Debug log

      // Try to get or create quota directly
      const { data, error: quotaError } = await supabase
        .from('user_quotas')
        .select(
          'ai_improve_calls_used, ai_improve_calls_limit, quota_reset_date'
        )
        .eq('user_id', user.id)
        .single();

      console.log('Quota query result:', { data, error: quotaError }); // Debug log

      if (quotaError) {
        // If no quota record exists, create one with default values
        if (quotaError.code === 'PGRST116') {
          // No rows returned
          console.log('Creating new quota record for user:', user.id);
          const { data: newQuota, error: insertError } = await supabase
            .from('user_quotas')
            .insert({
              user_id: user.id,
              ai_improve_calls_used: 0,
              ai_improve_calls_limit: 10,
              quota_reset_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                .toISOString()
                .split('T')[0], // 30 days from now
            })
            .select(
              'ai_improve_calls_used, ai_improve_calls_limit, quota_reset_date'
            )
            .single();

          if (insertError) {
            console.error('Error creating quota details:', {
              code: insertError.code,
              message: insertError.message,
              details: insertError.details,
              hint: insertError.hint,
            });
            // If quota creation fails, return default values
            console.log('Using default quota values');
            setQuota({
              used: 0,
              limit: 10,
              resetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            });
            return;
          }

          setQuota({
            used: newQuota.ai_improve_calls_used,
            limit: newQuota.ai_improve_calls_limit,
            resetDate: new Date(newQuota.quota_reset_date),
          });
          return;
        }
        // For other errors, use default values
        console.log('Quota error, using default values:', quotaError);
        setQuota({
          used: 0,
          limit: 10,
          resetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        });
        return;
      }

      setQuota({
        used: data.ai_improve_calls_used,
        limit: data.ai_improve_calls_limit,
        resetDate: new Date(data.quota_reset_date),
      });
    } catch (err) {
      console.error('Error fetching user quota:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else if (typeof err === 'object' && err !== null) {
        setError(JSON.stringify(err));
      } else {
        setError('Failed to fetch quota');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshQuota = useCallback(() => {
    fetchQuota();
  }, [fetchQuota]);

  useEffect(() => {
    fetchQuota();
  }, [fetchQuota]);

  return {
    quota,
    loading,
    error,
    refreshQuota,
  };
}
