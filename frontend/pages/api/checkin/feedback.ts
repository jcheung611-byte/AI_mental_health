import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/utils/supabase';
import { updatePolicyState } from '@/lib/checkin/policy';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { sessionId, feedback, notes, userId } = req.body;

    if (!sessionId || !feedback) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!['helped', 'didnt_help', 'too_much'].includes(feedback)) {
      return res.status(400).json({ error: 'Invalid feedback value' });
    }

    console.log('=== Feedback Submission ===');
    console.log('Session ID:', sessionId);
    console.log('Feedback:', feedback);
    console.log('Notes:', notes);

    const finalUserId = userId || '00000000-0000-0000-0000-000000000001';

    // Save feedback to database
    const { data, error } = await supabase
      .from('checkin_feedback')
      .insert({
        session_id: sessionId,
        user_id: finalUserId,
        feedback,
        notes: notes || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving feedback:', error);
      throw error;
    }

    console.log('✅ Feedback saved:', data.id);

    // Update policy state based on feedback
    console.log('Updating policy state...');
    await updatePolicyState(finalUserId, sessionId, feedback);
    console.log('✅ Policy state updated');

    return res.status(200).json({
      success: true,
      feedback_id: data.id,
    });
  } catch (error: any) {
    console.error('Feedback submission error:', error);
    return res.status(500).json({
      error: 'Failed to save feedback',
      details: error.message,
    });
  }
}

