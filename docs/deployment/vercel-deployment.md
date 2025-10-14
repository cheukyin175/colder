# Vercel Deployment Guide for Colder Backend

## Overview
This guide will help you deploy the Colder backend API to Vercel's serverless platform. Perfect for MVP and market testing with up to 500 users.

## Cost Estimate
- **Hosting**: FREE (Vercel Hobby tier)
- **Database**: FREE (Supabase free tier)
- **AI**: ~$4/month (Gemini Flash via OpenRouter)
- **Total**: ~$4/month 🎉

## Prerequisites
1. Vercel account (free at [vercel.com](https://vercel.com))
2. Supabase project (free at [supabase.com](https://supabase.com))
3. OpenRouter API key (from [openrouter.ai](https://openrouter.ai))

## Step 1: Prepare Your Backend

### Install Vercel CLI
```bash
npm i -g vercel
```

### Add Vercel Dependencies
```bash
pnpm --filter @colder/backend add -D @vercel/node
```

## Step 2: Configure Environment Variables

### Local Testing (.env.local)
Create `apps/backend/.env.local`:
```env
DATABASE_URL="your_supabase_connection_string"
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
SUPABASE_JWT_SECRET="your-jwt-secret-min-32-chars"
OPENROUTER_API_KEY="sk-or-v1-your-key"
DEFAULT_MODEL="google/gemini-2.0-flash-thinking-exp-1219"
```

### Production (Vercel Dashboard)
Set these in Vercel Dashboard > Settings > Environment Variables:
- `DATABASE_URL`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_JWT_SECRET`
- `OPENROUTER_API_KEY`
- `DEFAULT_MODEL`

## Step 3: Deploy to Vercel

### Option A: GitHub Integration (Recommended)
1. Push your code to GitHub
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your GitHub repository
4. Configure:
   - Framework Preset: Other
   - Root Directory: `./`
   - Build Command: `pnpm build:backend`
   - Output Directory: `apps/backend/dist`
5. Add environment variables
6. Deploy!

### Option B: CLI Deployment
```bash
# From project root
vercel

# Follow prompts:
# - Link to existing project or create new
# - Confirm settings
# - Deploy
```

## Step 4: Update Extension Configuration

Update your extension to use the production API:

```typescript
// apps/extension/src/lib/api.ts
const API_URL = process.env.NODE_ENV === 'production'
  ? 'https://your-app.vercel.app/api'
  : 'http://localhost:3000';
```

## Step 5: Database Setup

Run Prisma migrations on production:
```bash
# Set DATABASE_URL to production database
export DATABASE_URL="your_production_database_url"

# Run migrations
cd apps/backend
npx prisma migrate deploy
```

## Monitoring & Logs

### View Logs
```bash
vercel logs
```

### View Function Metrics
Visit: https://vercel.com/dashboard/[your-project]/functions

## Troubleshooting

### Cold Starts
First request might take 1-3 seconds. Solutions:
- Use `vercel --prod` for production deployment
- Consider upgrading to Pro ($20/month) for better performance

### Database Connection Issues
- Ensure DATABASE_URL includes `?pgbouncer=true` for connection pooling
- Use Prisma Data Proxy for better connection management

### CORS Issues
Already configured in `api/index.js` to allow all origins for Chrome extension.

## Performance Tips

1. **Enable Caching**: Add cache headers for repeated requests
2. **Optimize Bundle**: Minimize dependencies in backend
3. **Use Edge Functions**: For simple endpoints (future optimization)

## Deployment Checklist

- [ ] Environment variables set in Vercel dashboard
- [ ] Database migrations run
- [ ] Extension API URL updated
- [ ] Test all endpoints
- [ ] Monitor first few hours for errors

## Next Steps

Once your MVP is validated and you need to scale:
1. Consider Cloudflare Workers for better performance
2. Implement caching for AI responses
3. Add monitoring (Sentry, LogRocket)
4. Set up CI/CD pipeline

---

## Quick Commands Reference

```bash
# Deploy
vercel --prod

# Check deployment
vercel ls

# View logs
vercel logs

# Remove deployment
vercel rm [deployment-url]
```

## Support

For issues:
1. Check Vercel status: https://vercel.com/status
2. Check function logs: `vercel logs`
3. Verify environment variables are set correctly