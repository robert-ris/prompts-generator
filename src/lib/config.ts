// Environment variables
export const config = {
  // App
  appName: 'AI Prompt Builder',
  appVersion: '0.1.0',
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',

  // Supabase
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,

  // Stripe
  stripePublishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
  stripeSecretKey: process.env.STRIPE_SECRET_KEY!,
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,

  // AI Providers
  openaiApiKey: process.env.OPENAI_API_KEY!,
  anthropicApiKey: process.env.ANTHROPIC_API_KEY!,

  // Feature flags
  features: {
    aiImprovement: true,
    communitySharing: true,
    subscriptionManagement: true,
  },

  // Quotas
  quotas: {
    free: {
      aiCallsPerMonth: 10,
      maxSavedPrompts: 20,
      maxCategories: 3,
    },
    pro: {
      aiCallsPerMonth: 200,
      maxSavedPrompts: -1, // unlimited
      maxCategories: -1, // unlimited
    },
  },

  // UI
  ui: {
    maxPreviewLength: 1000,
    debounceDelay: 200,
    maxTagsPerPrompt: 10,
  },
} as const;

// Validate required environment variables
export function validateConfig() {
  const requiredVars = [
    'SUPABASE_SERVICE_ROLE_KEY',
    'STRIPE_SECRET_KEY',
    'OPENAI_API_KEY',
  ];

  const missing = requiredVars.filter(varName => !process.env[varName]);

  if (missing.length > 0) {
    console.warn(
      `Missing optional environment variables: ${missing.join(', ')}`
    );
  }
}
