# Supabase Integration Setup Guide

This guide will help you set up Supabase integration for your Homework Help GPT application.

## Prerequisites

- Supabase account ([sign up here](https://supabase.com))
- Node.js and npm/pnpm installed
- Next.js application (already set up)

## Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - Name: `homework-help-gpt`
   - Database Password: (generate a strong password)
   - Region: Choose closest to your users
5. Click "Create new project"

## Step 2: Get Your Project Credentials

1. Go to your project dashboard
2. Navigate to Settings → API
3. Copy the following values:
   - Project URL
   - anon public key
   - service_role key (keep this secret!)

## Step 3: Configure Environment Variables

1. Create a `.env.local` file in your project root (already created)
2. Update it with your actual Supabase credentials:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

## Step 4: Set Up Database Schema

1. In your Supabase dashboard, go to the SQL Editor
2. Copy the entire contents of `supabase-migration.sql`
3. Paste it into the SQL Editor
4. Click "Run" to execute the migration

This will create:

- `users` table for user profiles
- `subjects` table for homework subjects
- `homework_requests` table for homework submissions
- Row Level Security (RLS) policies
- Sample data for subjects

## Step 5: Test the Integration

1. Start your development server:

```bash
npm run dev
```

2. Navigate to `/test-supabase` in your browser
3. You should see:
   - ✅ Connection status showing "Connected to Supabase"
   - List of default subjects
   - Forms to create new subjects and homework requests
   - Statistics dashboard

## Step 6: Enable Authentication (Optional)

For production use, you'll want to enable Supabase Auth:

1. In Supabase dashboard, go to Authentication → Settings
2. Configure your auth providers (email, Google, GitHub, etc.)
3. Update your RLS policies if needed
4. Implement auth in your Next.js app

## Files Created

The integration includes these new files:

- `lib/supabase.ts` - Supabase client configuration
- `lib/database.types.ts` - TypeScript types for your database
- `lib/database-functions.ts` - Helper functions for database operations
- `app/test-supabase/page.tsx` - Test page to verify integration
- `supabase-migration.sql` - Database schema and initial data
- `.env.local` - Environment variables (update with your credentials)

## Database Schema Overview

### Users Table

- `id` (UUID, Primary Key)
- `email` (String, Unique)
- `full_name` (String, Optional)
- `avatar_url` (String, Optional)
- Timestamps: `created_at`, `updated_at`

### Subjects Table

- `id` (UUID, Primary Key)
- `name` (String, Unique)
- `description` (String, Optional)
- `icon` (String, Optional)
- Timestamp: `created_at`

### Homework Requests Table

- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key → users.id)
- `subject` (String)
- `question` (Text)
- `difficulty_level` (Enum: beginner, intermediate, advanced)
- `status` (Enum: pending, in_progress, completed, cancelled)
- `solution` (Text, Optional)
- Timestamps: `created_at`, `updated_at`

## Security Features

- **Row Level Security (RLS)** enabled on all tables
- Users can only access their own data
- Subjects are read-only for authenticated users
- Service role key for admin operations

## Available Functions

### User Functions

- `createUser(userData)` - Create a new user
- `getUserById(id)` - Get user by ID

### Homework Functions

- `createHomeworkRequest(requestData)` - Submit homework request
- `getHomeworkRequestsByUser(userId)` - Get user's homework requests
- `updateHomeworkRequestStatus(id, status, solution?)` - Update request

### Subject Functions

- `getAllSubjects()` - Get all available subjects
- `createSubject(subjectData)` - Create new subject (admin)

### Analytics Functions

- `getHomeworkStats(userId?)` - Get statistics
- Real-time subscriptions available

## Next Steps

1. Update your main application to use these database functions
2. Implement user authentication
3. Create admin dashboard for managing homework requests
4. Add real-time notifications
5. Implement file upload for homework attachments

## Troubleshooting

### Connection Issues

- Verify your environment variables are correct
- Check that your Supabase project is active
- Ensure you've run the migration script

### Permission Errors

- Check that RLS policies are set up correctly
- Verify user authentication status
- Make sure you're using the correct API keys

### Type Errors

- Ensure you've run `npm install @supabase/supabase-js`
- Check that your database types match the schema
- Regenerate types if schema changes

## Support

If you encounter issues:

1. Check the Supabase documentation
2. Review the test page at `/test-supabase`
3. Check browser console for error messages
4. Verify database schema in Supabase dashboard
