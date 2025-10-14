# Local Testing Guide for Colder Payment System

## Overview
This guide will help you test the complete payment integration locally before deploying to production.

## Prerequisites

1. **Stripe Account**: Sign up at [stripe.com](https://stripe.com)
2. **Stripe CLI**: Install for webhook testing
   ```bash
   # macOS
   brew install stripe/stripe-cli/stripe

   # Or download from https://stripe.com/docs/stripe-cli
   ```

## Step 1: Environment Setup

### Backend Environment Variables
Create or update `/apps/backend/.env`:

```env
# Database
DATABASE_URL="your_supabase_database_url"

# Supabase
SUPABASE_URL="your_supabase_url"
SUPABASE_ANON_KEY="your_supabase_anon_key"
SUPABASE_SERVICE_KEY="your_supabase_service_key"

# OpenRouter (for AI)
OPENROUTER_API_KEY="your_openrouter_api_key"
DEFAULT_MODEL="google/gemini-flash-1.5"

# Stripe (Test Mode)
STRIPE_SECRET_KEY="sk_test_..." # Your test secret key
STRIPE_PRICE_ID="price_..." # Your test price ID
STRIPE_WEBHOOK_SECRET="whsec_..." # Will get this from Stripe CLI

# Frontend URL (for redirects)
FRONTEND_URL="chrome-extension://your-extension-id"
# For testing, you can use: FRONTEND_URL="http://localhost:3000"
```

## Step 2: Database Setup

### Run Prisma Migrations
```bash
# Navigate to backend
cd apps/backend

# Run migrations
pnpm prisma:migrate

# Generate Prisma Client
pnpm prisma:generate

# (Optional) Seed database with test data
pnpm prisma:seed
```

## Step 3: Create Stripe Product

### In Stripe Dashboard (Test Mode):

1. Go to **Products** → **Add Product**
2. Create product:
   - Name: "Colder Pro"
   - Description: "500 LinkedIn messages per month"
3. Add pricing:
   - Price: $9.99
   - Billing period: Monthly
4. Copy the **Price ID** (starts with `price_`) and add to `.env`

## Step 4: Start Local Services

### Terminal 1: Backend Server
```bash
cd apps/backend
pnpm dev
# Server runs on http://localhost:3000
```

### Terminal 2: Stripe Webhook Listener
```bash
stripe listen --forward-to localhost:3000/stripe/webhook
```
Copy the webhook signing secret (starts with `whsec_`) and update `STRIPE_WEBHOOK_SECRET` in `.env`

### Terminal 3: Extension Development
```bash
cd apps/extension
pnpm dev
# Extension builds and watches for changes
```

## Step 5: Test Payment Flow

### 1. Test User Registration
1. Load extension in Chrome (chrome://extensions/)
2. Sign up/login with Google
3. Check database to confirm user creation

### 2. Test Credit System

#### Free User (Default)
- Should have 5 credits
- Credits reset daily at midnight
- Test message generation uses 1 credit

#### Test Daily Reset
```bash
# Manually trigger credit reset (backend must be running)
curl -X POST http://localhost:3000/credits/manual-reset
```

### 3. Test Stripe Checkout

#### Create Checkout Session
```bash
# Get auth token first (from extension's localStorage)
AUTH_TOKEN="your_jwt_token"

# Create checkout session
curl -X POST http://localhost:3000/stripe/create-checkout-session \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json"
```

This returns a checkout URL. Open it in browser to test payment.

### 4. Test with Stripe Test Cards

| Scenario | Card Number | Details |
|----------|------------|---------|
| Success | 4242 4242 4242 4242 | Any future expiry, any CVC |
| Decline | 4000 0000 0000 0002 | Payment declined |
| 3D Secure | 4000 0025 0000 3155 | Requires authentication |

### 5. Verify Webhook Events

After completing checkout, check:
1. Terminal 2 should show webhook received
2. Database user should update:
   - `plan`: PRO
   - `credits`: 500
   - `subscriptionStatus`: active

## Step 6: Test Credit Deduction

### Generate Message (Uses Credits)
```bash
curl -X POST http://localhost:3000/generate/message \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "targetProfile": {
      "name": "John Doe",
      "currentJobTitle": "Software Engineer",
      "linkedinUrl": "https://linkedin.com/in/johndoe"
    },
    "tone": "professional",
    "purpose": "connection",
    "length": "medium"
  }'
```

Check that:
- Credits decreased by 1
- Response includes generated message

## Step 7: Test Subscription Management

### Create Portal Session
```bash
curl -X POST http://localhost:3000/stripe/create-portal-session \
  -H "Authorization: Bearer $AUTH_TOKEN"
```

Opens Stripe Customer Portal to:
- Cancel subscription
- Update payment method
- View invoices

## Step 8: Test Edge Cases

### 1. No Credits Available
- Use all 5 free credits
- Try to generate message
- Should get error with upgrade prompt

### 2. PRO User at Limit
- As PRO user, use all 500 credits
- Try to generate message
- Should get error with reset date

### 3. Subscription Cancellation
- Cancel subscription via portal
- Verify user reverts to FREE plan
- Credits should reset to 5

### 4. Payment Failure
- Use card 4000 0000 0000 0341
- Verify subscription marked as `past_due`

## Monitoring & Debugging

### Check Logs
```bash
# Backend logs
cd apps/backend && pnpm dev

# Database queries
# Add to backend .env: DATABASE_LOG_QUERIES=true
```

### Stripe Dashboard
- **Payments**: See all test transactions
- **Events**: View webhook events
- **Logs**: Check API request/response

### Database Inspection
```bash
# Open Prisma Studio
cd apps/backend
pnpm prisma:studio
# Opens at http://localhost:5555
```

## Common Issues & Solutions

### Webhook Not Working
- Ensure `stripe listen` is running
- Check webhook secret is correct
- Verify backend has rawBody enabled

### Credits Not Resetting
- Check timezone settings
- Verify cron job is registered
- Manual trigger: restart backend

### Extension Can't Connect
- Check CORS is enabled in backend
- Verify extension has correct backend URL
- Check auth token is valid

## Testing Checklist

- [ ] User can sign up and gets 5 free credits
- [ ] Credits deduct correctly on message generation
- [ ] Free user credits reset daily
- [ ] Checkout flow completes successfully
- [ ] PRO user gets 500 credits
- [ ] PRO credits deduct correctly
- [ ] Subscription cancellation works
- [ ] Customer portal accessible
- [ ] Webhook events processed
- [ ] Error messages are user-friendly

## Production Deployment Notes

Before deploying:
1. Switch to Stripe live keys
2. Update webhook endpoint URL
3. Set production environment variables
4. Test with real payment ($0.50 test charge)
5. Enable Stripe Radar for fraud protection

## Support

For issues:
1. Check Stripe logs in dashboard
2. Review backend console output
3. Inspect database with Prisma Studio
4. Test webhook with Stripe CLI

---

## Quick Commands Reference

```bash
# Install dependencies
pnpm install

# Run backend
cd apps/backend && pnpm dev

# Listen to webhooks
stripe listen --forward-to localhost:3000/stripe/webhook

# Run extension
cd apps/extension && pnpm dev

# Database management
pnpm prisma:migrate  # Run migrations
pnpm prisma:studio   # Open GUI
pnpm prisma:seed     # Add test data

# Test endpoints
curl http://localhost:3000/health  # Health check
```