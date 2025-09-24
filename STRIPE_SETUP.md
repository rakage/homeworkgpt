# Stripe Integration Setup Guide

This guide will help you set up Stripe for subscription management in your Homework Help GPT application.

## 📋 Overview

The upgrade system includes:

- **Upgrade Modal**: Beautiful pricing display with monthly/yearly toggle
- **Upgrade Buttons**: Various button components for different contexts
- **Stripe Checkout**: Secure payment processing
- **Webhook Handling**: Automatic subscription status updates

## 🚀 Quick Setup

### 1. Create Stripe Account

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Sign up for a Stripe account (or log in)
3. Complete your account setup

### 2. Get API Keys

In your Stripe Dashboard:

1. Go to **Developers** → **API keys**
2. Copy your **Publishable key** and **Secret key**
3. Go to **Developers** → **Webhooks**
4. Create an endpoint (we'll do this later)

### 3. Create Products and Prices

Create your subscription products in Stripe:

#### Basic Plan

1. Go to **Products** → **Add product**
2. Set name: "Basic Plan"
3. Set description: "100 requests per month with advanced features"
4. Create **two prices**:
   - Monthly: $9.99/month
   - Yearly: $99.99/year (20% discount)

#### Plus Plan

1. Go to **Products** → **Add product**
2. Set name: "Plus Plan"
3. Set description: "Unlimited requests with premium features"
4. Create **two prices**:
   - Monthly: $29.99/month
   - Yearly: $299.99/year (20% discount)

### 4. Get Price IDs

After creating prices, copy the Price IDs (they start with `price_`):

```
Basic Monthly: price_1ABC123...
Basic Yearly: price_1DEF456...
Plus Monthly: price_1GHI789...
Plus Yearly: price_1JKL012...
```

### 5. Update Environment Variables

Add these to your `.env.local` file:

```env
# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_SECRET_KEY=sk_test_your_secret_key_here

# Stripe Price IDs
STRIPE_BASIC_MONTHLY_PRICE_ID=price_1ABC123...
STRIPE_BASIC_YEARLY_PRICE_ID=price_1DEF456...
STRIPE_PLUS_MONTHLY_PRICE_ID=price_1GHI789...
STRIPE_PLUS_YEARLY_PRICE_ID=price_1JKL012...
```

### 6. Set Up Webhooks

1. In Stripe Dashboard, go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Set endpoint URL: `https://yourdomain.com/api/subscription/webhook`
4. Select these events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the **Signing secret** (starts with `whsec_`)
6. Add to your `.env.local`:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
   ```

## 🧪 Testing the Integration

### 1. Test the Upgrade Flow

1. **Start your development server:**

   ```bash
   npm run dev
   ```

2. **Navigate to dashboard:**

   ```
   http://localhost:3000/dashboard
   ```

3. **Click "Upgrade Plan" button**

4. **Test the modal:**
   - Switch between Monthly/Yearly billing
   - Click upgrade on different plans
   - Should redirect to Stripe Checkout

### 2. Test with Stripe Test Cards

Use these test card numbers:

- **Successful payment:** `4242 4242 4242 4242`
- **Declined payment:** `4000 0000 0000 0002`
- **Requires authentication:** `4000 0025 0000 3155`

Use any future expiry date and any 3-digit CVC.

### 3. Test Webhooks Locally

For local testing, use Stripe CLI:

1. **Install Stripe CLI:**

   ```bash
   npm install -g stripe
   ```

2. **Login to Stripe:**

   ```bash
   stripe login
   ```

3. **Forward webhooks to local server:**

   ```bash
   stripe listen --forward-to localhost:3000/api/subscription/webhook
   ```

4. **Copy the webhook signing secret** and add to `.env.local`

## 🔧 Component Usage

### Basic Upgrade Button

```tsx
import { UpgradeButton } from "@/components/subscription/upgrade-button";

// Simple upgrade button
<UpgradeButton currentTier="free" />

// Custom styling
<UpgradeButton
  currentTier="basic"
  variant="outline"
  size="lg"
  className="w-full"
>
  Upgrade to Plus
</UpgradeButton>
```

### Dashboard Upgrade Button

```tsx
import { DashboardUpgradeButton } from "@/components/subscription/upgrade-button";

// Automatically styled for dashboard
<DashboardUpgradeButton currentTier={user.subscription_tier} />;
```

### Usage Limit Warning

```tsx
import { LimitUpgradeButton } from "@/components/subscription/upgrade-button";

// Shows warning when near limit
<LimitUpgradeButton
  currentTier="basic"
  message="You've used 90% of your monthly limit"
/>;
```

### Direct Modal Access

```tsx
import { UpgradeModal } from "@/components/subscription/upgrade-modal";

const [showModal, setShowModal] = useState(false);

<UpgradeModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  currentTier="free"
/>;
```

## 🔄 Subscription Flow

### 1. User Journey

1. User clicks upgrade button
2. Modal shows pricing options
3. User selects plan and billing cycle
4. Redirects to Stripe Checkout
5. After payment, redirects back to dashboard
6. Webhook updates user's subscription status

### 2. Database Updates

The webhook automatically updates:

- `profiles.subscription_tier`
- `profiles.subscription_status`
- `profiles.customer_id`
- `profiles.current_period_start/end`
- `subscriptions` table record

## 🛡️ Security Features

- **Server-side validation**: All payment processing server-side
- **Webhook verification**: Validates webhook signatures
- **RLS policies**: Row-level security for subscription data
- **Rate limiting**: Prevents API abuse

## 🎨 Customization

### Pricing Display

Update prices in `components/subscription/upgrade-modal.tsx`:

```tsx
const plans: Plan[] = [
  {
    id: "basic",
    name: "Basic",
    price: {
      monthly: 9.99, // Update these values
      yearly: 99.99,
    },
    features: [
      "100 requests per month",
      // Add/modify features
    ],
  },
  // ...
];
```

### Styling

The components use Tailwind CSS and shadcn/ui. Customize in:

- `components/subscription/upgrade-modal.tsx`
- `components/subscription/upgrade-button.tsx`

### Success/Cancel URLs

Update redirect URLs in `app/api/subscription/create-checkout-session/route.ts`:

```tsx
success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?upgrade=success`,
cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?upgrade=cancelled`,
```

## 🚨 Troubleshooting

### Common Issues

1. **"Invalid price ID" error**

   - Check that your Stripe price IDs are correct
   - Ensure they exist in your Stripe dashboard

2. **Webhook not working**

   - Verify webhook endpoint URL
   - Check webhook signing secret
   - Look at webhook logs in Stripe dashboard

3. **Subscription not updating**

   - Check webhook events are configured
   - Verify database permissions
   - Check API logs for errors

4. **Payment not processing**
   - Ensure test mode vs live mode consistency
   - Check API keys are for same environment
   - Verify card details in test mode

### Debug Tools

1. **Stripe Dashboard Logs**

   - Go to Developers → Events
   - Check API request logs

2. **Webhook Testing**

   - Use Stripe CLI for local testing
   - Check webhook delivery attempts

3. **Database Queries**
   - Check Supabase logs
   - Verify RLS policies

## 🌐 Production Deployment

### 1. Live Mode Setup

1. Activate your Stripe account
2. Switch to live API keys
3. Update webhook endpoints
4. Test with real cards (small amounts)

### 2. Environment Variables

Update your production environment with live Stripe keys.

### 3. Webhook Endpoint

Ensure your production webhook URL is accessible:

- `https://yourdomain.com/api/subscription/webhook`

## 📊 Analytics & Monitoring

### Subscription Metrics

- Track conversion rates in Stripe Dashboard
- Monitor failed payments
- Analyze customer lifetime value

### Application Metrics

- Usage patterns by subscription tier
- Feature adoption rates
- Churn analysis

## ✅ Success!

Your upgrade system is now ready! Users can:

- View pricing plans in a beautiful modal
- Switch between monthly/yearly billing
- Complete secure payments via Stripe
- Automatically get upgraded features
- Manage their subscription

The system is fully integrated with your existing authentication and database structure.
