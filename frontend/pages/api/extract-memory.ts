import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userMessage } = req.body;

    if (!userMessage) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    console.log(`[${new Date().toISOString()}] 🧠 Extracting memories from user message...`);

    // Ask GPT-5.1 to extract important facts from USER message only
    const completion = await openai.chat.completions.create({
      model: 'gpt-5.1',
      messages: [
        {
          role: 'system',
          content: `You are a memory extraction assistant. Analyze what the USER said and extract ONLY important, persistent facts about the user that should be remembered long-term.

CRITICAL: Extract facts ONLY from what the USER revealed about themselves. DO NOT extract facts that the AI mentioned or repeated back.

Examples of what TO extract:
- User's name, location, occupation
- Preferences (e.g., "prefers 2x speed for audio")
- Important context (e.g., "working on an AI voice assistant")
- Personal facts (e.g., "has a dog named Max")

Examples of what NOT to extract:
- Facts the AI mentioned (even if true)
- Casual conversation topics
- Temporary states (e.g., "feeling tired today")
- Questions or requests
- General opinions on topics

Return ONLY a JSON array of facts, or an empty array if nothing is worth remembering.
Format: [{"fact": "User's name is Jordan"}, {"fact": "Works at Spirit Halloween"}]

If there are no important facts to remember, return: []`
        },
        {
          role: 'user',
          content: `User said: "${userMessage}"\n\nExtract important facts the USER revealed about themselves:`
        }
      ],
      temperature: 0.3,
      max_completion_tokens: 200,
    });

    const response = completion.choices[0]?.message?.content || '[]';
    console.log(`[${new Date().toISOString()}] 🧠 Memory extraction response:`, response);

    // Parse the JSON response
    let memories = [];
    try {
      memories = JSON.parse(response);
    } catch (parseError) {
      console.error('Failed to parse memory extraction response:', response);
      memories = [];
    }

    return res.status(200).json({ memories });
  } catch (error: any) {
    console.error('Memory extraction error:', error);
    return res.status(500).json({ 
      error: 'Failed to extract memories',
      details: error.message 
    });
  }
}

