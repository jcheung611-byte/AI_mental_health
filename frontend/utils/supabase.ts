import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Default user ID for single-user mode (will add auth later)
export const DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000001';

// Types for our database tables
export interface Message {
  id: string;
  user_id: string;
  role: 'user' | 'assistant';
  text: string;
  audio_url?: string;
  voice_used?: string;
  model_used?: string;
  generated_voice?: string;
  generated_model?: string;
  created_at: string;
}

export interface Memory {
  id: string;
  user_id: string;
  fact: string;
  created_at: string;
  last_used_at: string;
}

