-- AI Mental Health App Database Schema
-- Run this in Supabase SQL Editor to create tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (for future multi-user support)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  text TEXT NOT NULL,
  audio_url TEXT,
  voice_used TEXT,
  model_used TEXT,
  generated_voice TEXT,
  generated_model TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Memories table
CREATE TABLE IF NOT EXISTS memories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  fact TEXT NOT NULL,
  source TEXT CHECK (source IN ('import', 'conversation')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User settings table
CREATE TABLE IF NOT EXISTS user_settings (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  about_me TEXT,
  mode TEXT DEFAULT 'friend' CHECK (mode IN ('friend', 'helper', 'mentor')),
  voice TEXT DEFAULT 'nova',
  model TEXT DEFAULT 'tts-1',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_audio_url ON messages(audio_url) WHERE audio_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_memories_user_id ON memories(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (for now, allow all - we'll add auth later)
-- Allow anonymous users to read/write their own data
CREATE POLICY "Allow all for now" ON users FOR ALL USING (true);
CREATE POLICY "Allow all for now" ON messages FOR ALL USING (true);
CREATE POLICY "Allow all for now" ON memories FOR ALL USING (true);
CREATE POLICY "Allow all for now" ON user_settings FOR ALL USING (true);

-- Create a default user for single-user mode
INSERT INTO users (id) VALUES ('00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- ===========================================================================
-- SUPABASE STORAGE SETUP FOR VOICE RECORDINGS
-- ===========================================================================

-- Create storage bucket for audio recordings
INSERT INTO storage.buckets (id, name, public)
VALUES ('audio-recordings', 'audio-recordings', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies - Allow all for now (single-user mode)
-- Later: Restrict to authenticated users only

CREATE POLICY "Allow public uploads to audio-recordings"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'audio-recordings');

CREATE POLICY "Allow public reads from audio-recordings"
ON storage.objects FOR SELECT
USING (bucket_id = 'audio-recordings');

CREATE POLICY "Allow public deletes from audio-recordings"
ON storage.objects FOR DELETE
USING (bucket_id = 'audio-recordings');

-- ===========================================================================
-- CLEANUP FUNCTION (Optional - for managing storage)
-- ===========================================================================

-- Function to delete old recordings (older than 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_recordings()
RETURNS void AS $$
DECLARE
  old_recording RECORD;
  file_path TEXT;
BEGIN
  -- Find recordings older than 30 days
  FOR old_recording IN
    SELECT audio_url, created_at
    FROM messages
    WHERE audio_url IS NOT NULL
      AND created_at < NOW() - INTERVAL '30 days'
  LOOP
    -- Extract file path from URL
    file_path := regexp_replace(old_recording.audio_url, '^.*/storage/v1/object/public/audio-recordings/', '');
    
    -- Delete from storage
    DELETE FROM storage.objects
    WHERE bucket_id = 'audio-recordings'
      AND name = file_path;
    
    -- Update message to remove audio_url (keep transcription)
    UPDATE messages
    SET audio_url = NULL
    WHERE audio_url = old_recording.audio_url;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- To run cleanup manually: SELECT cleanup_old_recordings();
-- To schedule: Create a Supabase Edge Function that calls this daily

