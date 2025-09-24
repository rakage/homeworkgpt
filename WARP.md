# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is a **Homework Help GPT** application built with Next.js 14, featuring a complete SaaS platform with:

- AI-powered homework assistance system
- Supabase authentication with email verification codes (no magic links)
- Stripe subscription management (Basic & Plus plans)
- Full-stack TypeScript application with Prisma ORM
- Responsive UI built with Radix UI components and Tailwind CSS

## Essential Commands

### Development
```bash
npm run dev          # Start development server on localhost:3000
npm run build        # Build production application
npm run start        # Start production server
npm run lint         # Run Next.js ESLint
```

### Database (Prisma)
```bash
npx prisma generate                    # Generate Prisma client after schema changes
npx prisma db push                     # Push schema changes to Supabase (development)
npx prisma db pull                     # Pull latest schema from database
npx prisma studio                      # Open Prisma Studio database browser
```

### Supabase Commands
```bash
supabase start                         # Start local Supabase (if using local dev)
supabase status                        # Check Supabase project status
supabase db reset                      # Reset local database
```

## Architecture Overview

### Core Stack
- **Framework**: Next.js 14 with App Router
- **Database**: PostgreSQL via Supabase with Prisma ORM
- **Authentication**: Supabase Auth with custom email verification
- **Payments**: Stripe with webhooks
- **Styling**: Tailwind CSS + Radix UI components
- **Email**: Resend for transactional emails
- **Deployment**: Vercel (inferred from analytics integration)

### Directory Structure

```
app/                    # Next.js App Router pages and API routes
├── api/               # API endpoints
│   ├── auth/          # Authentication endpoints (verification codes)
│   ├── billing/       # Stripe billing endpoints
│   ├── homework/      # Homework request API
│   └── subscription/  # Subscription management + webhooks
├── auth/              # Authentication pages (login, register, subscribe)
├── billing/           # Billing and subscription pages
├── dashboard/         # Protected user dashboard
└── test-*/           # Testing pages for auth and Supabase

components/            # React components
├── auth/             # Authentication components
├── billing/          # Billing and subscription components
├── subscription/     # Subscription management UI
├── ui/               # Reusable UI components (shadcn/ui style)
└── *.tsx            # Landing page components (hero, pricing, etc.)

lib/                  # Utility libraries and services
├── services/         # Business logic services
│   ├── homework.service.ts      # Homework request handling
│   ├── users.service.ts         # User management
│   ├── subscriptions.service.ts # Subscription logic
│   └── email-verification.service.ts # Email verification
├── supabase*.ts      # Supabase client configurations
├── prisma.ts         # Prisma client setup
└── utils.ts          # General utilities

prisma/
└── schema.prisma     # Database schema with dual public/auth schemas
```

### Database Schema Architecture

The Prisma schema uses **dual schema architecture**:

1. **Public Schema**: Business logic (Users, Subjects, HomeworkRequest, Profile, Subscriptions)
2. **Auth Schema**: Supabase's built-in authentication tables

**Key Models**:
- `User` & `Profile`: User data with subscription info
- `HomeworkRequest`: Core homework assistance requests with difficulty levels
- `Subscription`: Stripe subscription tracking with usage limits
- `EmailVerificationCode`: Custom verification system (not magic links)

### Authentication Flow

**Custom Email Verification System**:
1. User registers → 6-digit verification code sent via email
2. Code verification → User account activated
3. Subscription selection required before dashboard access
4. Middleware enforces authentication on protected routes

**Protected Routes**: `/dashboard`, `/account`, `/billing`
**Auth Routes**: `/auth/login`, `/auth/register`, `/auth/subscribe`

### Payment Integration

**Stripe Setup**:
- Two-tier system: Basic ($9.99/mo) and Plus ($29.99/mo)
- Both monthly and yearly billing cycles
- Webhook handling for subscription events
- Customer portal integration for self-service billing

### Development Environment

**Required Environment Variables**:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
RESEND_API_KEY=
NEXT_PUBLIC_SITE_URL=
DATABASE_URL=
```

### Key Configuration Files

- `middleware.ts`: Route protection with subscription status checks
- `next.config.mjs`: Optimized for Windows development with build caching disabled
- `tsconfig.json`: Path aliases with `@/*` pointing to root directory
- `components.json`: Shadcn/ui configuration for component generation

### Setup Requirements

1. **Database**: Run SQL migrations from setup guide files (especially `supabase-auth-schema.sql`)
2. **Stripe Products**: Configure Basic/Plus plans with correct price IDs
3. **Email Domain**: Verify domain in Resend for email sending
4. **Webhooks**: Set up Stripe webhook endpoint at `/api/subscription/webhook`

### Testing Utilities

- Test pages at `/test-auth` and `/test-supabase` for debugging
- Comprehensive setup guides in root directory (`.md` files)
- Debug API endpoint at `/api/debug`

### Development Notes

- TypeScript strict mode enabled with build error ignoring for rapid development
- Prisma client regeneration needed after schema changes
- Supabase RLS policies handle data security
- Custom verification codes replace Supabase magic links
- Middleware handles complex authentication routing logic