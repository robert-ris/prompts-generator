import { createClient } from '@supabase/supabase-js';
import { config } from '../config';

// Validate Supabase configuration
if (!config.supabaseUrl || !config.supabaseAnonKey) {
  throw new Error(
    'Missing Supabase configuration. Please check your environment variables.'
  );
}

export const supabase = createClient(
  config.supabaseUrl,
  config.supabaseAnonKey
);
