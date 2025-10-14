# Colder Backend API Documentation

## Overview

The Colder Backend API provides endpoints for message generation, user settings management, credit tracking, and subscription handling through Stripe integration. All endpoints (except webhooks and static pages) require JWT authentication.

## Base URL

```
http://localhost:3000
```

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

The JWT token contains the user information with the following payload structure:
```json
{
  "userId": "string",
  "email": "string",
  "iat": "number",
  "exp": "number"
}
```

## API Endpoints

### 1. Application Health Check

#### GET /
Health check endpoint to verify the API is running.

**Authentication:** Not required

**Response:**
```json
"Hello World!"
```

---

### 2. Settings Management

#### GET /settings
Retrieve user settings for the authenticated user.

**Authentication:** Required

**Response:**
```json
{
  "userName": "string",
  "userRole": "string",
  "userCompany": "string",
  "userBackground": "string",
  "userValueProposition": "string"
}
```

#### PUT /settings
Update user settings for the authenticated user.

**Authentication:** Required

**Request Body:**
```json
{
  "userName": "string (optional)",
  "userRole": "string (optional)",
  "userCompany": "string (optional)",
  "userBackground": "string (optional)",
  "userValueProposition": "string (optional)"
}
```

**Response:**
```json
{
  "userName": "string",
  "userRole": "string",
  "userCompany": "string",
  "userBackground": "string",
  "userValueProposition": "string"
}
```

---

### 3. Message Generation

#### POST /generate
Generate a new personalized message for a target LinkedIn profile.

**Authentication:** Required

**Request Body:**
```json
{
  "targetProfile": {
    "id": "string",
    "linkedinUrl": "string",
    "name": "string",
    "currentJobTitle": "string (optional)",
    "currentCompany": "string (optional)",
    "rawProfileText": "string"
  },
  "tone": "professional | casual | enthusiastic | formal | friendly (optional)",
  "purpose": "connection | coffee_chat | informational_interview | collaboration | job_inquiry | sales | custom (optional)",
  "customPurpose": "string (optional - required if purpose is 'custom')",
  "length": "short | medium | long (optional)"
}
```

**Response:**
```json
{
  "message": "string",
  "creditsUsed": "number",
  "remainingCredits": "number"
}
```

**Note:** This endpoint will deduct credits from the user's account upon successful generation.

#### POST /generate/regenerate
Regenerate a message with the same parameters. Functions identically to `/generate`.

**Authentication:** Required

**Request Body:** Same as `/generate`

**Response:** Same as `/generate`

#### POST /generate/polish
Polish an existing message based on user feedback.

**Authentication:** Required

**Request Body:**
```json
{
  "originalMessage": "string",
  "userFeedback": "string",
  "tone": "professional | casual | enthusiastic | formal | friendly (optional)",
  "length": "short | medium | long (optional)"
}
```

**Response:**
```json
{
  "message": "string",
  "creditsUsed": "number",
  "remainingCredits": "number"
}
```

---

### 4. Credits Management

#### GET /credits/status
Get the current user's credit status.

**Authentication:** Required

**Response:**
```json
{
  "credits": "number",
  "plan": "free | pro | premium",
  "subscriptionStatus": "active | inactive | cancelled | past_due",
  "subscriptionEndDate": "ISO 8601 date string or null"
}
```

---

### 5. Stripe Integration

#### POST /stripe/create-checkout-session
Create a Stripe checkout session for subscription purchase.

**Authentication:** Required

**Response:**
```json
{
  "url": "string (Stripe checkout URL)"
}
```

**Usage:** Redirect the user to the returned URL to complete payment.

#### POST /stripe/create-portal-session
Create a Stripe customer portal session for subscription management.

**Authentication:** Required

**Response:**
```json
{
  "url": "string (Stripe portal URL)"
}
```

**Usage:** Redirect the user to the returned URL to manage their subscription.

#### GET /stripe/subscription-status
Get detailed subscription status for the authenticated user.

**Authentication:** Required

**Response:**
```json
{
  "plan": "free | pro | premium",
  "status": "active | inactive | cancelled | past_due",
  "endDate": "ISO 8601 date string or null",
  "credits": "number"
}
```

#### POST /stripe/webhook
Webhook endpoint for Stripe events.

**Authentication:** Not required (uses Stripe signature verification)

**Headers Required:**
- `stripe-signature`: Stripe webhook signature

**Request Body:** Raw webhook payload from Stripe

**Response:**
```json
{
  "received": true
}
```

**Handled Events:**
- `checkout.session.completed`: Activates subscription after successful payment
- `customer.subscription.updated`: Updates subscription status
- `customer.subscription.deleted`: Handles subscription cancellation
- `invoice.payment_succeeded`: Processes successful payments
- `invoice.payment_failed`: Handles failed payments

#### GET /stripe/success
Success page displayed after successful Stripe checkout.

**Authentication:** Not required

**Response:** HTML page with success message

#### GET /stripe/cancel
Cancel page displayed when user cancels Stripe checkout.

**Authentication:** Not required

**Response:** HTML page with cancellation message

---

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Error description",
  "error": "Bad Request"
}
```

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "statusCode": 403,
  "message": "Insufficient credits",
  "error": "Forbidden"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Resource not found",
  "error": "Not Found"
}
```

### 500 Internal Server Error
```json
{
  "statusCode": 500,
  "message": "Internal server error",
  "error": "Internal Server Error"
}
```

---

## Rate Limiting

The API implements rate limiting to prevent abuse. Current limits:
- 100 requests per minute per IP address
- 1000 requests per hour per authenticated user

---

## Credit System

### Credit Usage
- Message generation: 1 credit per generation
- Message regeneration: 1 credit per regeneration
- Message polish: 1 credit per polish

### Credit Allocation by Plan
- **Free Plan**: 10 credits per month
- **Pro Plan**: 500 credits per month
- **Premium Plan**: Unlimited credits

Credits reset on the first day of each billing cycle.

---

## Webhooks Configuration

For local development with Stripe webhooks:
1. Install Stripe CLI
2. Run: `stripe listen --forward-to localhost:3000/stripe/webhook`
3. Set the webhook signing secret in your environment variables

For production:
1. Configure webhook endpoint in Stripe Dashboard
2. Set endpoint URL to: `https://your-domain.com/stripe/webhook`
3. Subscribe to required events
4. Save the webhook signing secret

---

## Environment Variables

Required environment variables for the backend:

```env
# Database
DATABASE_URL=postgresql://...

# Supabase
SUPABASE_URL=https://...
SUPABASE_SERVICE_KEY=...

# JWT
JWT_SECRET=...

# Stripe
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_PRICE_ID=price_...

# OpenRouter (for AI message generation)
OPENROUTER_API_KEY=...
```

---

## Testing the API

### Using cURL

#### Get user settings:
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:3000/settings
```

#### Generate a message:
```bash
curl -X POST http://localhost:3000/generate \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "targetProfile": {
      "id": "john-doe",
      "linkedinUrl": "https://linkedin.com/in/john-doe",
      "name": "John Doe",
      "currentJobTitle": "Software Engineer",
      "currentCompany": "Tech Corp",
      "rawProfileText": "Experienced software engineer..."
    },
    "tone": "professional",
    "purpose": "connection",
    "length": "medium"
  }'
```

#### Check credit status:
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:3000/credits/status
```

### Using Postman

1. Create a new collection named "Colder API"
2. Add environment variable `jwt_token` with your JWT
3. Set Authorization type to "Bearer Token" with value `{{jwt_token}}`
4. Import the endpoints from this documentation

---

## Support

For API issues or questions, please refer to:
- [Local Testing Guide](../local-testing-guide.md)
- [Stripe Setup Guide](../stripe-setup.md)
- [Architecture Documentation](../architecture/README.md)