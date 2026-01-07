/**
 * Transcription Tester - Calls Whisper API to transcribe audio files
 */

const fetch = require('node-fetch');
const fs = require('fs');
const FormData = require('form-data');

/**
 * Transcribe audio file using the /api/transcribe endpoint
 * @param {string} audioFilePath - Path to the audio file to transcribe
 * @param {object} options - Configuration options
 * @param {string} options.baseUrl - Base URL of the API (e.g., http://localhost:3000)
 * @returns {Promise<object>} Transcription result with metadata
 */
async function transcribeAudio(audioFilePath, options = {}) {
  const { baseUrl = 'http://localhost:3000' } = options;

  if (!fs.existsSync(audioFilePath)) {
    return {
      success: false,
      error: 'Audio file does not exist',
      filePath: audioFilePath,
    };
  }

  const startTime = Date.now();

  try {
    const fileStats = fs.statSync(audioFilePath);
    const fileSizeKB = (fileStats.size / 1024).toFixed(2);

    console.log(`  🎧 Transcribing audio: ${audioFilePath}`);
    console.log(`     File size: ${fileSizeKB} KB`);

    // Create form data
    const form = new FormData();
    form.append('audio', fs.createReadStream(audioFilePath), {
      filename: 'audio.mp3',
      contentType: 'audio/mpeg',
    });

    // Call the transcribe API
    const response = await fetch(`${baseUrl}/api/transcribe`, {
      method: 'POST',
      body: form,
      headers: form.getHeaders(),
    });

    const transcriptionTime = Date.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`  ❌ Transcription API failed (${response.status})`);
      
      return {
        success: false,
        error: `API error ${response.status}: ${errorText}`,
        statusCode: response.status,
        transcriptionTimeMs: transcriptionTime,
        filePath: audioFilePath,
        fileSizeBytes: fileStats.size,
      };
    }

    // Parse the response
    const result = await response.json();
    
    if (!result.text) {
      console.error(`  ❌ No transcription text in response`);
      return {
        success: false,
        error: 'No text in response',
        transcriptionTimeMs: transcriptionTime,
        filePath: audioFilePath,
        rawResponse: result,
      };
    }

    const wordCount = result.text.split(/\s+/).length;
    
    console.log(`  ✅ Transcribed: "${result.text.substring(0, 60)}..."`);
    console.log(`     Words: ${wordCount}, Time: ${transcriptionTime}ms`);

    return {
      success: true,
      text: result.text,
      wordCount,
      characterCount: result.text.length,
      transcriptionTimeMs: transcriptionTime,
      filePath: audioFilePath,
      fileSizeBytes: fileStats.size,
      fileSizeKB: parseFloat(fileSizeKB),
    };

  } catch (error) {
    const transcriptionTime = Date.now() - startTime;
    
    console.error(`  ❌ Transcription failed: ${error.message}`);

    return {
      success: false,
      error: error.message,
      errorStack: error.stack,
      transcriptionTimeMs: transcriptionTime,
      filePath: audioFilePath,
    };
  }
}

/**
 * Transcribe audio from URL using the /api/transcribe-url endpoint
 * This is useful for testing Supabase Storage integration
 * @param {string} audioUrl - URL of the audio file
 * @param {object} options - Configuration options
 * @param {string} options.baseUrl - Base URL of the API
 * @returns {Promise<object>} Transcription result with metadata
 */
async function transcribeAudioUrl(audioUrl, options = {}) {
  const { baseUrl = 'http://localhost:3000' } = options;

  const startTime = Date.now();

  try {
    console.log(`  🎧 Transcribing audio from URL: ${audioUrl}`);

    const response = await fetch(`${baseUrl}/api/transcribe-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ audioUrl }),
    });

    const transcriptionTime = Date.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`  ❌ Transcription API failed (${response.status})`);
      
      return {
        success: false,
        error: `API error ${response.status}: ${errorText}`,
        statusCode: response.status,
        transcriptionTimeMs: transcriptionTime,
        audioUrl,
      };
    }

    const result = await response.json();
    
    if (!result.text) {
      return {
        success: false,
        error: 'No text in response',
        transcriptionTimeMs: transcriptionTime,
        audioUrl,
        rawResponse: result,
      };
    }

    const wordCount = result.text.split(/\s+/).length;
    
    console.log(`  ✅ Transcribed: "${result.text.substring(0, 60)}..."`);
    console.log(`     Words: ${wordCount}, Time: ${transcriptionTime}ms`);

    return {
      success: true,
      text: result.text,
      wordCount,
      characterCount: result.text.length,
      transcriptionTimeMs: transcriptionTime,
      audioUrl,
    };

  } catch (error) {
    const transcriptionTime = Date.now() - startTime;
    
    console.error(`  ❌ Transcription failed: ${error.message}`);

    return {
      success: false,
      error: error.message,
      errorStack: error.stack,
      transcriptionTimeMs: transcriptionTime,
      audioUrl,
    };
  }
}

module.exports = {
  transcribeAudio,
  transcribeAudioUrl,
};

