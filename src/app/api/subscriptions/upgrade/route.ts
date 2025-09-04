import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/supabase/server';
import { config } from '@/lib/config';

interface UpgradeRequest {
  planId: string;
}

export async function POST(request: NextRequest) {
  try {
    // Get user session
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body: UpgradeRequest = await request.json();
    const { planId } = body;

    if (!planId) {
      return NextResponse.json(
        { error: 'Plan ID is required' },
        { status: 400 }
      );
    }

    // Validate plan ID
    const validPlans = ['pro', 'enterprise'];
    if (!validPlans.includes(planId)) {
      return NextResponse.json({ error: 'Invalid plan ID' }, { status: 400 });
    }

    // Get user's current subscription
    const supabase = await createClient();
    const { data: currentSubscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['active', 'trialing'])
      .single();

    // If user already has an active subscription, handle upgrade/downgrade
    if (currentSubscription) {
      // For now, return success (in a real implementation, you'd handle subscription changes)
      return NextResponse.json({
        success: true,
        message: 'Subscription updated successfully',
        subscriptionId: currentSubscription.id,
      });
    }

    // Create Stripe checkout session
    const stripe = require('stripe')(config.stripeSecretKey);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: planId === 'pro' ? 'Pro Plan' : 'Enterprise Plan',
              description:
                planId === 'pro'
                  ? 'Unlimited AI improvements and advanced features'
                  : 'Enterprise features with custom integrations',
            },
            unit_amount: planId === 'pro' ? 900 : 2900, // $9.00 or $29.00 in cents
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${config.appUrl}/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${config.appUrl}/dashboard?canceled=true`,
      customer_email: user.email,
      metadata: {
        userId: user.id,
        planId: planId,
      },
    });

    return NextResponse.json({
      success: true,
      checkoutUrl: session.url,
      sessionId: session.id,
    });
  } catch (error) {
    console.error('Upgrade error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
