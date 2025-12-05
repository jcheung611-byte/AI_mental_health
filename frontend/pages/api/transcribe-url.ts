import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { audioUrl } = req.body;

  if (!audioUrl) {
    return res.status(400).json({ error: 'audioUrl is required' });
  }

  console.log(`[transcribe-url] Downloading audio from:`, audioUrl);

  try {
    // Download the audio file from Supabase Storage
    const audioResponse = await fetch(audioUrl);
    
    if (!audioResponse.ok) {
      console.error(`[transcribe-url] Failed to download audio:`, audioResponse.status);
      return res.status(400).json({ error: 'Failed to download audio from URL' });
    }

    const audioBlob = await audioResponse.blob();
    const audioBuffer = Buffer.from(await audioBlob.arrayBuffer());
    
    console.log(`[transcribe-url] Downloaded:`, (audioBuffer.length / 1024 / 1024).toFixed(2), 'MB');

    // Create a File object for OpenAI
    const file = new File([audioBuffer], 'audio.webm', { type: 'audio/webm' });

    // Transcribe with Whisper
    console.log(`[transcribe-url] Sending to Whisper...`);
    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: 'whisper-1',
      language: 'en',
    });

    console.log(`[transcribe-url] ✅ Transcribed:`, transcription.text.substring(0, 100) + '...');

    return res.status(200).json({ text: transcription.text });
  } catch (error: any) {
    console.error('[transcribe-url] Error:', error);
    return res.status(500).json({ 
      error: 'Transcription failed',
      details: error.message 
    });
  }
}

