-- Authentication and Subscription System Database Schema
-- Run this in your Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    subscription_tier TEXT CHECK (subscription_tier IN ('basic', 'plus')) DEFAULT NULL,
    subscription_status TEXT CHECK (subscription_status IN ('active', 'canceled', 'past_due', 'incomplete', 'trialing')) DEFAULT NULL,
    subscription_id TEXT, -- Stripe subscription ID
    customer_id TEXT, -- Stripe customer ID
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create email verification codes table
CREATE TABLE IF NOT EXISTS public.email_verification_codes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email TEXT NOT NULL,
    code TEXT NOT NULL, -- 6-digit verification code
    type TEXT CHECK (type IN ('signup', 'password_reset', 'email_change', 'reset_token')) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    user_data JSONB, -- Store temporary user data for signup
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create subscriptions table (detailed subscription history)
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    stripe_subscription_id TEXT UNIQUE NOT NULL,
    stripe_customer_id TEXT NOT NULL,
    status TEXT NOT NULL,
    tier TEXT CHECK (tier IN ('basic', 'plus')) NOT NULL,
    billing_cycle TEXT CHECK (billing_cycle IN ('monthly', 'yearly')) NOT NULL,
    amount INTEGER NOT NULL, -- in cents
    currency TEXT DEFAULT 'usd',
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    canceled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create usage tracking table (for rate limiting)
CREATE TABLE IF NOT EXISTS public.user_usage (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    month DATE NOT NULL, -- YYYY-MM-01 format
    requests_count INTEGER DEFAULT 0,
    tier TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, month)
);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at 
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_usage_updated_at 
    BEFORE UPDATE ON public.user_usage
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Create trigger for new user registration
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to clean up expired verification codes
CREATE OR REPLACE FUNCTION public.cleanup_expired_codes()
RETURNS void AS $$
BEGIN
    DELETE FROM public.email_verification_codes 
    WHERE expires_at < NOW() OR used = TRUE;
END;
$$ language 'plpgsql';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_status ON public.profiles(subscription_status);
CREATE INDEX IF NOT EXISTS idx_verification_codes_email ON public.email_verification_codes(email);
CREATE INDEX IF NOT EXISTS idx_verification_codes_code ON public.email_verification_codes(code);
CREATE INDEX IF NOT EXISTS idx_verification_codes_expires_at ON public.email_verification_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_id ON public.subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_user_usage_user_month ON public.user_usage(user_id, month);

-- Set up Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_verification_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Service role can manage profiles" ON public.profiles
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- RLS Policies for verification codes (only allow service role access)
CREATE POLICY "Service role can manage verification codes" ON public.email_verification_codes
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- RLS Policies for subscriptions
CREATE POLICY "Users can view their own subscriptions" ON public.subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage subscriptions" ON public.subscriptions
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- RLS Policies for user usage
CREATE POLICY "Users can view their own usage" ON public.user_usage
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage usage" ON public.user_usage
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Create view for user subscription details
CREATE OR REPLACE VIEW public.user_subscription_details AS
SELECT 
    p.id,
    p.email,
    p.full_name,
    p.subscription_tier,
    p.subscription_status,
    p.current_period_start,
    p.current_period_end,
    s.billing_cycle,
    s.amount,
    s.currency,
    uu.requests_count,
    CASE 
        WHEN p.subscription_tier = 'basic' THEN 100  -- Basic tier limit
        WHEN p.subscription_tier = 'plus' THEN -1    -- Unlimited for plus
        ELSE 10  -- Free tier limit
    END as monthly_request_limit
FROM public.profiles p
LEFT JOIN public.subscriptions s ON p.id = s.user_id AND s.status = 'active'
LEFT JOIN public.user_usage uu ON p.id = uu.user_id AND uu.month = DATE_TRUNC('month', NOW())::DATE;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Insert default usage limits configuration
CREATE TABLE IF NOT EXISTS public.subscription_limits (
    tier TEXT PRIMARY KEY,
    monthly_requests INTEGER,
    features JSONB,
    price_monthly_cents INTEGER,
    price_yearly_cents INTEGER
);

INSERT INTO public.subscription_limits (tier, monthly_requests, features, price_monthly_cents, price_yearly_cents) VALUES
('free', 10, '{"core_functionality": true, "analytics": false, "api_access": false, "priority_support": false}', 0, 0),
('basic', 100, '{"core_functionality": true, "analytics": true, "api_access": false, "priority_support": false}', 999, 9999),
('plus', -1, '{"core_functionality": true, "analytics": true, "api_access": true, "priority_support": true, "export_capabilities": true}', 2999, 29999)
ON CONFLICT (tier) DO UPDATE SET
    monthly_requests = EXCLUDED.monthly_requests,
    features = EXCLUDED.features,
    price_monthly_cents = EXCLUDED.price_monthly_cents,
    price_yearly_cents = EXCLUDED.price_yearly_cents;
