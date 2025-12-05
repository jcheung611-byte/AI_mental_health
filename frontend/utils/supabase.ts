import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Default user ID for single-user mode (will add auth later)
export const DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000001';

// Storage bucket name for audio recordings
export const AUDIO_BUCKET = 'audio-recordings';

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

// Upload audio blob to Supabase Storage
export async function uploadAudioToStorage(
  audioBlob: Blob,
  userId: string = DEFAULT_USER_ID
): Promise<{ url: string; path: string } | null> {
  const timestamp = Date.now();
  const fileName = `${userId}/${timestamp}.webm`;
  
  console.log(`[Supabase] Uploading audio: ${fileName} (${(audioBlob.size / 1024 / 1024).toFixed(2)} MB)`);
  
  try {
    const { data, error } = await supabase.storage
      .from(AUDIO_BUCKET)
      .upload(fileName, audioBlob, {
        contentType: 'audio/webm',
        cacheControl: '3600',
      });
    
    if (error) {
      console.error('[Supabase] Upload error:', error);
      return null;
    }
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from(AUDIO_BUCKET)
      .getPublicUrl(fileName);
    
    console.log(`[Supabase] ✅ Uploaded successfully:`, urlData.publicUrl);
    
    return {
      url: urlData.publicUrl,
      path: fileName,
    };
  } catch (error) {
    console.error('[Supabase] Upload exception:', error);
    return null;
  }
}

