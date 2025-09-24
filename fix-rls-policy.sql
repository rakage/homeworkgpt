-- Fix: Add missing service role policy for profiles table
-- This allows webhooks to update user profiles

-- Add service role policy for profiles (if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' 
        AND policyname = 'Service role can manage profiles'
    ) THEN
        CREATE POLICY "Service role can manage profiles" ON public.profiles
            FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
    END IF;
END $$;
