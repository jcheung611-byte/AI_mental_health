// LangGraph node implementations for check-in flow

import OpenAI from 'openai';
import { CheckinState, CheckinSignals } from './types';
import { 
  CLASSIFY_PROMPT, 
  SAFETY_CHECK_PROMPT, 
  FOLLOWUP_DECISION_PROMPT,
  MODE_PROMPTS,
  SAFETY_RESPONSE_PROMPT,
  fillPromptTemplate 
} from './prompts';
import { selectMode, loadPolicyContext } from './policy';
import { supabase } from '@/utils/supabase';
import { v4 as uuidv4 } from 'uuid';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Node 1: Intake - Load policy context and normalize input
 */
export async function intakeNode(state: CheckinState): Promise<Partial<CheckinState>> {
  console.log('[Intake] Loading policy context for user:', state.user_id);
  
  // Load policy state from DB
  const policyContext = await loadPolicyContext(state.user_id);
  
  // Add timestamp if not present
  const timestamp = state.timestamp || new Date();
  
  // Generate trace ID for observability
  const trace_id = uuidv4();
  
  console.log('[Intake] Recent modes:', policyContext.recent_modes);
  console.log('[Intake] Feedback history entries:', policyContext.mode_feedback_history.length);
  
  return {
    timestamp,
    trace_id,
    recent_modes: policyContext.recent_modes,
    mode_feedback_history: policyContext.mode_feedback_history,
    model_used: 'gpt-4o'
  };
}

/**
 * Node 2: Classify - Extract emotional signals from input
 */
export async function classifyNode(state: CheckinState): Promise<Partial<CheckinState>> {
  console.log('[Classify] Analyzing input:', state.raw_input.substring(0, 100));
  
  const startTime = Date.now();
  
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: CLASSIFY_PROMPT },
        { role: 'user', content: state.raw_input }
      ],
      temperature: 0.3,
      max_completion_tokens: 200,
    });
    
    const responseText = completion.choices[0]?.message?.content || '{}';
    console.log('[Classify] Raw response:', responseText);
    
    // Parse signals
    const signals: CheckinSignals = JSON.parse(responseText);
    
    // Ensure confidence is a number
    signals.confidence = Number(signals.confidence) || 0.5;
    
    console.log('[Classify] Extracted signals:', signals);
    
    return { signals };
  } catch (error) {
    console.error('[Classify] Error:', error);
    
    // Fallback signals if classification fails
    return {
      signals: {
        valence: 'neutral',
        arousal: 'low',
        topic: [],
        confidence: 0.3
      }
    };
  }
}

/**
 * Node 3: Safety Check - Detect crisis content
 */
export async function safetyCheckNode(state: CheckinState): Promise<Partial<CheckinState>> {
  console.log('[Safety] Checking for crisis indicators');
  
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: SAFETY_CHECK_PROMPT },
        { role: 'user', content: state.raw_input }
      ],
      temperature: 0.2,
      max_completion_tokens: 100,
    });
    
    const responseText = completion.choices[0]?.message?.content || '{}';
    const safetyCheck = JSON.parse(responseText);
    
    console.log('[Safety] Safety check result:', safetyCheck);
    
    return {
      safety_flag: safetyCheck.safety_flag === 'none' ? 'none' : safetyCheck.safety_flag
    };
  } catch (error) {
    console.error('[Safety] Error:', error);
    
    // Fail safe: if error, mark as none and let it through
    return { safety_flag: 'none' };
  }
}

/**
 * Node 4: Decide Follow-up - Determine if clarification needed
 */
export async function decideFollowupNode(state: CheckinState): Promise<Partial<CheckinState>> {
  console.log('[Decide] Checking if follow-up needed. Confidence:', state.signals?.confidence);
  
  // If we already have a follow-up response, skip asking again
  if (state.followup_response) {
    console.log('[Decide] Follow-up response already provided, skipping');
    return {
      needs_followup: false
    };
  }
  
  const confidence = state.signals?.confidence || 0.5;
  
  // If confidence is high enough, no follow-up needed
  if (confidence >= 0.7) {
    console.log('[Decide] Confidence sufficient, no follow-up needed');
    return {
      needs_followup: false
    };
  }
  
  // Low confidence - generate follow-up question
  try {
    const promptFilled = fillPromptTemplate(FOLLOWUP_DECISION_PROMPT, {
      raw_input: state.raw_input,
      confidence: confidence.toFixed(2)
    });
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: promptFilled },
        { role: 'user', content: 'Generate follow-up decision' }
      ],
      temperature: 0.4,
      max_completion_tokens: 150,
    });
    
    const responseText = completion.choices[0]?.message?.content || '{}';
    const decision = JSON.parse(responseText);
    
    console.log('[Decide] Follow-up decision:', decision);
    
    return {
      needs_followup: decision.needs_followup,
      followup_question: decision.followup_question
    };
  } catch (error) {
    console.error('[Decide] Error:', error);
    
    // Fallback: don't ask follow-up if error
    return {
      needs_followup: false
    };
  }
}

/**
 * Node 5: Select Mode - Choose intervention mode using policy
 */
export async function selectModeNode(state: CheckinState): Promise<Partial<CheckinState>> {
  console.log('[SelectMode] Choosing intervention mode');
  
  if (!state.signals) {
    console.error('[SelectMode] No signals available!');
    return {
      selected_mode: 'reflect',
      mode_rationale: 'Default mode (no signals)'
    };
  }
  
  // Use policy to select mode
  const selection = selectMode({
    signals: state.signals,
    recent_modes: state.recent_modes || [],
    mode_feedback_history: state.mode_feedback_history || []
  });
  
  console.log('[SelectMode] Selected:', selection.mode);
  console.log('[SelectMode] Rationale:', selection.rationale);
  console.log('[SelectMode] Available modes:', selection.availableModes);
  
  return {
    selected_mode: selection.mode as any,
    mode_rationale: selection.rationale,
    available_modes: selection.availableModes
  };
}

/**
 * Node 6: Generate Intervention - Create mode-specific response
 */
export async function generateInterventionNode(state: CheckinState): Promise<Partial<CheckinState>> {
  console.log('[Generate] Creating intervention for mode:', state.selected_mode);
  
  const mode = state.selected_mode || 'reflect';
  const signals = state.signals!;
  
  // Get the appropriate prompt template
  const promptTemplate = MODE_PROMPTS[mode];
  
  // Fill in the template variables
  const promptFilled = fillPromptTemplate(promptTemplate, {
    valence: signals.valence,
    arousal: signals.arousal,
    topics: signals.topic?.join(', ') || 'none specified',
    raw_input: state.raw_input
  });
  
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: promptFilled },
        { role: 'user', content: 'Generate intervention response' }
      ],
      temperature: 0.7,
      max_completion_tokens: 300,
    });
    
    const interventionText = completion.choices[0]?.message?.content || 
      'I hear you. Let me take a moment to respond thoughtfully.';
    
    console.log('[Generate] Intervention created:', interventionText.substring(0, 100));
    
    return {
      intervention_text: interventionText
    };
  } catch (error) {
    console.error('[Generate] Error:', error);
    
    // Fallback intervention
    return {
      intervention_text: 'I hear you and I want to support you. Can you tell me a bit more about what you\'re experiencing?'
    };
  }
}

/**
 * Node 7: Crisis Response - Handle crisis situations
 */
export async function crisisResponseNode(state: CheckinState): Promise<Partial<CheckinState>> {
  console.log('[Crisis] Generating crisis response');
  
  const promptFilled = fillPromptTemplate(SAFETY_RESPONSE_PROMPT, {
    raw_input: state.raw_input
  });
  
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: promptFilled },
        { role: 'user', content: 'Generate crisis response' }
      ],
      temperature: 0.5,
      max_completion_tokens: 200,
    });
    
    const interventionText = completion.choices[0]?.message?.content || 
      getDefaultCrisisResponse();
    
    console.log('[Crisis] Response generated');
    
    return {
      intervention_text: interventionText,
      selected_mode: 'hold' // Use hold mode for crisis
    };
  } catch (error) {
    console.error('[Crisis] Error:', error);
    
    return {
      intervention_text: getDefaultCrisisResponse(),
      selected_mode: 'hold'
    };
  }
}

function getDefaultCrisisResponse(): string {
  return `I hear you, and I'm concerned. I'm an AI and not equipped to support you through a crisis, but please know you're not alone.

**Please reach out for help:**
• National Suicide Prevention Lifeline: **988**
• Crisis Text Line: Text **HOME** to **741741**
• Emergency services: **911**

If you can, reach out to someone you trust. You deserve support right now.`;
}

/**
 * Node 8: Persist - Save session to database
 */
export async function persistNode(state: CheckinState): Promise<Partial<CheckinState>> {
  console.log('[Persist] Saving session to database');
  
  const endTime = Date.now();
  const latency_ms = state.timestamp ? endTime - state.timestamp.getTime() : 0;
  
  try {
    // Save to checkin_sessions table
    const { data, error } = await supabase
      .from('checkin_sessions')
      .insert({
        id: state.session_id,
        user_id: state.user_id,
        raw_input: state.raw_input,
        followup_question: state.followup_question || null,
        followup_response: state.followup_response || null,
        signals: state.signals,
        confidence: state.signals?.confidence,
        selected_mode: state.selected_mode,
        mode_rationale: state.mode_rationale,
        available_modes: state.available_modes,
        intervention_text: state.intervention_text,
        safety_flag: state.safety_flag,
        model_used: state.model_used,
        latency_ms,
        trace_id: state.trace_id
      })
      .select()
      .single();
    
    if (error) {
      console.error('[Persist] Error saving session:', error);
    } else {
      console.log('[Persist] ✅ Session saved:', state.session_id);
    }
    
    return { latency_ms };
  } catch (error) {
    console.error('[Persist] Unexpected error:', error);
    return {};
  }
}

