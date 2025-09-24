-- Supabase Migration Script for Homework Help GPT
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create subjects table
CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create homework_requests table
CREATE TABLE IF NOT EXISTS public.homework_requests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    subject VARCHAR(255) NOT NULL,
    question TEXT NOT NULL,
    difficulty_level VARCHAR(20) CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')) DEFAULT 'beginner',
    status VARCHAR(20) CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')) DEFAULT 'pending',
    solution TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_homework_requests_updated_at BEFORE UPDATE ON public.homework_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default subjects
INSERT INTO public.subjects (name, description, icon) VALUES
    ('Mathematics', 'Algebra, Calculus, Geometry, Statistics', '📐'),
    ('Physics', 'Mechanics, Thermodynamics, Electromagnetism', '⚛️'),
    ('Chemistry', 'Organic, Inorganic, Physical Chemistry', '🧪'),
    ('Biology', 'Cell Biology, Genetics, Ecology', '🔬'),
    ('Computer Science', 'Programming, Algorithms, Data Structures', '💻'),
    ('English', 'Literature, Grammar, Essay Writing', '📚'),
    ('History', 'World History, American History', '🏛️'),
    ('Geography', 'Physical and Human Geography', '🌍'),
    ('Economics', 'Microeconomics, Macroeconomics', '📈'),
    ('Psychology', 'Cognitive, Social, Developmental Psychology', '🧠')
ON CONFLICT (name) DO NOTHING;

-- Set up Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homework_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view their own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for homework_requests table
CREATE POLICY "Users can view their own homework requests" ON public.homework_requests
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own homework requests" ON public.homework_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own homework requests" ON public.homework_requests
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for subjects table (read-only for all authenticated users)
CREATE POLICY "Authenticated users can view subjects" ON public.subjects
    FOR SELECT USING (auth.role() = 'authenticated');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_homework_requests_user_id ON public.homework_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_homework_requests_status ON public.homework_requests(status);
CREATE INDEX IF NOT EXISTS idx_homework_requests_subject ON public.homework_requests(subject);
CREATE INDEX IF NOT EXISTS idx_homework_requests_created_at ON public.homework_requests(created_at DESC);

-- Create a view for homework request analytics
CREATE OR REPLACE VIEW public.homework_analytics AS
SELECT 
    subject,
    difficulty_level,
    status,
    COUNT(*) as count,
    AVG(EXTRACT(EPOCH FROM (updated_at - created_at))/3600) as avg_completion_hours
FROM public.homework_requests
GROUP BY subject, difficulty_level, status;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;
