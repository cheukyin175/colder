# Stripe Payment Integration Setup

## Overview
This guide will help you set up Stripe payments for your Colder Chrome extension.

## Pricing Structure
- **FREE Plan**: 5 credits per day (resets at midnight)
- **PRO Plan**: $9.99/month - 500 messages per month

## Step 1: Create Stripe Account

1. Sign up at [stripe.com](https://stripe.com)
2. Complete your business profile
3. Note: You can test in Test Mode before going live

## Step 2: Create Your Product & Price

### In Stripe Dashboard:

1. Go to **Products** → **Add Product**
2. Create product:
   - Name: "Colder Pro"
   - Description: "500 LinkedIn outreach messages per month"

3. Add pricing:
   - Price: $9.99
   - Billing period: Monthly
   - Currency: USD

4. Copy the **Price ID** (starts with `price_`)

## Step 3: Get Your API Keys

### Test Mode (Development):
1. Go to **Developers** → **API Keys**
2. Copy:
   - **Publishable key**: `pk_test_...`
   - **Secret key**: `sk_test_...`

### Live Mode (Production):
1. Switch to Live Mode
2. Copy:
   - **Publishable key**: `pk_live_...`
   - **Secret key**: `sk_live_...`

## Step 4: Set Up Webhook

### Create Webhook Endpoint:
1. Go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Endpoint URL: `https://your-api.vercel.app/stripe/webhook`
4. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy **Webhook signing secret** (`whsec_...`)

## Step 5: Configure Environment Variables

### Add to `.env` (Backend):
```env
# Stripe
STRIPE_SECRET_KEY="sk_test_..." # Your secret key
STRIPE_PRICE_ID="price_..." # Your price ID
STRIPE_WEBHOOK_SECRET="whsec_..." # Your webhook secret

# Frontend URL (for redirects)
FRONTEND_URL="chrome-extension://your-extension-id"
# Or for testing: FRONTEND_URL="http://localhost:3000"
```

### Add to Vercel Environment Variables:
Same variables as above, but use production keys when going live.

## Step 6: Update Your Extension

### Create Payment Page (`apps/extension/src/payment.tsx`):
```typescript
import React from 'react';
import { supabase } from './lib/supabase';

export function PaymentPage() {
  const handleUpgrade = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      alert('Please sign in first');
      return;
    }

    // Call your backend to create checkout session
    const response = await fetch(`${API_URL}/stripe/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${await getAuthToken()}`,
        'Content-Type': 'application/json',
      },
    });

    const { url } = await response.json();

    // Open Stripe Checkout in new tab
    chrome.tabs.create({ url });
  };

  const handleManageSubscription = async () => {
    // Call your backend to create portal session
    const response = await fetch(`${API_URL}/stripe/create-portal-session`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${await getAuthToken()}`,
        'Content-Type': 'application/json',
      },
    });

    const { url } = await response.json();

    // Open Customer Portal in new tab
    chrome.tabs.create({ url });
  };

  return (
    <div>
      <h2>Upgrade to Pro</h2>
      <ul>
        <li>500 messages per month</li>
        <li>Priority support</li>
        <li>Advanced features</li>
      </ul>
      <button onClick={handleUpgrade}>
        Upgrade for $9.99/month
      </button>
      <button onClick={handleManageSubscription}>
        Manage Subscription
      </button>
    </div>
  );
}
```

## Step 7: Handle Credits in Your App

### Update Generate Service:
The generate service now uses the CreditsService to check and deduct credits:

```typescript
// Before generating a message
const userCredits = await this.creditsService.getUserCredits(userId);

if (userCredits.credits <= 0 && !userCredits.isUnlimited) {
  throw new Error('No credits available. Please upgrade to Pro!');
}

// After successful generation
await this.creditsService.deductCredits(userId);
```

## Step 8: Test Your Integration

### Test Checklist:
1. [ ] Create a test subscription using Stripe test cards
2. [ ] Verify webhook receives events
3. [ ] Check database updates correctly
4. [ ] Test credit deduction for free users
5. [ ] Test 500 credit limit for pro users
6. [ ] Test subscription cancellation
7. [ ] Test daily credit reset

### Test Card Numbers:
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Requires auth: `4000 0025 0000 3155`

## Step 9: Go Live

### Production Checklist:
1. [ ] Switch to live Stripe keys
2. [ ] Update webhook URL to production
3. [ ] Test with real payment
4. [ ] Set up error monitoring
5. [ ] Enable Stripe Radar (fraud protection)

## Monitoring

### Track Key Metrics:
- Conversion rate (free → paid)
- Churn rate
- Average revenue per user (ARPU)
- Failed payment rate

### Stripe Dashboard:
- View subscriptions: **Customers** → **Subscriptions**
- View revenue: **Dashboard** → **Revenue**
- View failed payments: **Payments** → **Failed**

## Support & Troubleshooting

### Common Issues:

**Webhook not receiving events:**
- Check webhook URL is correct
- Verify webhook secret is set
- Check server logs for errors

**Credits not updating:**
- Verify database migrations are run
- Check cron job is running
- Verify timezone settings

**Payment fails:**
- Check Stripe dashboard for decline reason
- Verify customer has valid payment method
- Check for Radar rules blocking payment

## Revenue Optimization Tips

1. **Add annual plan**: Offer 2 months free (e.g., $99/year)
2. **Limited-time offers**: First month 50% off
3. **Referral program**: Give credits for referrals
4. **Usage-based tiers**: Different message limits
5. **Team plans**: Multiple users under one subscription

## Legal Requirements

1. **Terms of Service**: Include subscription terms
2. **Privacy Policy**: Explain data handling
3. **Refund Policy**: Clear refund rules
4. **Tax handling**: Use Stripe Tax or handle manually

---

## Quick Start Commands

```bash
# Install dependencies
pnpm --filter @colder/backend add stripe @nestjs/schedule

# Run migrations
pnpm prisma:migrate

# Test webhook locally (using Stripe CLI)
stripe listen --forward-to localhost:3000/stripe/webhook

# Deploy to production
pnpm deploy
```