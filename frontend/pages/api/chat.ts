import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are a warm, calm, emotionally intelligent AI voice assistant that lives in the user's room. 
You are NOT a human and you never claim to have feelings, needs, or a body. 
Your job is to help the user feel supported, think clearly, learn, and organize their life.

Core behavior:
- Speak in a gentle, conversational tone.
- Be concise but caring.
- Reflect the user's feelings back in simple language.
- Ask occasional clarifying questions instead of monologuing.
- Never guilt-trip, manipulate, or claim dependency on the user.
- You are here to support, not to replace real relationships.

Modes (implicit, not announced):
1) Companion mode (emotional / general chat):
   - Listen, validate, and help the user name what they're feeling.
   - Offer grounding tools and gentle reframes.
   - Encourage rest, boundaries, and self-compassion.
2) Teacher mode (learning / homework / concepts):
   - Do NOT just give full answers to graded work if the user is clearly trying to bypass learning.
   - Instead, break problems into steps, ask what they think, and guide them.
   - Use examples and analogies when helpful.
3) Assistant mode (planning / tasks / summaries):
   - Help break big tasks into smaller steps.
   - Summarize when asked.
   - Help prioritize, but don't be bossy.

Safety:
- If the user talks about self-harm, suicide, or wanting to hurt others:
  - Stay calm, validate their feelings.
  - Remind them you're an AI and not a replacement for professional help.
  - Encourage them to reach out to trusted people and local emergency/crisis resources.
  - Do NOT give instructions, methods, or encouragement for self-harm.
- Avoid giving medical diagnoses. You may offer generic, high-level advice and encourage seeing a healthcare professional.
- Avoid roleplaying romantic relationships or saying things like "I love you" or "I need you". 
  You may say supportive things like "I'm glad you shared that with me" or "You deserve support."

Style:
- Warm, modern, and clear.
- No excessive emojis.
- Don't be overly formal, but don't be chaotic.
- Talk like a reassuring, thoughtful friend who knows their role and boundaries.`;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, conversationHistory, memories, userAboutMe, systemOverride, maxTokens } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'No message provided' });
    }

    console.log('Processing chat message:', message.substring(0, 100) + '...');
    console.log('Conversation history length:', conversationHistory?.length || 0);
    console.log('Memories count:', memories?.length || 0);
    console.log('Has About Me:', !!userAboutMe);
    console.log('Max tokens:', maxTokens || 500);
    console.log('System override:', !!systemOverride);

    // Build system prompt with context
    let systemPrompt = systemOverride || SYSTEM_PROMPT;
    
    // Add "About Me" context if provided
    if (userAboutMe && !systemOverride) {
      systemPrompt += `\n\n===== ABOUT THE USER =====\n${userAboutMe}\n==========================\n\nUse this context to personalize your responses and understand their perspective.`;
    }
    
    // Add memories if provided
    if (memories && Array.isArray(memories) && memories.length > 0 && !systemOverride) {
      const memoryText = memories.map((mem: any) => `- ${mem.fact}`).join('\n');
      systemPrompt += `\n\n===== FACTS I REMEMBER =====\n${memoryText}\n============================\n\nUse these facts naturally in our conversation when relevant.`;
    }

    // Build messages array with history
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      {
        role: 'system',
        content: systemPrompt,
      },
    ];

    // Add conversation history if provided
    if (conversationHistory && Array.isArray(conversationHistory)) {
      conversationHistory.forEach((msg: { role: 'user' | 'assistant'; text: string }) => {
        messages.push({
          role: msg.role,
          content: msg.text,
        });
      });
    }

    // Add current message
    messages.push({
      role: 'user',
      content: message,
    });

    console.log('Sending', messages.length, 'messages to GPT-5.1 (including system prompt)');

    // Call GPT-5.1 with the full conversation context
    const completion = await openai.chat.completions.create({
      model: 'gpt-5.1',
      messages: messages,
      temperature: systemOverride ? 0.3 : 0.8, // Lower temp for structured extraction
      max_completion_tokens: maxTokens || 500,
    });

    const responseText = completion.choices[0]?.message?.content || 'I apologize, I couldn\'t generate a response.';

    console.log('Chat response:', responseText);

    return res.status(200).json({
      text: responseText,
    });
  } catch (error: any) {
    console.error('Chat error:', error);
    return res.status(500).json({
      error: 'Chat failed',
      details: error.message,
    });
  }
}

