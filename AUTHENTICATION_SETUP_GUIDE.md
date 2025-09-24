# Complete Authentication & Subscription System Setup Guide

This guide covers the complete setup of your Supabase authentication system with email verification codes and Stripe subscription management.

## 🎯 System Overview

Your authentication system includes:

- ✅ Email + Password registration with 6-digit verification codes
- ✅ Email verification (no magic links)
- ✅ Login/logout functionality
- ✅ Password reset with verification codes
- ✅ Stripe subscription management (Basic & Plus plans)
- ✅ Protected routes with middleware
- ✅ Complete billing portal integration
- ✅ Usage tracking and limits

## 📋 Prerequisites

1. **Supabase Project**: Create at [supabase.com](https://supabase.com)
2. **Stripe Account**: Create at [stripe.com](https://stripe.com)
3. **Email Service**: Resend account at [resend.com](https://resend.com)
4. **Domain**: Verified domain for email sending

## 🔧 Step 1: Environment Configuration

1. **Copy and rename the environment file:**

   ```bash
   cp env.local.example .env.local
   ```

2. **Update `.env.local` with your credentials:**

   ```env
   # Supabase (from your project dashboard)
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

   # Stripe (from dashboard.stripe.com/apikeys)
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...

   # Resend (from resend.com/api-keys)
   RESEND_API_KEY=re_...

   # Your domain
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

## 🗄️ Step 2: Database Setup

1. **Go to your Supabase SQL Editor**
2. **Copy and paste the entire contents of `supabase-auth-schema.sql`**
3. **Click "Run" to execute the migration**

This creates:

- Extended user profiles
- Email verification codes table
- Subscription management tables
- Usage tracking
- Row Level Security policies
- Database triggers and functions

## 💳 Step 3: Stripe Configuration

### Create Products and Prices

1. **Go to Stripe Dashboard → Products**
2. **Create "Basic Plan" product:**
   - Name: "Basic Plan"
   - Monthly price: $9.99
   - Yearly price: $99.99
3. **Create "Plus Plan" product:**

   - Name: "Plus Plan"
   - Monthly price: $29.99
   - Yearly price: $299.99

4. **Update price IDs in `components/subscription/pricing-cards.tsx`:**
   ```typescript
   stripePriceIds: {
     monthly: "price_1234567890", // Your actual Stripe price ID
     yearly: "price_0987654321"   // Your actual Stripe price ID
   }
   ```

### Set Up Webhooks

1. **Go to Stripe Dashboard → Webhooks**
2. **Add endpoint:** `https://yourdomain.com/api/subscription/webhook`
3. **Select events:**
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. **Copy webhook secret to your `.env.local`**

## 📧 Step 4: Email Configuration

1. **Verify your domain in Resend**
2. **Update the email sender in `app/api/auth/send-verification-code/route.ts`:**
   ```typescript
   from: 'noreply@yourdomain.com', // Replace with your verified domain
   ```

## 🧭 Step 5: Authentication Flow Testing

### Registration Flow

1. **Visit `/auth/register`**
2. **Fill out the form**
3. **Check email for 6-digit code**
4. **Enter verification code**
5. **Redirected to subscription selection**
6. **Complete Stripe checkout**
7. **Access dashboard**

### Login Flow

1. **Visit `/auth/login`**
2. **Enter credentials**
3. **Access dashboard**

### Password Reset

1. **Click "Forgot password?" on login**
2. **Enter email**
3. **Check email for 6-digit code**
4. **Enter code and new password**

## 🛡️ Step 6: Security & Production Setup

### Database Security

- ✅ Row Level Security enabled
- ✅ User isolation policies
- ✅ Service role restrictions

### API Security

- ✅ Rate limiting on verification codes
- ✅ Webhook signature verification
- ✅ User authentication checks

### Environment Security

```bash
# Production environment variables
NODE_ENV=production
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

## 📊 Step 7: Features Overview

### Authentication Features

- **Registration**: Email + password with verification
- **Login**: Standard email/password
- **Email Verification**: 6-digit codes (10-minute expiry)
- **Password Reset**: Secure code-based reset
- **Session Management**: Automatic token refresh

### Subscription Features

- **Plan Selection**: Basic ($9.99/mo) and Plus ($29.99/mo)
- **Billing Cycles**: Monthly and yearly options
- **Usage Tracking**: Request limits and monitoring
- **Billing Portal**: Stripe customer portal integration
- **Plan Changes**: Upgrade/downgrade with proration

### User Experience

- **Protected Routes**: Middleware-based route protection
- **Dashboard**: Usage stats and subscription info
- **Responsive Design**: Mobile-friendly interface
- **Loading States**: Smooth user feedback
- **Error Handling**: Comprehensive error messages

## 🧪 Step 8: Testing Checklist

### Registration & Verification

- [ ] User can register with email/password
- [ ] Verification code email is sent
- [ ] Code verification works correctly
- [ ] Invalid/expired codes are rejected
- [ ] Rate limiting prevents spam

### Authentication

- [ ] User can log in with correct credentials
- [ ] Invalid credentials are rejected
- [ ] Password reset flow works
- [ ] Session persistence works
- [ ] Logout functionality works

### Subscriptions

- [ ] Stripe checkout flow completes
- [ ] Webhooks update user subscription
- [ ] Usage tracking works correctly
- [ ] Billing portal access works
- [ ] Plan limits are enforced

### Access Control

- [ ] Unauthenticated users redirected to login
- [ ] Users without subscriptions redirected to pricing
- [ ] Protected routes require authentication
- [ ] Middleware handles edge cases

## 🚀 Step 9: Deployment

### Vercel Deployment

1. **Connect your GitHub repository**
2. **Add environment variables**
3. **Deploy and test**

### Domain Configuration

1. **Update `NEXT_PUBLIC_SITE_URL`**
2. **Update Stripe webhook URL**
3. **Update email sender domain**

## 🔍 Step 10: Monitoring & Analytics

### User Analytics

- Monitor registration conversion rates
- Track subscription conversion
- Monitor usage patterns
- Track churn rates

### Technical Monitoring

- API response times
- Error rates
- Webhook delivery status
- Email delivery rates

## 🆘 Troubleshooting

### Common Issues

**Email not sending:**

- Check Resend API key
- Verify domain authentication
- Check email template formatting

**Stripe checkout fails:**

- Verify price IDs
- Check webhook endpoint
- Validate environment variables

**Database errors:**

- Check RLS policies
- Verify user permissions
- Check connection strings

**Authentication issues:**

- Clear browser cookies
- Check JWT tokens
- Verify Supabase config

### Debug Tools

- Supabase Dashboard logs
- Stripe Dashboard events
- Browser Network tab
- Resend delivery logs

## 📞 Support

For additional help:

1. **Supabase**: [docs.supabase.com](https://docs.supabase.com)
2. **Stripe**: [docs.stripe.com](https://docs.stripe.com)
3. **Resend**: [docs.resend.com](https://docs.resend.com)
4. **Next.js**: [nextjs.org/docs](https://nextjs.org/docs)

## 🎉 Congratulations!

Your complete authentication and subscription system is now ready!

**Key Features Implemented:**

- ✅ Secure authentication with email verification
- ✅ Subscription management with Stripe
- ✅ Usage tracking and limits
- ✅ Protected routes and middleware
- ✅ Billing portal integration
- ✅ Responsive user interface
- ✅ Production-ready security

**Next Steps:**

1. Customize the UI to match your brand
2. Add additional features to your dashboard
3. Implement usage-based restrictions
4. Set up monitoring and analytics
5. Launch your application!

Your homework help application now has enterprise-grade authentication and billing capabilities. Users can securely register, verify their email, subscribe to plans, and manage their billing - all with a smooth, professional user experience.
