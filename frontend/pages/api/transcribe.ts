import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import OpenAI from 'openai';

// Disable body parsing, we'll use formidable
export const config = {
  api: {
    bodyParser: false,
  },
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse the multipart form data
    const form = formidable({});
    const [fields, files] = await form.parse(req);

    const audioFile = files.audio?.[0];
    if (!audioFile) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    console.log('Transcribing audio file:', {
      size: audioFile.size,
      type: audioFile.mimetype,
    });

    // Read the audio file
    const audioBuffer = fs.readFileSync(audioFile.filepath);
    
    // Create a File object for OpenAI
    const audioBlob = new File([audioBuffer], 'audio.webm', {
      type: audioFile.mimetype || 'audio/webm',
    });

    // Transcribe with Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: audioBlob,
      model: 'whisper-1',
    });

    console.log('Transcription result:', transcription.text);

    // Clean up temp file
    fs.unlinkSync(audioFile.filepath);

    return res.status(200).json({
      text: transcription.text,
    });
  } catch (error: any) {
    console.error('Transcription error:', error);
    return res.status(500).json({
      error: 'Transcription failed',
      details: error.message,
    });
  }
}

