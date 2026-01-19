-- Check-in System Database Schema
-- Run this in Supabase SQL Editor after the main schema

-- ============================================
-- 1. Update messages table with type column
-- ============================================

-- Add type column to existing messages table
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'chat' 
CHECK (type IN ('chat', 'checkin'));

-- Backfill existing messages as 'chat' type
UPDATE messages SET type = 'chat' WHERE type IS NULL;

-- Add metadata column for checkin-specific data
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Index for filtering checkin sessions
CREATE INDEX IF NOT EXISTS idx_messages_type ON messages(type);

-- ============================================
-- 2. Create checkin_sessions table
-- ============================================

CREATE TABLE IF NOT EXISTS checkin_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  
  -- Input
  raw_input TEXT NOT NULL,
  followup_question TEXT,
  followup_response TEXT,
  
  -- Classification
  signals JSONB NOT NULL,
  confidence DECIMAL(3,2),
  
  -- Mode selection
  selected_mode TEXT NOT NULL CHECK (selected_mode IN ('reflect', 'ground', 'action', 'hold')),
  mode_rationale TEXT,
  available_modes JSONB,
  
  -- Intervention
  intervention_text TEXT NOT NULL,
  
  -- Metadata
  safety_flag TEXT,
  model_used TEXT DEFAULT 'gpt-4o',
  latency_ms INTEGER,
  trace_id UUID,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 3. Create checkin_feedback table
-- ============================================

CREATE TABLE IF NOT EXISTS checkin_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES checkin_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  feedback TEXT NOT NULL CHECK (feedback IN ('helped', 'didnt_help', 'too_much')),
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 4. Create user_policy_state table
-- ============================================

CREATE TABLE IF NOT EXISTS user_policy_state (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  
  -- Recent session history
  last_modes JSONB DEFAULT '[]',
  
  -- Mode performance by signal
  mode_stats JSONB DEFAULT '{}',
  
  -- User preferences learned over time
  prefs JSONB DEFAULT '{}',
  
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 5. Create indexes for performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_checkin_sessions_user_id ON checkin_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_checkin_sessions_mode ON checkin_sessions(selected_mode);
CREATE INDEX IF NOT EXISTS idx_checkin_sessions_created_at ON checkin_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_checkin_feedback_session_id ON checkin_feedback(session_id);
CREATE INDEX IF NOT EXISTS idx_checkin_feedback_user_id ON checkin_feedback(user_id);

-- ============================================
-- 6. Enable Row Level Security
-- ============================================

ALTER TABLE checkin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkin_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_policy_state ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 7. Create RLS Policies (allow all for single-user mode)
-- ============================================

CREATE POLICY "Allow all for now" ON checkin_sessions FOR ALL USING (true);
CREATE POLICY "Allow all for now" ON checkin_feedback FOR ALL USING (true);
CREATE POLICY "Allow all for now" ON user_policy_state FOR ALL USING (true);

-- ============================================
-- 8. Verify setup
-- ============================================

-- Check that tables exist
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'checkin_sessions') THEN
    RAISE NOTICE '✅ checkin_sessions table created';
  END IF;
  
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'checkin_feedback') THEN
    RAISE NOTICE '✅ checkin_feedback table created';
  END IF;
  
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_policy_state') THEN
    RAISE NOTICE '✅ user_policy_state table created';
  END IF;
  
  RAISE NOTICE '✅ Check-in schema setup complete!';
END $$;

