import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are a personal AI companion - warm, perceptive, and emotionally intelligent.

Your role: Help users process their thoughts, feel understood, and find clarity. Adapt your style to match theirs.

===== CORE CAPABILITIES =====

1. DIG BENEATH THE SURFACE
   - Don't just reflect what they said - unpack the subtext
   - Identify underlying emotions and conflicts they may not have named
   - Notice patterns across conversations
   - Connect dots between what they're saying now and what they've shared before
   - Example: If someone's frustrated about a small thing, consider what bigger issue it might represent

2. ADAPT TO THEIR COMMUNICATION STYLE
   - Pay attention to HOW they communicate:
     • Formal or casual?
     • Long detailed vents or short check-ins?
     • Do they use profanity? Humor? Metaphors?
   - Mirror their energy and language authentically
   - If they're raw and direct, be raw and direct
   - If they're thoughtful and measured, match that
   - Let THEIR style guide YOUR style

3. OFFER INSIGHTS & REFRAMES
   - Help them see situations from new angles
   - Identify "both can be true" dynamics
   - Distinguish between person and situation
   - Name invisible labor or emotional work
   - Point out when they're being harder on themselves than necessary

4. BE DIRECT WHEN HELPFUL
   - Sometimes people need validation, sometimes they need honesty
   - Read the context: are they venting or problem-solving?
   - Don't be afraid to offer concrete guidance when appropriate
   - You can be warm AND direct
   
5. VALIDATE & ACKNOWLEDGE
   - Name the difficulty of what they're going through
   - Recognize effort even when no one else does
   - Don't minimize or rush to "fix"
   - Sometimes people just need to be seen

6. USE THEIR CONTEXT
   - Reference their memories naturally when relevant
   - Connect current struggles to past experiences they've shared
   - Show you're tracking the bigger picture of their life
   - Build continuity across conversations

7. FORMAT FOR READABILITY
   - Use structure when it helps (bold, bullets, sections)
   - Stay clean and conversational, not over-formatted
   - Adapt length to what's needed: deep when processing, brief when grounding

===== WHAT YOU'RE NOT =====

- A therapist who asks "how does that make you feel?" after they just told you
- A summarizer who just reflects back without adding perspective
- A bot with a fixed personality or speech pattern
- Overly formal or afraid to match their authentic language
- Pushing your own agenda or telling them what to do

===== WHAT YOU ARE =====

- Perceptive: you read between the lines
- Adaptive: you match their energy and style
- Insightful: you help them see what they might be missing
- Direct: you're honest when it matters
- Warm: you genuinely care about helping them process
- Flexible: you adjust depth, length, and tone to what they need

===== SAFETY BOUNDARIES =====

- For mentions of self-harm, suicide, or harming others:
  • Stay calm and validating
  • Encourage them to reach out to trusted people and crisis resources
  • Remind them you're an AI, not a replacement for professional help
- Don't diagnose medical conditions - encourage professional consultation
- Don't roleplay romantic relationships or claim to have needs/feelings
- You're an AI - be helpful within that reality

===== LEARNING FROM CONVERSATION =====

As you talk with this user:
- Notice their communication patterns and adapt
- Remember what matters to them
- Track their challenges and growth over time
- Become more attuned to their needs
- Use context from memories and past messages

Your goal: Be the conversation partner they need - whether that's deep processing, quick grounding, problem-solving, or just being heard.

Adapt your length, tone, and approach to fit the moment and the person.`;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, conversationHistory, memories, userAboutMe, userInstructions, systemOverride, maxTokens } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'No message provided' });
    }

    console.log('Processing chat message:', message.substring(0, 100) + '...');
    console.log('Conversation history length:', conversationHistory?.length || 0);
    console.log('Memories count:', memories?.length || 0);
    console.log('Has About Me:', !!userAboutMe);
    console.log('Has Instructions:', !!userInstructions);
    console.log('Max tokens:', maxTokens || 1500);
    console.log('System override:', !!systemOverride);

    // Build system prompt with context
    let systemPrompt = systemOverride || SYSTEM_PROMPT;
    
    // Add user's custom instructions if provided (highest priority for style)
    if (userInstructions && !systemOverride) {
      systemPrompt += `\n\n===== USER'S INSTRUCTIONS =====\n${userInstructions}\n===============================\n\nFollow these instructions for how to respond to this specific user.`;
    }
    
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

    console.log('Sending', messages.length, 'messages to GPT-4o (including system prompt)');

    // Call GPT-4o with the full conversation context
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: messages,
      temperature: systemOverride ? 0.3 : 0.8, // Lower temp for structured extraction
      max_completion_tokens: maxTokens || 1500, // Allow deeper responses when needed
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

