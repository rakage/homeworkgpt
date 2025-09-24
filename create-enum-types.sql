-- Create enum types for Prisma schema
-- Run this in your Supabase SQL Editor

-- Create VerificationCodeType enum
DO $$ BEGIN
    CREATE TYPE "public"."VerificationCodeType" AS ENUM (
        'signup',
        'password_reset',
        'email_change',
        'reset_token'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create DifficultyLevel enum
DO $$ BEGIN
    CREATE TYPE "public"."DifficultyLevel" AS ENUM (
        'beginner',
        'intermediate',
        'advanced'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create RequestStatus enum
DO $$ BEGIN
    CREATE TYPE "public"."RequestStatus" AS ENUM (
        'pending',
        'in_progress',
        'completed',
        'cancelled'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create SubscriptionTier enum
DO $$ BEGIN
    CREATE TYPE "public"."SubscriptionTier" AS ENUM (
        'basic',
        'plus'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create SubscriptionStatus enum
DO $$ BEGIN
    CREATE TYPE "public"."SubscriptionStatus" AS ENUM (
        'active',
        'canceled',
        'past_due',
        'incomplete',
        'trialing'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create BillingCycle enum
DO $$ BEGIN
    CREATE TYPE "public"."BillingCycle" AS ENUM (
        'monthly',
        'yearly'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Verify enums were created
SELECT typname, typcategory
FROM pg_type
WHERE typname IN (
    'VerificationCodeType',
    'DifficultyLevel',
    'RequestStatus',
    'SubscriptionTier',
    'SubscriptionStatus',
    'BillingCycle'
)
AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
