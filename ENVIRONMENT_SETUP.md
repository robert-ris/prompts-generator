# Environment Setup Guide

## Required Environment Variables

Create a `.env.local` file in the project root with the following variables:

```bash
# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key_here
STRIPE_SECRET_KEY=your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret_here

# AI Providers
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Optional: Content Moderation
CONTENT_MODERATION_API_KEY=your_content_moderation_api_key_here

# Optional: Analytics
NEXT_PUBLIC_ANALYTICS_ID=your_analytics_id_here
```

## Setup Instructions

### 1. Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings > API
3. Copy the Project URL and anon/public key
4. For the service role key, use the `service_role` key (keep this secret)

### 2. Stripe Setup

1. Create an account at [stripe.com](https://stripe.com)
2. Go to Developers > API keys
3. Copy the Publishable key and Secret key
4. For webhooks, create a webhook endpoint and copy the signing secret

### 3. AI Provider Setup

1. **OpenAI**: Get API key from [platform.openai.com](https://platform.openai.com)
2. **Anthropic**: Get API key from [console.anthropic.com](https://console.anthropic.com)

## Development vs Production

- **Development**: Use test keys and localhost URLs
- **Production**: Use live keys and your production domain

## Security Notes

- Never commit `.env.local` to version control
- Use different keys for development and production
- Rotate API keys regularly
- Use environment-specific configurations
