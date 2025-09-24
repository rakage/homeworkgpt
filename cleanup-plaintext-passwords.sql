-- CRITICAL SECURITY FIX: Clean up plain text passwords from email_verification_codes table
-- This script removes plain text passwords from the user_data JSONB column

-- First, let's see how many records contain plain text passwords
SELECT COUNT(*) as records_with_passwords
FROM public.email_verification_codes 
WHERE user_data ? 'password';

-- Update records to remove plain text passwords but keep other data
UPDATE public.email_verification_codes 
SET user_data = user_data - 'password'
WHERE user_data ? 'password';

-- Verify the cleanup
SELECT COUNT(*) as remaining_passwords_after_cleanup
FROM public.email_verification_codes 
WHERE user_data ? 'password';

-- Optional: Clean up old verification codes that are expired (security best practice)
DELETE FROM public.email_verification_codes 
WHERE expires_at < NOW() - INTERVAL '1 day';

-- Add a comment for future reference
COMMENT ON COLUMN public.email_verification_codes.user_data IS 'User data for verification - NEVER store plain text passwords';

-- Log the cleanup
INSERT INTO public.email_verification_codes (email, code, type, expires_at, user_data) 
VALUES ('system@cleanup.log', '000000', 'system_log', NOW() + INTERVAL '1 year', 
        '{"action": "security_cleanup", "description": "Removed plain text passwords", "timestamp": "' || NOW()::text || '"}');

SELECT 'Security cleanup completed. Plain text passwords have been removed from verification codes.' as status;
