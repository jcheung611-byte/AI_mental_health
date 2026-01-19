// Type definitions for Check-in System

export interface CheckinSignals {
  valence: 'positive' | 'negative' | 'neutral';
  arousal: 'high' | 'low';
  topic?: string[];
  confidence: number;
}

export interface ModeSelection {
  mode: string;
  signals: CheckinSignals;
  feedback: 'helped' | 'didnt_help' | 'too_much';
  timestamp: Date;
}

export interface CheckinState {
  // Input
  user_id: string;
  session_id: string;
  timestamp: Date;
  raw_input: string;
  
  // Classification
  signals?: CheckinSignals;
  
  // Follow-up (optional)
  needs_followup?: boolean;
  followup_question?: string;
  followup_response?: string;
  
  // Mode selection
  selected_mode?: 'reflect' | 'ground' | 'action' | 'hold';
  mode_rationale?: string;
  available_modes?: string[];
  
  // Intervention
  intervention_text?: string;
  
  // Safety
  safety_flag?: 'crisis' | 'medical' | 'none';
  
  // Policy state (from DB)
  recent_modes?: string[];
  mode_feedback_history?: ModeSelection[];
  
  // Metadata
  model_used?: string;
  latency_ms?: number;
  trace_id?: string;
}

export interface PolicyContext {
  signals: CheckinSignals;
  recent_modes: string[];
  mode_feedback_history: ModeSelection[];
}

export interface CheckinSession {
  id: string;
  user_id: string;
  message_id?: string;
  raw_input: string;
  followup_question?: string;
  followup_response?: string;
  signals: CheckinSignals;
  confidence?: number;
  selected_mode: 'reflect' | 'ground' | 'action' | 'hold';
  mode_rationale?: string;
  available_modes?: string[];
  intervention_text: string;
  safety_flag?: string;
  model_used?: string;
  latency_ms?: number;
  trace_id?: string;
  created_at: Date;
}

export interface CheckinFeedback {
  id: string;
  session_id: string;
  user_id: string;
  feedback: 'helped' | 'didnt_help' | 'too_much';
  notes?: string;
  created_at: Date;
}

export interface UserPolicyState {
  user_id: string;
  last_modes: string[];
  mode_stats: Record<string, { total: number; helped: number }>;
  prefs: Record<string, any>;
  updated_at: Date;
}

