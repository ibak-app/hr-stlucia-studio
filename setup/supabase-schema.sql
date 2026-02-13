-- ============================================
-- Talent by St. Lucia Studio — Full Database Schema
-- Run this ONCE in Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. TABLES
-- ============================================

-- Profiles (main talent table)
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Auth link
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  email TEXT NOT NULL,
  phone TEXT,

  -- Personal
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  date_of_birth DATE,
  nationality TEXT DEFAULT 'Saint Lucian',
  location TEXT,
  wants_to_relocate BOOLEAN DEFAULT false,
  photo_url TEXT,

  -- Professional
  headline TEXT,
  summary TEXT,
  skills TEXT[],
  experience_years INTEGER,
  education_level TEXT,
  current_employer TEXT,
  current_role TEXT,
  desired_roles TEXT[],
  desired_salary_min INTEGER,
  desired_salary_max INTEGER,
  availability TEXT,
  work_type TEXT[],

  -- Video Resume
  video_url TEXT,
  video_duration INTEGER,
  video_thumbnail_url TEXT,

  -- Resume file
  resume_file_url TEXT,

  -- Metadata
  profile_completeness INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'active',
  source TEXT DEFAULT 'organic',
  referral_code TEXT,

  -- Sectors
  sectors TEXT[]
);

-- Work Experience
CREATE TABLE experiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  company TEXT NOT NULL,
  role TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  description TEXT,
  location TEXT,
  is_current BOOLEAN DEFAULT false
);

-- Education
CREATE TABLE education (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  institution TEXT NOT NULL,
  degree TEXT,
  field TEXT,
  start_year INTEGER,
  end_year INTEGER,
  location TEXT
);

-- Video Resume Questions
CREATE TABLE video_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  category TEXT,
  duration_seconds INTEGER DEFAULT 60,
  sort_order INTEGER,
  is_active BOOLEAN DEFAULT true
);

-- Analytics / Tracking Events
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  event_type TEXT NOT NULL,
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  source TEXT,
  user_agent TEXT
);

-- Waitlist (talent pre-launch + employer interest)
CREATE TABLE waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  email TEXT NOT NULL,
  name TEXT,
  type TEXT DEFAULT 'talent',
  company TEXT,
  notes TEXT
);


-- ============================================
-- 2. INDEXES
-- ============================================

CREATE INDEX idx_profiles_user_id ON profiles (user_id);
CREATE INDEX idx_profiles_status ON profiles (status);
CREATE INDEX idx_profiles_skills ON profiles USING GIN (skills);
CREATE INDEX idx_profiles_sectors ON profiles USING GIN (sectors);
CREATE INDEX idx_profiles_location ON profiles (location);
CREATE INDEX idx_profiles_source ON profiles (source);
CREATE INDEX idx_profiles_created ON profiles (created_at DESC);

CREATE INDEX idx_experiences_profile ON experiences (profile_id);
CREATE INDEX idx_education_profile ON education (profile_id);
CREATE INDEX idx_events_type ON events (event_type, created_at DESC);
CREATE INDEX idx_events_profile ON events (profile_id);
CREATE INDEX idx_waitlist_type ON waitlist (type, created_at DESC);


-- ============================================
-- 3. ROW-LEVEL SECURITY
-- ============================================

-- Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active profiles"
  ON profiles FOR SELECT
  USING (status = 'active');

CREATE POLICY "Users can view own profile regardless of status"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Experiences
ALTER TABLE experiences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view experiences of active profiles"
  ON experiences FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = experiences.profile_id
      AND (profiles.status = 'active' OR profiles.user_id = auth.uid())
    )
  );

CREATE POLICY "Users can manage own experiences"
  ON experiences FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = experiences.profile_id
      AND profiles.user_id = auth.uid()
    )
  );

-- Education
ALTER TABLE education ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view education of active profiles"
  ON education FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = education.profile_id
      AND (profiles.status = 'active' OR profiles.user_id = auth.uid())
    )
  );

CREATE POLICY "Users can manage own education"
  ON education FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = education.profile_id
      AND profiles.user_id = auth.uid()
    )
  );

-- Video Questions (public read)
ALTER TABLE video_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active questions"
  ON video_questions FOR SELECT
  USING (is_active = true);

-- Events (insert-only for authenticated users, no public read)
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can insert events"
  ON events FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anon users can insert events"
  ON events FOR INSERT
  TO anon
  WITH CHECK (true);

-- Waitlist (insert-only, no public read)
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can join waitlist"
  ON waitlist FOR INSERT
  WITH CHECK (true);


-- ============================================
-- 4. SEED DATA — Video Questions
-- ============================================

INSERT INTO video_questions (question, category, duration_seconds, sort_order) VALUES
  ('Tell us about yourself — who are you and what do you do?', 'intro', 60, 1),
  ('What are your top 3 skills and how have you used them?', 'skills', 60, 2),
  ('Why do you want to work in Saint Lucia?', 'motivation', 60, 3),
  ('Describe a challenge you overcame at work.', 'situational', 60, 4),
  ('What kind of role are you looking for and why?', 'motivation', 60, 5);


-- ============================================
-- 5. FUNCTIONS (auto-update timestamps)
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();


-- ============================================
-- 6. STORAGE BUCKETS
-- ============================================
-- NOTE: Run these in Supabase Dashboard > Storage, NOT in SQL Editor.
-- Create 3 buckets with these settings:
--
--   Bucket: photos    | Public: YES | File size limit: 5MB    | Allowed MIME: image/*
--   Bucket: videos    | Public: YES | File size limit: 100MB  | Allowed MIME: video/*
--   Bucket: resumes   | Public: NO  | File size limit: 10MB   | Allowed MIME: application/pdf
--
-- Then run these storage policies in SQL Editor:

-- Storage policies for photos bucket
CREATE POLICY "Anyone can view photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'photos');

CREATE POLICY "Auth users can upload own photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update own photos"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage policies for videos bucket
CREATE POLICY "Anyone can view videos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'videos');

CREATE POLICY "Auth users can upload own videos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'videos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage policies for resumes bucket
CREATE POLICY "Users can view own resumes"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'resumes'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Auth users can upload own resumes"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'resumes'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update own resumes"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'resumes'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );


-- ============================================
-- DONE! Your database is ready.
-- ============================================
