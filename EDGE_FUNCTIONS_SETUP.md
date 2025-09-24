# Supabase Edge Functions Setup Guide

This guide covers setting up the Supabase Edge Functions for your authentication system.

## 📋 Overview

The Edge Functions provide serverless functionality for:

- **send-verification-email**: Generates and sends 6-digit verification codes
- **verify-email-code**: Validates verification codes and creates user accounts
- **cleanup-expired-codes**: Cleans up expired/used verification codes (cron job)

## 🚀 Quick Setup

### 1. Install Supabase CLI

```bash
npm install -g supabase
```

### 2. Login to Supabase

```bash
supabase login
```

### 3. Link Your Project

```bash
supabase link --project-ref your-project-id
```

### 4. Deploy the Functions

```bash
# Deploy all functions
supabase functions deploy

# Or deploy individually
supabase functions deploy send-verification-email
supabase functions deploy verify-email-code
supabase functions deploy cleanup-expired-codes
```

## 🔧 Environment Variables

Set these environment variables in your Supabase project:

### In Supabase Dashboard → Settings → Edge Functions

```bash
RESEND_API_KEY=re_your_resend_api_key_here
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

## 📁 Function Details

### send-verification-email

- **Path**: `/supabase/functions/send-verification-email`
- **Purpose**: Generate and send 6-digit verification codes via email
- **Triggers**: Called from frontend registration/password reset forms
- **Environment Variables**: `RESEND_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`

### verify-email-code

- **Path**: `/supabase/functions/verify-email-code`
- **Purpose**: Validate verification codes and create user accounts
- **Triggers**: Called when user submits verification code
- **Environment Variables**: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`

### cleanup-expired-codes

- **Path**: `/supabase/functions/cleanup-expired-codes`
- **Purpose**: Clean up expired or used verification codes
- **Triggers**: Can be set up as a cron job
- **Environment Variables**: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`

## 🔄 Update API Routes (Optional)

If you want to use Edge Functions instead of Next.js API routes, update your frontend calls:

### Replace in your components:

**From:**

```typescript
const response = await fetch("/api/auth/send-verification-code", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, type, userData }),
});
```

**To:**

```typescript
const response = await fetch(
  `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-verification-email`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ email, type, userData }),
  }
);
```

## ⏰ Set Up Cron Job for Cleanup

### Option 1: Using Supabase Cron (Recommended)

In your Supabase SQL Editor, create a cron job:

```sql
-- Enable the pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule cleanup function to run every hour
SELECT cron.schedule(
    'cleanup-expired-codes',
    '0 * * * *', -- Every hour
    $$
    SELECT net.http_post(
        url := 'https://your-project-id.supabase.co/functions/v1/cleanup-expired-codes',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer your-service-role-key"}'::jsonb,
        body := '{}'::jsonb
    ) as request_id;
    $$
);
```

### Option 2: External Cron Service

Use services like Vercel Cron, GitHub Actions, or any cron service to call:

```
POST https://your-project-id.supabase.co/functions/v1/cleanup-expired-codes
Authorization: Bearer your-service-role-key
```

## 🧪 Testing the Functions

### Test send-verification-email:

```bash
curl -X POST \
  'https://your-project-id.supabase.co/functions/v1/send-verification-email' \
  -H 'Authorization: Bearer your-anon-key' \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "test@example.com",
    "type": "signup",
    "userData": {
      "email": "test@example.com",
      "password": "testpassword",
      "fullName": "Test User"
    }
  }'
```

### Test verify-email-code:

```bash
curl -X POST \
  'https://your-project-id.supabase.co/functions/v1/verify-email-code' \
  -H 'Authorization: Bearer your-anon-key' \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "test@example.com",
    "code": "123456",
    "type": "signup"
  }'
```

### Test cleanup-expired-codes:

```bash
curl -X POST \
  'https://your-project-id.supabase.co/functions/v1/cleanup-expired-codes' \
  -H 'Authorization: Bearer your-service-role-key' \
  -H 'Content-Type: application/json' \
  -d '{}'
```

## 🔍 Monitoring & Logs

### View Function Logs:

```bash
supabase functions logs send-verification-email
supabase functions logs verify-email-code
supabase functions logs cleanup-expired-codes
```

### In Supabase Dashboard:

- Go to **Edge Functions** → **Logs**
- Monitor function invocations and errors
- Check performance metrics

## 🚨 Troubleshooting

### Common Issues:

1. **Environment Variables Not Set**

   - Check Supabase Dashboard → Settings → Edge Functions
   - Ensure all required variables are set

2. **CORS Errors**

   - Functions include CORS headers
   - Check that your domain is allowed

3. **Email Not Sending**

   - Verify Resend API key
   - Check that sender domain is verified in Resend
   - Update `from` email in the function code

4. **Function Not Found**

   - Ensure functions are deployed: `supabase functions list`
   - Check function names match exactly

5. **Database Connection Issues**
   - Verify Supabase URL and service role key
   - Check that database tables exist

## 🔄 Deployment Workflow

### For Production:

1. **Test Functions Locally:**

   ```bash
   supabase start
   supabase functions serve
   ```

2. **Deploy to Production:**

   ```bash
   supabase functions deploy --project-ref your-project-id
   ```

3. **Set Production Environment Variables:**
   - Use production Resend API key
   - Use production Stripe keys
   - Update email sender domain

## 📚 Additional Resources

- [Supabase Edge Functions Documentation](https://supabase.com/docs/guides/functions)
- [Deno Runtime Documentation](https://deno.land/manual)
- [Resend API Documentation](https://resend.com/docs)

## ✅ Benefits of Edge Functions

- **Serverless**: No server management required
- **Global**: Run close to your users worldwide
- **Secure**: Service role key access for admin operations
- **Scalable**: Automatic scaling based on demand
- **Cost-Effective**: Pay only for what you use

Your Edge Functions are now ready to handle email verification with enterprise-grade reliability and performance!
