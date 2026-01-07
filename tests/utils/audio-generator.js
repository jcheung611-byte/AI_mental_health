/**
 * Audio Generator - Calls TTS API to generate audio files for testing
 */

const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

/**
 * Generate audio from text using the /api/speak endpoint
 * @param {string} text - The text to convert to speech
 * @param {object} options - Configuration options
 * @param {string} options.baseUrl - Base URL of the API (e.g., http://localhost:3000)
 * @param {string} options.voice - Voice to use (default: 'nova')
 * @param {string} options.model - TTS model (default: 'tts-1')
 * @param {string} options.outputPath - Where to save the audio file
 * @returns {Promise<object>} Metadata about the generated audio
 */
async function generateAudio(text, options = {}) {
  const {
    baseUrl = 'http://localhost:3000',
    voice = 'nova',
    model = 'tts-1',
    outputPath
  } = options;

  if (!outputPath) {
    throw new Error('outputPath is required');
  }

  const startTime = Date.now();

  try {
    console.log(`  🎤 Generating audio: ${text.substring(0, 50)}...`);
    console.log(`     Voice: ${voice}, Model: ${model}`);

    // Call the TTS API
    const response = await fetch(`${baseUrl}/api/speak`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text, voice, model }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`TTS API failed (${response.status}): ${errorText}`);
    }

    // Get the audio buffer
    const audioBuffer = await response.buffer();
    const generationTime = Date.now() - startTime;

    // Save to disk
    fs.writeFileSync(outputPath, audioBuffer);

    // Calculate metadata
    const fileStats = fs.statSync(outputPath);
    const fileSizeKB = (fileStats.size / 1024).toFixed(2);
    const fileSizeMB = (fileStats.size / 1024 / 1024).toFixed(2);

    // Estimate duration based on text length (rough approximation)
    // Average speaking rate: ~150 words per minute
    const wordCount = text.split(/\s+/).length;
    const estimatedDurationSeconds = Math.ceil((wordCount / 150) * 60);

    const metadata = {
      success: true,
      filePath: outputPath,
      fileSize: fileStats.size,
      fileSizeKB: parseFloat(fileSizeKB),
      fileSizeMB: parseFloat(fileSizeMB),
      generationTimeMs: generationTime,
      estimatedDurationSeconds,
      wordCount,
      textLength: text.length,
      voice,
      model,
    };

    console.log(`  ✅ Audio generated: ${fileSizeKB} KB (est. ${estimatedDurationSeconds}s)`);
    console.log(`     Generation time: ${generationTime}ms`);

    return metadata;

  } catch (error) {
    const generationTime = Date.now() - startTime;
    
    console.error(`  ❌ Audio generation failed: ${error.message}`);

    return {
      success: false,
      error: error.message,
      generationTimeMs: generationTime,
      filePath: outputPath,
    };
  }
}

/**
 * Check if a file exists and is valid
 * @param {string} filePath - Path to the audio file
 * @returns {object} Validation result
 */
function validateAudioFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return {
        valid: false,
        error: 'File does not exist',
      };
    }

    const stats = fs.statSync(filePath);
    
    if (stats.size === 0) {
      return {
        valid: false,
        error: 'File is empty (0 bytes)',
      };
    }

    if (stats.size < 100) {
      return {
        valid: false,
        error: `File too small (${stats.size} bytes) - likely invalid`,
      };
    }

    // Check for Vercel's 4.5MB limit
    const maxSize = 4.5 * 1024 * 1024; // 4.5 MB
    if (stats.size > maxSize) {
      return {
        valid: false,
        error: `File exceeds Vercel limit (${(stats.size / 1024 / 1024).toFixed(2)} MB > 4.5 MB)`,
        fileSize: stats.size,
      };
    }

    return {
      valid: true,
      fileSize: stats.size,
      fileSizeKB: (stats.size / 1024).toFixed(2),
      fileSizeMB: (stats.size / 1024 / 1024).toFixed(2),
    };

  } catch (error) {
    return {
      valid: false,
      error: `Validation error: ${error.message}`,
    };
  }
}

module.exports = {
  generateAudio,
  validateAudioFile,
};

