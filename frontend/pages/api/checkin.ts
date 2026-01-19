import type { NextApiRequest, NextApiResponse } from 'next';
import { createCheckinGraph } from '@/lib/checkin/graph';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, transcript, followupResponse, sessionId } = req.body;

    if (!transcript) {
      return res.status(400).json({ error: 'No transcript provided' });
    }

    console.log('=== Check-in Request ===');
    console.log('User ID:', userId);
    console.log('Transcript:', transcript.substring(0, 100) + '...');
    console.log('Has followup response:', !!followupResponse);
    console.log('Session ID:', sessionId);

    // Use existing session ID if this is a follow-up response, otherwise create new
    const finalSessionId = sessionId || uuidv4();
    const finalUserId = userId || '00000000-0000-0000-0000-000000000001';

    // Create initial state
    const initialState = {
      user_id: finalUserId,
      session_id: finalSessionId,
      timestamp: new Date(),
      raw_input: transcript,
      followup_response: followupResponse || undefined,
    };

    console.log('Running LangGraph...');
    const startTime = Date.now();

    // Run the graph
    const graph = createCheckinGraph();
    const result = await graph.invoke(initialState);

    const duration = Date.now() - startTime;
    console.log(`Graph execution completed in ${duration}ms`);
    console.log('Result state:', {
      needs_followup: result.needs_followup,
      selected_mode: result.selected_mode,
      safety_flag: result.safety_flag,
      has_intervention: !!result.intervention_text
    });

    // Check if follow-up is needed
    if (result.needs_followup && !followupResponse) {
      console.log('Follow-up needed, returning question');
      return res.status(200).json({
        type: 'followup_needed',
        question: result.followup_question,
        session_id: result.session_id,
      });
    }

    // Return intervention
    console.log('Returning intervention');
    return res.status(200).json({
      type: 'intervention',
      mode: result.selected_mode,
      text: result.intervention_text,
      session_id: result.session_id,
      signals: result.signals,
      mode_rationale: result.mode_rationale,
      safety_flag: result.safety_flag,
    });
  } catch (error: any) {
    console.error('Check-in error:', error);
    console.error('Error stack:', error.stack);
    return res.status(500).json({
      error: 'Check-in failed',
      details: error.message,
    });
  }
}

