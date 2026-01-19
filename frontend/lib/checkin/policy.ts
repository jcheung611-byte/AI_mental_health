// Policy and adaptation logic for mode selection

import { PolicyContext, CheckinSignals, ModeSelection } from './types';
import { supabase } from '@/utils/supabase';

/**
 * Select the best intervention mode based on signals and policy constraints
 */
export function selectMode(context: PolicyContext): { mode: string; rationale: string; availableModes: string[] } {
  const allModes = ['reflect', 'ground', 'action', 'hold'];
  
  // 1. Apply constraints to filter out invalid modes
  const validModes = allModes.filter(mode => {
    // Constraint 1: Don't repeat the most recent mode
    if (context.recent_modes.length > 0 && context.recent_modes[0] === mode) {
      return false;
    }
    
    // Constraint 2: Fuzzy signal matching - avoid modes with repeated negative feedback
    // Look for modes that failed 2+ times in the last 10 sessions with similar arousal level
    const recentNegativeFeedback = context.mode_feedback_history.filter(f => 
      f.mode === mode && 
      f.feedback !== 'helped' &&
      f.signals.arousal === context.signals.arousal && // Fuzzy match on arousal
      withinNSessions(f.timestamp, 10)
    );
    
    // 2 strikes rule: if mode failed 2+ times for this arousal level, skip it
    if (recentNegativeFeedback.length >= 2) {
      return false;
    }
    
    return true;
  });
  
  // Fallback: if all modes filtered out, allow all
  const modesConsider = validModes.length > 0 ? validModes : allModes;
  
  // 2. Score remaining modes based on signals
  const scored = modesConsider.map(mode => ({
    mode,
    score: scoreMode(mode, context.signals),
    rationale: getRationale(mode, context.signals)
  }));
  
  // 3. Sort by score and return highest
  scored.sort((a, b) => b.score - a.score);
  
  const selected = scored[0];
  
  return {
    mode: selected.mode,
    rationale: selected.rationale,
    availableModes: modesConsider
  };
}

/**
 * Score a mode based on signal heuristics
 * Returns 0.0-1.0, higher is better match
 */
function scoreMode(mode: string, signals: CheckinSignals): number {
  const { valence, arousal, topic, confidence } = signals;
  
  // Ground mode: Best for high arousal (anxious, panicked, overwhelmed energy)
  if (mode === 'ground') {
    if (arousal === 'high' && valence === 'negative') return 0.85;
    if (arousal === 'high') return 0.75;
    return 0.3;
  }
  
  // Action mode: Best for low arousal + negative (stuck, unmotivated)
  if (mode === 'action') {
    if (arousal === 'low' && valence === 'negative') return 0.80;
    if (topic?.includes('procrastination') || topic?.includes('stuck')) return 0.75;
    return 0.4;
  }
  
  // Hold mode: Best for overwhelm, exhaustion, need to rest
  if (mode === 'hold') {
    if (topic?.includes('overwhelm') || topic?.includes('tired') || topic?.includes('exhausted')) return 0.85;
    if (arousal === 'low' && valence === 'negative' && confidence < 0.6) return 0.70;
    return 0.35;
  }
  
  // Reflect mode: Good default, especially for unclear situations
  if (mode === 'reflect') {
    if (confidence < 0.7) return 0.90; // Need more exploration
    if (valence === 'negative') return 0.65; // General processing
    return 0.55;
  }
  
  // Baseline score
  return 0.5;
}

/**
 * Generate human-readable rationale for mode selection
 */
function getRationale(mode: string, signals: CheckinSignals): string {
  const { valence, arousal, topic } = signals;
  
  if (mode === 'ground') {
    return `High arousal detected - grounding technique to calm nervous system`;
  }
  
  if (mode === 'action') {
    if (arousal === 'low') {
      return `Low energy and stuck - small actionable step to build momentum`;
    }
    return `Action mode for concrete next step`;
  }
  
  if (mode === 'hold') {
    if (topic?.includes('overwhelm')) {
      return `Overwhelm detected - permission to pause and rest`;
    }
    return `Low energy - validation and permission to not push`;
  }
  
  if (mode === 'reflect') {
    return `Exploration and validation to process emotions`;
  }
  
  return `Selected ${mode} mode`;
}

/**
 * Check if timestamp is within N most recent sessions
 */
function withinNSessions(timestamp: Date, n: number): boolean {
  // For now, use time-based heuristic (30 days = ~30 check-ins if daily)
  const daysAgo = (Date.now() - timestamp.getTime()) / (1000 * 60 * 60 * 24);
  return daysAgo <= n;
}

/**
 * Update user's policy state after receiving feedback
 */
export async function updatePolicyState(
  userId: string, 
  sessionId: string, 
  feedback: 'helped' | 'didnt_help' | 'too_much'
): Promise<void> {
  try {
    // 1. Load session data (signals, mode)
    const { data: session, error: sessionError } = await supabase
      .from('checkin_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();
    
    if (sessionError) {
      console.error('Error loading session for policy update:', sessionError);
      return;
    }
    
    // 2. Load current policy state (or create if doesn't exist)
    let { data: policy, error: policyError } = await supabase
      .from('user_policy_state')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (policyError && policyError.code === 'PGRST116') {
      // No policy exists yet, create default
      policy = {
        user_id: userId,
        last_modes: [],
        mode_stats: {},
        prefs: {},
        updated_at: new Date()
      };
    } else if (policyError) {
      console.error('Error loading policy state:', policyError);
      return;
    }
    
    // 3. Update last_modes (keep last 10)
    const lastModes = [session.selected_mode, ...(policy?.last_modes || [])].slice(0, 10);
    
    // 4. Update mode_stats (track performance by arousal level - fuzzy matching)
    const modeStats = policy?.mode_stats || {};
    const key = `${session.selected_mode}_${session.signals.arousal}`;
    modeStats[key] = {
      total: (modeStats[key]?.total || 0) + 1,
      helped: (modeStats[key]?.helped || 0) + (feedback === 'helped' ? 1 : 0)
    };
    
    // 5. Save updated policy
    const { error: updateError } = await supabase
      .from('user_policy_state')
      .upsert({
        user_id: userId,
        last_modes: lastModes,
        mode_stats: modeStats,
        prefs: policy?.prefs || {},
        updated_at: new Date()
      });
    
    if (updateError) {
      console.error('Error updating policy state:', updateError);
    } else {
      console.log(`✅ Policy updated for user ${userId}: mode=${session.selected_mode}, feedback=${feedback}`);
    }
  } catch (error) {
    console.error('Unexpected error in updatePolicyState:', error);
  }
}

/**
 * Load policy context from database for a user
 */
export async function loadPolicyContext(userId: string): Promise<{
  recent_modes: string[];
  mode_feedback_history: ModeSelection[];
}> {
  try {
    // Load policy state
    const { data: policy } = await supabase
      .from('user_policy_state')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    // Load recent feedback history (last 20 sessions)
    const { data: recentSessions } = await supabase
      .from('checkin_sessions')
      .select(`
        id,
        selected_mode,
        signals,
        created_at,
        checkin_feedback (
          feedback,
          created_at
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);
    
    // Build feedback history
    const feedbackHistory: ModeSelection[] = (recentSessions || [])
      .filter(s => s.checkin_feedback && s.checkin_feedback.length > 0)
      .map(s => ({
        mode: s.selected_mode,
        signals: s.signals as CheckinSignals,
        feedback: s.checkin_feedback[0].feedback as 'helped' | 'didnt_help' | 'too_much',
        timestamp: new Date(s.checkin_feedback[0].created_at)
      }));
    
    return {
      recent_modes: policy?.last_modes || [],
      mode_feedback_history: feedbackHistory
    };
  } catch (error) {
    console.error('Error loading policy context:', error);
    return {
      recent_modes: [],
      mode_feedback_history: []
    };
  }
}

