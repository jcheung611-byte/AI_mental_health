import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.PORTKEY_API_KEY,
  baseURL: process.env.PORTKEY_BASE_URL,
  defaultHeaders: {
    'x-portkey-virtual-key': process.env.PORTKEY_VIRTUAL_KEY,
  },
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text, voice = 'nova', model = 'tts-1' } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'No text provided' });
    }

    console.log('Converting to speech:', text.substring(0, 50) + '...', `| Voice: ${voice} | Model: ${model}`);

    // Convert text to speech using OpenAI TTS
    const mp3 = await openai.audio.speech.create({
      model: model as 'tts-1' | 'tts-1-hd',
      voice: voice as 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer',
      input: text,
    });

    // Get the audio buffer
    const buffer = Buffer.from(await mp3.arrayBuffer());

    // Set headers for audio streaming
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', buffer.length);

    console.log('Speech generated, sending audio');

    // Send the audio data
    return res.status(200).send(buffer);
  } catch (error: any) {
    console.error('TTS error:', error);
    return res.status(500).json({
      error: 'Text-to-speech failed',
      details: error.message,
    });
  }
}

