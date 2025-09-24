-- Update email_verification_codes table to use the enum type
-- Run this in your Supabase SQL Editor

-- First, create a backup of the existing data
CREATE TABLE IF NOT EXISTS email_verification_codes_backup AS
SELECT * FROM email_verification_codes;

-- Drop the existing check constraint if it exists
ALTER TABLE email_verification_codes 
DROP CONSTRAINT IF EXISTS email_verification_codes_type_check;

-- Alter the type column to use the enum
ALTER TABLE email_verification_codes
ALTER COLUMN type TYPE "public"."VerificationCodeType" 
USING type::text::"public"."VerificationCodeType";

-- Verify the change
SELECT column_name, data_type, udt_name
FROM information_schema.columns
WHERE table_name = 'email_verification_codes'
AND column_name = 'type';
