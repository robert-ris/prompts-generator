export interface CoreSettings {
  role?: string;
  niche?: string;
  taskType?: string;
  outputFormat?: string;
  tone?: string;
  targetAudience?: string;
  lengthPreference?: string;
  constraints?: string;
}

export interface AdvancedSettings {
  perspective?: string;
  creativityLevel?: string;
  language?: string;
  additionalContext?: string;
  formattingAddons?: string[];
  callToAction?: string;
}

export interface PlanFeatures {
  ai_improve_calls: number;
  ai_generate_calls: number;
  max_tokens: number;
  community_access: boolean;
  community_publish?: boolean;
  max_saved_prompts: number;
  max_categories: number;
  priority_support?: boolean;
  advanced_analytics?: boolean;
  team_management?: boolean;
  custom_integrations?: boolean;
  [key: string]: boolean | number | undefined;
}

export interface BillingEventMetadata {
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  invoice_id?: string;
  payment_intent_id?: string;
  failure_reason?: string;
  [key: string]: string | undefined;
}

export interface CommentEditHistory {
  content: string;
  edited_at: string;
  reason?: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          bio: string | null;
          website_url: string | null;
          location: string | null;
          subscription_tier: 'free' | 'pro';
          subscription_status: 'active' | 'canceled' | 'past_due' | 'unpaid';
          stripe_customer_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          website_url?: string | null;
          location?: string | null;
          subscription_tier?: 'free' | 'pro';
          subscription_status?: 'active' | 'canceled' | 'past_due' | 'unpaid';
          stripe_customer_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          website_url?: string | null;
          location?: string | null;
          subscription_tier?: 'free' | 'pro';
          subscription_status?: 'active' | 'canceled' | 'past_due' | 'unpaid';
          stripe_customer_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      prompt_templates: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          content: string;
          template_content: string | null;
          description: string | null;
          category: string | null;
          tags: string[] | null;
          core_settings: CoreSettings | null;
          advanced_settings: AdvancedSettings | null;
          metadata: Record<string, unknown> | null;
          is_public: boolean;
          is_featured: boolean;
          usage_count: number;
          rating_average: number;
          rating_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          content: string;
          template_content?: string | null;
          description?: string | null;
          category?: string | null;
          tags?: string[] | null;
          variables?: TemplateVariables | null;
          metadata?: Record<string, unknown> | null;
          is_public?: boolean;
          is_featured?: boolean;
          usage_count?: number;
          rating_average?: number;
          rating_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          content?: string;
          template_content?: string | null;
          description?: string | null;
          category?: string | null;
          tags?: string[] | null;
          variables?: TemplateVariables | null;
          metadata?: Record<string, unknown> | null;
          is_public?: boolean;
          is_featured?: boolean;
          usage_count?: number;
          rating_average?: number;
          rating_count?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      ai_usage_logs: {
        Row: {
          id: string;
          user_id: string;
          template_id: string | null;
          operation_type: 'tighten' | 'expand' | 'improve' | 'generate';
          input_tokens: number;
          output_tokens: number;
          cost_cents: number;
          provider: string;
          model: string;
          success: boolean;
          error_message: string | null;
          response_time_ms: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          template_id?: string | null;
          operation_type: 'tighten' | 'expand' | 'improve' | 'generate';
          input_tokens: number;
          output_tokens: number;
          cost_cents: number;
          provider: string;
          model: string;
          success?: boolean;
          error_message?: string | null;
          response_time_ms?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          template_id?: string | null;
          operation_type?: 'tighten' | 'expand' | 'improve' | 'generate';
          input_tokens?: number;
          output_tokens?: number;
          cost_cents?: number;
          provider?: string;
          model?: string;
          success?: boolean;
          error_message?: string | null;
          response_time_ms?: number | null;
          created_at?: string;
        };
      };
      user_quotas: {
        Row: {
          user_id: string;
          ai_improve_calls_used: number;
          ai_improve_calls_limit: number;
          ai_generate_calls_used: number;
          ai_generate_calls_limit: number;
          total_tokens_used: number;
          total_tokens_limit: number;
          total_cost_cents: number;
          quota_reset_date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          ai_improve_calls_used?: number;
          ai_improve_calls_limit?: number;
          ai_generate_calls_used?: number;
          ai_generate_calls_limit?: number;
          total_tokens_used?: number;
          total_tokens_limit?: number;
          total_cost_cents?: number;
          quota_reset_date?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          ai_improve_calls_used?: number;
          ai_improve_calls_limit?: number;
          ai_generate_calls_used?: number;
          ai_generate_calls_limit?: number;
          total_tokens_used?: number;
          total_tokens_limit?: number;
          total_cost_cents?: number;
          quota_reset_date?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      ai_provider_configs: {
        Row: {
          id: string;
          provider_name: string;
          model_name: string;
          input_cost_per_1k_tokens: number;
          output_cost_per_1k_tokens: number;
          max_tokens_per_request: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          provider_name: string;
          model_name: string;
          input_cost_per_1k_tokens: number;
          output_cost_per_1k_tokens: number;
          max_tokens_per_request: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          provider_name?: string;
          model_name?: string;
          input_cost_per_1k_tokens?: number;
          output_cost_per_1k_tokens?: number;
          max_tokens_per_request?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          stripe_subscription_id: string;
          stripe_customer_id: string;
          status:
            | 'active'
            | 'canceled'
            | 'past_due'
            | 'unpaid'
            | 'trialing'
            | 'incomplete'
            | 'incomplete_expired';
          plan_id: string;
          current_period_start: string;
          current_period_end: string;
          cancel_at_period_end: boolean;
          canceled_at: string | null;
          trial_start: string | null;
          trial_end: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          stripe_subscription_id: string;
          stripe_customer_id: string;
          status:
            | 'active'
            | 'canceled'
            | 'past_due'
            | 'unpaid'
            | 'trialing'
            | 'incomplete'
            | 'incomplete_expired';
          plan_id: string;
          current_period_start: string;
          current_period_end: string;
          cancel_at_period_end?: boolean;
          canceled_at?: string | null;
          trial_start?: string | null;
          trial_end?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          stripe_subscription_id?: string;
          stripe_customer_id?: string;
          status?:
            | 'active'
            | 'canceled'
            | 'past_due'
            | 'unpaid'
            | 'trialing'
            | 'incomplete'
            | 'incomplete_expired';
          plan_id?: string;
          current_period_start?: string;
          current_period_end?: string;
          cancel_at_period_end?: boolean;
          canceled_at?: string | null;
          trial_start?: string | null;
          trial_end?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      subscription_plans: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          price_cents: number;
          interval: 'month' | 'year';
          stripe_price_id: string | null;
          features: PlanFeatures;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          description?: string | null;
          price_cents: number;
          interval: 'month' | 'year';
          stripe_price_id?: string | null;
          features: PlanFeatures;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          price_cents?: number;
          interval?: 'month' | 'year';
          stripe_price_id?: string | null;
          features?: PlanFeatures;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      feature_entitlements: {
        Row: {
          id: string;
          user_id: string;
          feature_name: string;
          is_enabled: boolean;
          usage_limit: number | null;
          usage_count: number;
          reset_frequency: 'never' | 'daily' | 'weekly' | 'monthly';
          last_reset_date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          feature_name: string;
          is_enabled?: boolean;
          usage_limit?: number | null;
          usage_count?: number;
          reset_frequency?: 'never' | 'daily' | 'weekly' | 'monthly';
          last_reset_date?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          feature_name?: string;
          is_enabled?: boolean;
          usage_limit?: number | null;
          usage_count?: number;
          reset_frequency?: 'never' | 'daily' | 'weekly' | 'monthly';
          last_reset_date?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      billing_events: {
        Row: {
          id: string;
          user_id: string;
          subscription_id: string | null;
          stripe_event_id: string | null;
          event_type: string;
          amount_cents: number | null;
          currency: string;
          status: string;
          metadata: BillingEventMetadata | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          subscription_id?: string | null;
          stripe_event_id?: string | null;
          event_type: string;
          amount_cents?: number | null;
          currency?: string;
          status: string;
          metadata?: BillingEventMetadata | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          subscription_id?: string | null;
          stripe_event_id?: string | null;
          event_type?: string;
          amount_cents?: number | null;
          currency?: string;
          status?: string;
          metadata?: BillingEventMetadata | null;
          created_at?: string;
        };
      };
      community_prompts: {
        Row: {
          id: string;
          original_template_id: string;
          user_id: string;
          title: string;
          content: string;
          description: string | null;
          category: string | null;
          tags: string[] | null;
          core_settings: CoreSettings | null;
          advanced_settings: AdvancedSettings | null;
          is_featured: boolean;
          is_approved: boolean;
          approval_status: 'pending' | 'approved' | 'rejected';
          rejection_reason: string | null;
          view_count: number;
          save_count: number;
          rating_average: number;
          rating_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          original_template_id: string;
          user_id: string;
          title: string;
          content: string;
          description?: string | null;
          category?: string | null;
          tags?: string[] | null;
          variables?: TemplateVariables | null;
          is_featured?: boolean;
          is_approved?: boolean;
          approval_status?: 'pending' | 'approved' | 'rejected';
          rejection_reason?: string | null;
          view_count?: number;
          save_count?: number;
          rating_average?: number;
          rating_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          original_template_id?: string;
          user_id?: string;
          title?: string;
          content?: string;
          description?: string | null;
          category?: string | null;
          tags?: string[] | null;
          variables?: TemplateVariables | null;
          is_featured?: boolean;
          is_approved?: boolean;
          approval_status?: 'pending' | 'approved' | 'rejected';
          rejection_reason?: string | null;
          view_count?: number;
          save_count?: number;
          rating_average?: number;
          rating_count?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      community_saves: {
        Row: {
          id: string;
          user_id: string;
          community_prompt_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          community_prompt_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          community_prompt_id?: string;
          created_at?: string;
        };
      };
      community_ratings: {
        Row: {
          id: string;
          user_id: string;
          community_prompt_id: string;
          rating: number;
          review: string | null;
          is_helpful: boolean;
          helpful_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          community_prompt_id: string;
          rating: number;
          review?: string | null;
          is_helpful?: boolean;
          helpful_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          community_prompt_id?: string;
          rating?: number;
          review?: string | null;
          is_helpful?: boolean;
          helpful_count?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      community_comments: {
        Row: {
          id: string;
          user_id: string;
          community_prompt_id: string;
          parent_comment_id: string | null;
          content: string;
          is_edited: boolean;
          edit_history: CommentEditHistory[] | null;
          is_flagged: boolean;
          flag_reason: string | null;
          upvotes: number;
          downvotes: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          community_prompt_id: string;
          parent_comment_id?: string | null;
          content: string;
          is_edited?: boolean;
          edit_history?: CommentEditHistory[] | null;
          is_flagged?: boolean;
          flag_reason?: string | null;
          upvotes?: number;
          downvotes?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          community_prompt_id?: string;
          parent_comment_id?: string | null;
          content?: string;
          is_edited?: boolean;
          edit_history?: CommentEditHistory[] | null;
          is_flagged?: boolean;
          flag_reason?: string | null;
          upvotes?: number;
          downvotes?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      community_follows: {
        Row: {
          id: string;
          follower_id: string;
          following_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          follower_id: string;
          following_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          follower_id?: string;
          following_id?: string;
          created_at?: string;
        };
      };
      community_notifications: {
        Row: {
          id: string;
          user_id: string;
          type:
            | 'comment'
            | 'rating'
            | 'follow'
            | 'save'
            | 'feature'
            | 'approval';
          title: string;
          message: string;
          related_id: string | null;
          related_type: string | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type:
            | 'comment'
            | 'rating'
            | 'follow'
            | 'save'
            | 'feature'
            | 'approval';
          title: string;
          message: string;
          related_id?: string | null;
          related_type?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?:
            | 'comment'
            | 'rating'
            | 'follow'
            | 'save'
            | 'feature'
            | 'approval';
          title?: string;
          message?: string;
          related_id?: string | null;
          related_type?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
      };
    };
  };
}

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export type PromptTemplate =
  Database['public']['Tables']['prompt_templates']['Row'];
export type PromptTemplateInsert =
  Database['public']['Tables']['prompt_templates']['Insert'];
export type PromptTemplateUpdate =
  Database['public']['Tables']['prompt_templates']['Update'];

export type AIUsageLog = Database['public']['Tables']['ai_usage_logs']['Row'];
export type AIUsageLogInsert =
  Database['public']['Tables']['ai_usage_logs']['Insert'];
export type AIUsageLogUpdate =
  Database['public']['Tables']['ai_usage_logs']['Update'];

export type UserQuota = Database['public']['Tables']['user_quotas']['Row'];
export type UserQuotaInsert =
  Database['public']['Tables']['user_quotas']['Insert'];
export type UserQuotaUpdate =
  Database['public']['Tables']['user_quotas']['Update'];

export type AIProviderConfig =
  Database['public']['Tables']['ai_provider_configs']['Row'];
export type AIProviderConfigInsert =
  Database['public']['Tables']['ai_provider_configs']['Insert'];
export type AIProviderConfigUpdate =
  Database['public']['Tables']['ai_provider_configs']['Update'];

export type Subscription = Database['public']['Tables']['subscriptions']['Row'];
export type SubscriptionInsert =
  Database['public']['Tables']['subscriptions']['Insert'];
export type SubscriptionUpdate =
  Database['public']['Tables']['subscriptions']['Update'];

export type SubscriptionPlan =
  Database['public']['Tables']['subscription_plans']['Row'];
export type SubscriptionPlanInsert =
  Database['public']['Tables']['subscription_plans']['Insert'];
export type SubscriptionPlanUpdate =
  Database['public']['Tables']['subscription_plans']['Update'];

export type FeatureEntitlement =
  Database['public']['Tables']['feature_entitlements']['Row'];
export type FeatureEntitlementInsert =
  Database['public']['Tables']['feature_entitlements']['Insert'];
export type FeatureEntitlementUpdate =
  Database['public']['Tables']['feature_entitlements']['Update'];

export type BillingEvent =
  Database['public']['Tables']['billing_events']['Row'];
export type BillingEventInsert =
  Database['public']['Tables']['billing_events']['Insert'];
export type BillingEventUpdate =
  Database['public']['Tables']['billing_events']['Update'];

export type CommunityPrompt =
  Database['public']['Tables']['community_prompts']['Row'];
export type CommunityPromptInsert =
  Database['public']['Tables']['community_prompts']['Insert'];
export type CommunityPromptUpdate =
  Database['public']['Tables']['community_prompts']['Update'];

export type CommunitySave =
  Database['public']['Tables']['community_saves']['Row'];
export type CommunitySaveInsert =
  Database['public']['Tables']['community_saves']['Insert'];
export type CommunitySaveUpdate =
  Database['public']['Tables']['community_saves']['Update'];

export type CommunityRating =
  Database['public']['Tables']['community_ratings']['Row'];
export type CommunityRatingInsert =
  Database['public']['Tables']['community_ratings']['Insert'];
export type CommunityRatingUpdate =
  Database['public']['Tables']['community_ratings']['Update'];

export type CommunityComment =
  Database['public']['Tables']['community_comments']['Row'];
export type CommunityCommentInsert =
  Database['public']['Tables']['community_comments']['Insert'];
export type CommunityCommentUpdate =
  Database['public']['Tables']['community_comments']['Update'];

export type CommunityFollow =
  Database['public']['Tables']['community_follows']['Row'];
export type CommunityFollowInsert =
  Database['public']['Tables']['community_follows']['Insert'];
export type CommunityFollowUpdate =
  Database['public']['Tables']['community_follows']['Update'];

export type CommunityNotification =
  Database['public']['Tables']['community_notifications']['Row'];
export type CommunityNotificationInsert =
  Database['public']['Tables']['community_notifications']['Insert'];
export type CommunityNotificationUpdate =
  Database['public']['Tables']['community_notifications']['Update'];
