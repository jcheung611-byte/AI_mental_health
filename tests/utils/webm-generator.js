/**
 * WebM Audio Generator - Creates synthetic WebM audio files for testing
 * Simulates real browser MediaRecorder output without needing a microphone
 */

const fs = require('fs');

/**
 * Generate a synthetic WebM audio file of specified duration
 * This simulates what the browser MediaRecorder produces
 * 
 * @param {number} durationSeconds - Target duration in seconds
 * @param {string} outputPath - Where to save the file
 * @returns {object} File metadata
 */
function generateWebM(durationSeconds, outputPath) {
  // WebM/Opus encoding: ~12KB per second (based on audioRecorder.ts)
  const bytesPerSecond = 12 * 1024;
  const targetSize = durationSeconds * bytesPerSecond;
  
  // WebM file structure (simplified but valid)
  const webmHeader = Buffer.from([
    0x1A, 0x45, 0xDF, 0xA3, // EBML header
    0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x1F,
    0x42, 0x86, 0x81, 0x01,
    0x42, 0xF7, 0x81, 0x01,
    0x42, 0xF2, 0x81, 0x04,
    0x42, 0xF3, 0x81, 0x08,
    0x42, 0x82, 0x84, 0x77, 0x65, 0x62, 0x6D, // "webm"
    0x42, 0x87, 0x81, 0x04,
    0x42, 0x85, 0x81, 0x02,
  ]);
  
  // Create audio data chunk (filled with pattern to simulate opus codec)
  const audioDataSize = targetSize - webmHeader.length - 100; // Leave room for footer
  const audioData = Buffer.alloc(audioDataSize);
  
  // Fill with a pattern that resembles compressed audio
  // This isn't real opus data, but has similar size/structure for testing
  for (let i = 0; i < audioDataSize; i++) {
    // Generate pseudo-random pattern that compresses like opus
    audioData[i] = Math.floor(Math.sin(i / 100) * 50 + 128);
  }
  
  // Combine into final file
  const finalBuffer = Buffer.concat([webmHeader, audioData]);
  
  // Write to disk
  fs.writeFileSync(outputPath, finalBuffer);
  
  const stats = fs.statSync(outputPath);
  const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
  const percentOfLimit = ((stats.size / (4.5 * 1024 * 1024)) * 100).toFixed(1);
  
  console.log(`  ✅ Generated WebM: ${sizeMB} MB (${percentOfLimit}% of 4.5MB limit)`);
  
  return {
    success: true,
    filePath: outputPath,
    fileSize: stats.size,
    fileSizeKB: (stats.size / 1024).toFixed(2),
    fileSizeMB: parseFloat(sizeMB),
    percentOfLimit: parseFloat(percentOfLimit),
    durationSeconds,
    format: 'audio/webm',
  };
}

/**
 * Check if a file would exceed Vercel's limit
 * @param {number} fileSize - Size in bytes
 * @returns {object} Analysis
 */
function analyzeFileSizeLimit(fileSize) {
  const limitBytes = 4.5 * 1024 * 1024; // 4.5 MB
  const percentUsed = (fileSize / limitBytes) * 100;
  
  let status = 'safe';
  let message = 'Well under limit';
  
  if (fileSize >= limitBytes) {
    status = 'exceeded';
    message = 'EXCEEDS VERCEL LIMIT - Will get 413 error';
  } else if (percentUsed >= 95) {
    status = 'critical';
    message = 'Very close to limit - risky';
  } else if (percentUsed >= 80) {
    status = 'warning';
    message = 'Approaching limit';
  }
  
  return {
    status,
    message,
    percentUsed: percentUsed.toFixed(1),
    bytesRemaining: Math.max(0, limitBytes - fileSize),
    willFail: fileSize >= limitBytes,
  };
}

module.exports = {
  generateWebM,
  analyzeFileSizeLimit,
};



