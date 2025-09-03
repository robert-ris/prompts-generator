# AI Prompt Builder - Technical Specifications

## File System Structure

```
Frontend/ (Next.js 14+ App Router)
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── signup/
│   │       └── page.tsx
│   ├── dashboard/
│   │   ├── page.tsx
│   │   ├── builder/
│   │   │   └── page.tsx
│   │   ├── library/
│   │   │   └── page.tsx
│   │   └── community/
│   │       └── page.tsx
│   ├── api/
│   │   ├── prompts/
│   │   │   └── route.ts
│   │   ├── ai-improve/
│   │   │   └── route.ts
│   │   ├── quotas/
│   │   │   └── route.ts
│   │   └── webhooks/
│   │       └── stripe/
│   │           └── route.ts
│   ├── globals.css
│   ├── layout.tsx
│   └── loading.tsx
├── components/
│   ├── ui/ (shadcn/ui components)
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   └── AuthProvider.tsx
│   ├── builder/
│   │   ├── PromptBuilder.tsx
│   │   ├── LivePreview.tsx
│   │   ├── AIImprove.tsx
│   │   └── SlotFillers.tsx
│   ├── library/
│   │   ├── PromptCard.tsx
│   │   ├── LibraryGrid.tsx
│   │   └── PromptEditor.tsx
│   ├── community/
│   │   ├── CommunityFeed.tsx
│   │   ├── PublishModal.tsx
│   │   └── PromptDetail.tsx
│   └── shared/
│       ├── QuotaMeter.tsx
│       ├── UpgradeModal.tsx
│       └── Navigation.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── types.ts
│   ├── stripe/
│   │   └── config.ts
│   ├── llm/
│   │   └── providers.ts
│   ├── utils.ts
│   └── validations.ts
├── hooks/
│   ├── useAuth.ts
│   ├── useQuotas.ts
│   └── usePrompts.ts
└── types/
    ├── database.ts
    ├── prompts.ts
    └── auth.ts

Backend/ (Supabase + Server Actions)
├── supabase/
│   ├── migrations/
│   │   ├── 001_initial_schema.sql
│   │   ├── 002_rls_policies.sql
│   │   ├── 003_quotas_system.sql
│   │   └── 004_community_features.sql
│   ├── functions/
│   │   ├── check-quotas/
│   │   └── process-stripe-webhook/
│   └── seed.sql
└── server-actions/
    ├── auth-actions.ts
    ├── prompt-actions.ts
    ├── quota-actions.ts
    └── payment-actions.ts
```

---

## Feature Specifications

### Feature 1: User Authentication & Dashboard

#### Goal

Implement secure user authentication with Supabase Auth and create a personalized dashboard experience with proper state management and loading states.

#### API Relationships

- Supabase Auth API for login/signup/session management
- Supabase Database for user profile data and preferences
- Next.js Server Actions for server-side auth operations

#### Detailed Requirements

- Email/password authentication with optional Google OAuth
- Protected routes with automatic redirects
- Persistent sessions with refresh token handling
- User profile management with avatar upload
- Dashboard with usage statistics and quick actions
- Responsive design with mobile-first approach
- Comprehensive error handling and user feedback

#### Implementation Guide

**Authentication Flow:**

```
1. User submits credentials
2. Client-side validation (email format, password strength)
3. Server Action calls Supabase Auth
4. Success → Set session cookie → Redirect to dashboard
5. Error → Display inline validation messages
```

**Database Schema - Users:**

```sql
-- Extended user profiles (linked to auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Component Architecture:**

- AuthProvider wraps entire app for session context
- Protected route HOC checks auth state
- LoginForm with real-time validation
- Dashboard with skeleton loading states

**Key Edge Cases:**

- Session expiration during active use
- Network failures during authentication
- Multiple browser tabs with different auth states
- Social auth callback failures

---

### Feature 2: Dynamic Prompt Builder with Live Preview

#### Goal

Create an intuitive prompt building interface with real-time preview, template variable syntax, and preset configurations for role, topic, and tone.

#### API Relationships

- Next.js Server Actions for prompt processing
- Local state management for live preview updates
- Supabase for saving prompt templates

#### Detailed Requirements

- Slot-filling interface with Role, Topic, Tone, Output Type inputs
- Template variable syntax: `{{role}}`, `{{topic}}`, `{{tone}}`
- Real-time live preview with <250ms update latency
- Preset dropdowns with custom input options
- Copy-to-clipboard functionality with visual feedback
- Save prompt to library with metadata
- Input validation and character limits
- Mobile-responsive design with touch-friendly controls

#### Implementation Guide

**Template Processing Logic:**

```
FUNCTION processTemplate(template, variables):
  result = template
  FOR EACH variable IN variables:
    IF variable.value IS NOT EMPTY:
      result = result.replace(`{{${variable.key}}}`, variable.value)
    ELSE:
      result = result.replace(`{{${variable.key}}}`, `[${variable.key}]`)
  RETURN result
```

**Database Schema - Prompt Templates:**

```sql
CREATE TABLE prompt_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  title TEXT NOT NULL,
  template_content TEXT NOT NULL,
  category TEXT NOT NULL,
  variables JSONB NOT NULL, -- {role: "teacher", topic: "math", tone: "friendly"}
  metadata JSONB DEFAULT '{}', -- creation_date, last_used, etc.
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_prompt_templates_user_id ON prompt_templates(user_id);
CREATE INDEX idx_prompt_templates_category ON prompt_templates(category);
CREATE INDEX idx_prompt_templates_public ON prompt_templates(is_public) WHERE is_public = TRUE;
```

**Component State Management:**

```
PromptBuilderState {
  variables: {role: "", topic: "", tone: "", outputType: ""}
  template: string
  preview: string
  isValid: boolean
  isSaving: boolean
  lastSaved: timestamp
}
```

**Live Preview Implementation:**

- Debounced updates (200ms) to prevent excessive re-renders
- Memoized template processing for performance
- Spring animations for text transitions
- Error boundaries for malformed templates

**Key Edge Cases:**

- Very long prompt templates (>10k characters)
- Special characters in template variables
- Simultaneous editing from multiple devices
- Browser refresh during unsaved changes

---

### Feature 3: AI-Powered Auto-Improve Prompts

#### Goal

Integrate LLM APIs to provide intelligent prompt improvement suggestions with quota management and multiple improvement modes.

#### API Relationships

- OpenAI/Anthropic/Provider-agnostic LLM API
- Supabase for quota tracking and usage logs
- Stripe API for subscription verification
- Next.js API routes for secure LLM calls

#### Detailed Requirements

- "Tighten" and "Expand" improvement modes
- Quota enforcement: Free (10/month), Pro (200/month)
- Token usage logging for cost tracking
- Retry logic with exponential backoff
- Input sanitization and content filtering
- Response validation and safety checks
- Real-time usage meter in UI
- Upgrade prompts when quotas exceeded

#### Implementation Guide

**LLM Integration Architecture:**

```
CLIENT REQUEST → Next.js API Route → Quota Check → LLM Provider → Response Processing → Client
                                      ↓
                               Usage Logging (Supabase)
```

**Database Schema - AI Usage:**

```sql
CREATE TABLE ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  operation_type TEXT NOT NULL, -- 'tighten', 'expand'
  input_tokens INTEGER NOT NULL,
  output_tokens INTEGER NOT NULL,
  cost_cents INTEGER, -- Track actual API costs
  success BOOLEAN NOT NULL,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_quotas (
  user_id UUID PRIMARY KEY REFERENCES profiles(id),
  ai_improve_calls_used INTEGER DEFAULT 0,
  ai_improve_calls_limit INTEGER DEFAULT 10,
  quota_reset_date DATE DEFAULT CURRENT_DATE + INTERVAL '1 month',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**API Endpoint Structure:**

```
POST /api/ai-improve
Headers: Authorization, Content-Type
Body: {
  prompt: string,
  mode: 'tighten' | 'expand',
  context?: string
}

Response: {
  improved_prompt: string,
  explanation: string,
  tokens_used: number,
  remaining_quota: number
}
```

**Quota Management Logic:**

```
FUNCTION checkAndUpdateQuota(userId, operation):
  quota = getQuota(userId)
  IF quota.calls_used >= quota.calls_limit:
    RETURN error("Quota exceeded")

  IF quota.reset_date < TODAY:
    resetQuota(userId)
    quota = getQuota(userId)

  incrementQuota(userId)
  RETURN success(quota.calls_limit - quota.calls_used - 1)
```

**LLM Provider Wrapper:**

```
INTERFACE LLMProvider:
  improve_prompt(prompt, mode, context) -> {text, tokens}

CLASS OpenAIProvider IMPLEMENTS LLMProvider
CLASS AnthropicProvider IMPLEMENTS LLMProvider
CLASS ProviderFactory:
  get_provider(type) -> LLMProvider
```

**Key Edge Cases:**

- LLM API rate limits and failures
- Quota calculations during concurrent requests
- Invalid or inappropriate prompt content
- Token counting discrepancies between providers
- User subscription changes mid-request

---

### Feature 4: Subscription Management (Free vs Pro)

#### Goal

Implement tiered subscription system with Stripe integration, quota enforcement, and seamless upgrade/downgrade flows.

#### API Relationships

- Stripe Checkout API for payment processing
- Stripe Webhooks for subscription status updates
- Supabase for storing subscription data and quotas
- Next.js API routes for webhook handling

#### Detailed Requirements

- Two tiers: Free (limited) and Pro (premium features)
- Stripe-hosted checkout for PCI compliance
- Webhook handling for subscription lifecycle events
- Prorated billing for mid-cycle changes
- Grace period handling for failed payments
- Feature gating based on subscription status
- Clear upgrade prompts without being pushy
- Billing portal integration for self-service

#### Implementation Guide

**Subscription Tiers Definition:**

```
Free Tier:
- 20 saved prompts
- 10 AI improve calls/month
- 3 core categories access
- Community view-only
- Copy export only

Pro Tier:
- Unlimited saved prompts
- 200 AI improve calls/month
- All categories unlocked
- Community publishing
- Bulk export (JSON/CSV)
- Early access features
```

**Database Schema - Subscriptions:**

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) UNIQUE,
  stripe_customer_id TEXT UNIQUE NOT NULL,
  stripe_subscription_id TEXT UNIQUE,
  status TEXT NOT NULL, -- 'active', 'past_due', 'canceled', 'unpaid'
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'pro')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Feature entitlements based on subscription
CREATE TABLE feature_entitlements (
  user_id UUID PRIMARY KEY REFERENCES profiles(id),
  max_saved_prompts INTEGER DEFAULT 20,
  max_ai_calls_monthly INTEGER DEFAULT 10,
  can_publish_community BOOLEAN DEFAULT FALSE,
  can_bulk_export BOOLEAN DEFAULT FALSE,
  access_all_categories BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Stripe Webhook Handler:**

```
FUNCTION handleStripeWebhook(event):
  SWITCH event.type:
    CASE "customer.subscription.created":
      createSubscription(event.data.object)
    CASE "customer.subscription.updated":
      updateSubscription(event.data.object)
    CASE "customer.subscription.deleted":
      cancelSubscription(event.data.object)
    CASE "invoice.payment_failed":
      handlePaymentFailure(event.data.object)
```

**Feature Gating Middleware:**

```
FUNCTION checkFeatureAccess(userId, feature):
  entitlements = getEntitlements(userId)
  SWITCH feature:
    CASE "save_prompt":
      currentCount = getPromptCount(userId)
      RETURN currentCount < entitlements.max_saved_prompts
    CASE "ai_improve":
      RETURN hasAICallsRemaining(userId)
    CASE "community_publish":
      RETURN entitlements.can_publish_community
```

**Upgrade Flow UX:**

1. Feature limit reached → Show upgrade modal
2. Side-by-side plan comparison
3. Stripe Checkout redirect
4. Success → Immediate feature unlock
5. Webhook confirms subscription → Update entitlements

**Key Edge Cases:**

- Webhook delivery failures and retries
- Subscription downgrades with data over new limits
- Payment failures and dunning management
- Concurrent subscription modifications
- User deletes account with active subscription

---

### Feature 5: My Library (Personal Prompt Management)

#### Goal

Provide comprehensive CRUD operations for user's saved prompts with search, filtering, organization, and bulk operations.

#### API Relationships

- Supabase database for prompt storage with RLS
- Next.js Server Actions for CRUD operations
- Full-text search capabilities
- Real-time updates for multi-device sync

#### Detailed Requirements

- Create, read, update, delete prompts with optimistic UI
- Search and filter by category, date, content
- Bulk operations (select multiple, delete, export)
- Duplicate prompts for iteration
- Organize with tags and categories
- Sort by date, alphabetical, usage frequency
- Export individual or bulk prompts
- Soft delete with recovery option
- Real-time sync across devices

#### Implementation Guide

**Database Schema - Enhanced Prompts:**

```sql
-- Extend the existing prompt_templates table
ALTER TABLE prompt_templates ADD COLUMN tags TEXT[] DEFAULT '{}';
ALTER TABLE prompt_templates ADD COLUMN usage_count INTEGER DEFAULT 0;
ALTER TABLE prompt_templates ADD COLUMN last_used_at TIMESTAMPTZ;
ALTER TABLE prompt_templates ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE prompt_templates ADD COLUMN deleted_at TIMESTAMPTZ;

-- Full-text search index
CREATE INDEX idx_prompt_search ON prompt_templates
USING gin(to_tsvector('english', title || ' ' || template_content));

-- Tags index
CREATE INDEX idx_prompt_tags ON prompt_templates USING gin(tags);
```

**CRUD Operations:**

```
CREATE PROMPT:
1. Validate input (title, content, category)
2. Check user quota limits
3. Insert with user_id and metadata
4. Return prompt with generated ID

READ PROMPTS:
1. Apply RLS filters (user_id, is_deleted=false)
2. Apply search/filter criteria
3. Apply pagination (cursor-based)
4. Return with total count

UPDATE PROMPT:
1. Verify ownership via RLS
2. Validate changes
3. Update with new timestamp
4. Return updated prompt

DELETE PROMPT:
1. Soft delete (set is_deleted=true, deleted_at=now)
2. Update user quota counts
3. Return success confirmation
```

**Search and Filter System:**

```sql
-- Search query example
SELECT * FROM prompt_templates
WHERE user_id = $1
  AND is_deleted = FALSE
  AND (
    to_tsvector('english', title || ' ' || template_content) @@ plainto_tsquery('english', $2)
    OR tags && $3::text[]
    OR category = $4
  )
ORDER BY last_used_at DESC NULLS LAST, created_at DESC
LIMIT $5 OFFSET $6;
```

**Component Architecture:**

```
LibraryGrid
├── SearchBar (debounced, filters)
├── FilterPanel (category, tags, date range)
├── ToolBar (bulk actions, sort, view toggle)
├── PromptCard[] (with hover actions)
└── Pagination (infinite scroll or numbered)

PromptCard
├── Header (title, category badge)
├── Preview (truncated content)
├── Footer (date, tags, actions)
└── QuickActions (edit, duplicate, delete, copy)
```

**Real-time Sync:**

- Supabase real-time subscriptions for prompt changes
- Optimistic updates with rollback on failure
- Conflict resolution for concurrent edits
- Offline support with sync on reconnection

**Key Edge Cases:**

- Quota enforcement during bulk imports
- Handling prompts with very long content
- Search performance with thousands of prompts
- Simultaneous edits from multiple devices
- Recovery of accidentally deleted prompts

---

### Feature 6: Community Prompt Sharing

#### Goal

Create a community platform where Pro users can publish prompts and all users can discover, save, and rate community content.

#### API Relationships

- Supabase database with separate public prompts table
- Content moderation service integration
- Search and discovery algorithms
- Analytics tracking for popularity metrics

#### Detailed Requirements

- Pro users can publish private prompts to community
- All users can browse, search, and save community prompts
- Popularity scoring based on views, saves, and ratings
- Content moderation and reporting system
- Author attribution and profile pages
- Categories and trending sections
- Search with relevance ranking
- Rate limiting to prevent spam
- Community guidelines enforcement

#### Implementation Guide

**Database Schema - Community:**

```sql
CREATE TABLE community_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES profiles(id),
  original_prompt_id UUID REFERENCES prompt_templates(id),
  title TEXT NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  category TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  view_count INTEGER DEFAULT 0,
  save_count INTEGER DEFAULT 0,
  rating_average DECIMAL(3,2) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published', 'flagged', 'removed')),
  published_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE community_saves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  prompt_id UUID REFERENCES community_prompts(id),
  saved_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, prompt_id)
);

CREATE TABLE community_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  prompt_id UUID REFERENCES community_prompts(id),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, prompt_id)
);

-- Indexes for performance
CREATE INDEX idx_community_prompts_category ON community_prompts(category);
CREATE INDEX idx_community_prompts_popularity ON community_prompts(save_count DESC, view_count DESC);
CREATE INDEX idx_community_prompts_trending ON community_prompts(published_at DESC) WHERE status = 'published';
```

**Publishing Flow:**

```
1. User selects prompt from library → "Share to Community"
2. Modal opens with publishing form:
   - Community title (editable)
   - Description (optional)
   - Category selection
   - Tags (auto-suggest)
   - Preview of how it will appear
3. Submit → Content moderation check
4. If approved → Add to community feed
5. Author notification → Prompt goes live
```

**Discovery Algorithm:**

```sql
-- Trending prompts (recent with good engagement)
SELECT cp.*, p.full_name as author_name
FROM community_prompts cp
JOIN profiles p ON cp.author_id = p.id
WHERE cp.status = 'published'
  AND cp.published_at > NOW() - INTERVAL '7 days'
ORDER BY
  (cp.save_count * 3 + cp.view_count + cp.rating_average * cp.rating_count) DESC,
  cp.published_at DESC
LIMIT 20;

-- Category-based recommendations
SELECT cp.*, similarity(cp.content, $user_interests) as relevance_score
FROM community_prompts cp
WHERE cp.category = $category
  AND cp.status = 'published'
ORDER BY relevance_score DESC, cp.save_count DESC;
```

**Content Moderation:**

```
FUNCTION moderateContent(prompt):
  // Automated checks
  IF containsInappropriateContent(prompt.content):
    RETURN reject("Content policy violation")

  IF containsSpam(prompt.title, prompt.description):
    RETURN reject("Spam detected")

  IF isDuplicate(prompt.content):
    RETURN reject("Similar content already exists")

  // Human review queue for edge cases
  IF requiresHumanReview(prompt):
    RETURN queue_for_review(prompt)

  RETURN approve(prompt)
```

**Community Features:**

- Feed with infinite scroll
- Search with filters (category, rating, date)
- Author profiles with published prompts
- Save/unsave with optimistic updates
- Rating system with aggregate scores
- Report inappropriate content
- Featured/trending sections

**Key Edge Cases:**

- Handling viral prompts with high traffic
- Author deletes account but has published prompts
- Content that becomes inappropriate over time
- Duplicate content detection across variations
- Spam prevention and rate limiting

---

## Architecture Overview

### Tech Stack Justification

- **Next.js 14+**: App Router for improved performance, Server Components, and Server Actions
- **Supabase**: Managed PostgreSQL with built-in auth, real-time features, and Row Level Security
- **Stripe**: Industry-standard payment processing with comprehensive webhook system
- **LLM APIs**: Provider-agnostic wrapper supporting OpenAI, Anthropic, and future providers
- **Tailwind CSS**: Utility-first styling with consistent design system

### Deployment Architecture

```
Production Environment:
├── Vercel (Next.js hosting)
├── Supabase (Database + Auth)
├── Stripe (Payments)
├── LLM Provider APIs
└── CDN (Static assets)

Development Environment:
├── Local Next.js server
├── Supabase local development
├── Stripe test mode
└── LLM provider sandbox
```

### Security Implementation

- Row Level Security (RLS) for all database tables
- CSRF protection with Next.js built-in features
- Input sanitization and validation
- Rate limiting per user and endpoint
- Content Security Policy headers
- Secure session management with httpOnly cookies
- API key rotation and environment-based configs

### Performance Optimizations

- Database indexing strategy for fast queries
- Redis caching for frequently accessed data
- CDN for static assets and images
- Lazy loading and code splitting
- Optimistic UI updates with error rollback
- Debounced search and auto-save functionality

### Monitoring and Logging

- Structured logging with Winston or similar
- Error tracking with Sentry integration
- Performance monitoring with Web Vitals
- Usage analytics for quota management
- Database query performance monitoring
- LLM API usage and cost tracking

This comprehensive specification provides the foundation for building a robust, scalable AI Prompt Builder application with clear implementation guidelines for each feature.
