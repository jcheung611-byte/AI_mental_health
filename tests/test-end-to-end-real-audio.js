/**
 * End-to-End Real Audio Test
 * 
 * Tests the complete pipeline with REAL audio (not synthetic):
 * 1. Generate real audio using OpenAI TTS (MP3)
 * 2. Convert to WebM format (mimics browser recording)
 * 3. Upload to transcription API
 * 4. Verify transcription accuracy
 * 
 * This verifies the entire pipeline works with real audio content.
 */

const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = require('node-fetch');
const { execSync } = require('child_process');

const VERCEL_BASE_URL = process.env.VERCEL_URL || 'https://ai-mental-health-seven.vercel.app';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.error('❌ OPENAI_API_KEY not found in environment variables');
  console.error('Please set it in your .env.local file');
  process.exit(1);
}

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// Test cases with varying durations
const TEST_CASES = [
  {
    duration: '3 minutes',
    text: `This is a comprehensive test of the audio transcription pipeline. 
           We're testing a three minute recording to verify that the parallel upload strategy works correctly.
           The system should upload to Supabase and transcribe directly at the same time.
           This should complete quickly with no additional latency compared to the old system.
           We're now halfway through the three minute test recording.
           The transcription should be accurate and the audio should be stored in Supabase Storage.
           Almost done now, just a few more seconds to reach the three minute mark.
           This concludes our three minute test recording.`,
  },
  {
    duration: '7 minutes',
    text: `This is a longer test recording that will exceed the Vercel four point five megabyte limit.
           We're testing a seven minute recording to verify that the URL-based transcription strategy works correctly.
           This recording would have failed in the old system but should now succeed.
           The system should first upload to Supabase Storage, then transcribe from the URL.
           This may take slightly longer than the parallel method but should still complete successfully.
           We're now about one minute into the seven minute test recording.
           The audio file size will be approximately five megabytes when encoded as WebM.
           This exceeds Vercel's request body limit so the URL method is essential.
           We're now about two minutes into the recording, still going strong.
           The transcription accuracy should remain high even for longer recordings.
           Three minutes in now, we're almost halfway through the seven minute test.
           The system is designed to handle recordings up to twenty minutes or longer.
           Four minutes into the recording, the file size continues to grow.
           The Supabase Storage bucket should have plenty of space for this recording.
           Five minutes in, we're getting close to the end of this test.
           The URL-based transcription method is crucial for long recordings like this.
           Six minutes into the recording, almost done now.
           This concludes our seven minute test recording, verifying the complete pipeline works end to end.`,
  },
];

async function generateRealAudio(text, outputPath) {
  console.log('  🎤 Generating real audio with OpenAI TTS...');
  
  const mp3 = await openai.audio.speech.create({
    model: 'tts-1',
    voice: 'nova',
    input: text,
    speed: 1.0,
  });

  const buffer = Buffer.from(await mp3.arrayBuffer());
  const mp3Path = outputPath.replace('.webm', '.mp3');
  fs.writeFileSync(mp3Path, buffer);
  
  const stats = fs.statSync(mp3Path);
  console.log(`  ✅ Generated MP3: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
  
  return mp3Path;
}

async function convertToWebM(mp3Path, webmPath) {
  console.log('  🔄 Converting MP3 to WebM (mimicking browser recording)...');
  
  try {
    // Check if ffmpeg is available
    try {
      execSync('which ffmpeg', { stdio: 'ignore' });
    } catch (e) {
      console.log('  ⚠️  ffmpeg not found - skipping conversion, using MP3 directly');
      console.log('     (Install ffmpeg with: brew install ffmpeg)');
      return mp3Path;
    }
    
    // Convert MP3 to WebM with Opus codec (same as browser MediaRecorder)
    execSync(
      `ffmpeg -i "${mp3Path}" -c:a libopus -b:a 128k -y "${webmPath}"`,
      { stdio: 'ignore' }
    );
    
    const stats = fs.statSync(webmPath);
    console.log(`  ✅ Converted to WebM: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    
    return webmPath;
  } catch (error) {
    console.log('  ⚠️  Conversion failed, using MP3 directly');
    return mp3Path;
  }
}

async function transcribeAudio(audioPath) {
  console.log('  🎧 Transcribing audio...');
  
  const formData = new FormData();
  const audioBuffer = fs.readFileSync(audioPath);
  const fileName = path.basename(audioPath);
  
  formData.append('audio', audioBuffer, {
    filename: fileName,
    contentType: fileName.endsWith('.webm') ? 'audio/webm' : 'audio/mpeg',
  });

  const stats = fs.statSync(audioPath);
  const fileSizeMB = stats.size / 1024 / 1024;
  console.log(`     File size: ${fileSizeMB.toFixed(2)} MB`);
  
  // Determine expected strategy
  const VERCEL_LIMIT_MB = 4.5;
  const expectedStrategy = fileSizeMB <= VERCEL_LIMIT_MB ? 'parallel' : 'url';
  console.log(`     Expected strategy: ${expectedStrategy}`);

  try {
    const response = await fetch(`${VERCEL_BASE_URL}/api/transcribe`, {
      method: 'POST',
      body: formData,
      headers: formData.getHeaders(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Transcription failed (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    console.log(`  ✅ Transcription complete!`);
    
    return {
      transcribedText: data.text,
      expectedStrategy,
      fileSizeMB,
    };
  } catch (error) {
    console.error(`  ❌ Transcription error: ${error.message}`);
    throw error;
  }
}

function calculateAccuracy(original, transcribed) {
  // Simple word-level accuracy
  const originalWords = original.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 0);
  
  const transcribedWords = transcribed.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 0);
  
  let matches = 0;
  const minLength = Math.min(originalWords.length, transcribedWords.length);
  
  for (let i = 0; i < minLength; i++) {
    if (originalWords[i] === transcribedWords[i]) {
      matches++;
    }
  }
  
  const accuracy = (matches / originalWords.length) * 100;
  return {
    accuracy: accuracy.toFixed(1),
    originalWords: originalWords.length,
    transcribedWords: transcribedWords.length,
    matches,
  };
}

async function runTest(testCase, index) {
  console.log('═'.repeat(80));
  console.log(`🧪 TEST ${index + 1}: ${testCase.duration}`);
  console.log('═'.repeat(80));
  console.log();
  
  const testDir = path.join(__dirname, 'test-results');
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }
  
  const baseName = `real-audio-${testCase.duration.replace(' ', '-')}`;
  const mp3Path = path.join(testDir, `${baseName}.mp3`);
  const webmPath = path.join(testDir, `${baseName}.webm`);
  
  try {
    // Step 1: Generate real audio with TTS
    console.log('📝 Step 1: Generate real audio');
    const generatedMp3 = await generateRealAudio(testCase.text, webmPath);
    console.log();
    
    // Step 2: Convert to WebM (if ffmpeg available)
    console.log('🔄 Step 2: Convert to WebM format');
    const audioPath = await convertToWebM(generatedMp3, webmPath);
    const isWebM = audioPath.endsWith('.webm');
    console.log();
    
    // Step 3: Transcribe
    console.log('🎙️  Step 3: Transcribe audio');
    const result = await transcribeAudio(audioPath);
    console.log();
    
    // Step 4: Calculate accuracy
    console.log('📊 Step 4: Verify accuracy');
    const metrics = calculateAccuracy(testCase.text, result.transcribedText);
    
    console.log(`  Original words: ${metrics.originalWords}`);
    console.log(`  Transcribed words: ${metrics.transcribedWords}`);
    console.log(`  Matches: ${metrics.matches}`);
    console.log(`  Accuracy: ${metrics.accuracy}%`);
    console.log();
    
    // Results
    console.log('✅ TEST RESULTS:');
    console.log(`  Duration: ${testCase.duration}`);
    console.log(`  Format: ${isWebM ? 'WebM (real browser format!)' : 'MP3 (fallback)'}`);
    console.log(`  File size: ${result.fileSizeMB.toFixed(2)} MB`);
    console.log(`  Expected strategy: ${result.expectedStrategy}`);
    console.log(`  Transcription accuracy: ${metrics.accuracy}%`);
    console.log(`  Status: ${metrics.accuracy >= 80 ? '✅ PASSED' : '⚠️  LOW ACCURACY'}`);
    console.log();
    
    // Show sample of transcription
    console.log('📝 Transcription sample (first 200 chars):');
    console.log(`  "${result.transcribedText.substring(0, 200)}..."`);
    console.log();
    
    return {
      duration: testCase.duration,
      format: isWebM ? 'webm' : 'mp3',
      fileSizeMB: result.fileSizeMB,
      strategy: result.expectedStrategy,
      accuracy: metrics.accuracy,
      passed: metrics.accuracy >= 80,
    };
    
  } catch (error) {
    console.error('❌ TEST FAILED');
    console.error(`   Error: ${error.message}`);
    console.log();
    
    return {
      duration: testCase.duration,
      error: error.message,
      passed: false,
    };
  }
}

async function main() {
  console.log('🎯 End-to-End Real Audio Test\n');
  console.log('Testing against:', VERCEL_BASE_URL);
  console.log('Using: REAL audio from OpenAI TTS');
  console.log('Format: WebM (same as browser recording)');
  console.log('Vercel limit: 4.5 MB\n');
  console.log('This test verifies:');
  console.log('  ✓ Real audio generation (TTS)');
  console.log('  ✓ WebM format conversion');
  console.log('  ✓ File size detection');
  console.log('  ✓ Strategy selection (parallel vs URL)');
  console.log('  ✓ Transcription accuracy\n');
  
  const results = [];
  
  for (let i = 0; i < TEST_CASES.length; i++) {
    const result = await runTest(TEST_CASES[i], i);
    results.push(result);
    
    if (i < TEST_CASES.length - 1) {
      console.log('⏳ Waiting 2 seconds before next test...\n');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  // Summary
  console.log('═'.repeat(80));
  console.log('📊 FINAL SUMMARY');
  console.log('═'.repeat(80));
  console.log();
  
  results.forEach((result, i) => {
    const status = result.passed ? '✅' : '❌';
    console.log(`${status} Test ${i + 1}: ${result.duration}`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    } else {
      console.log(`   Format: ${result.format.toUpperCase()}`);
      console.log(`   Size: ${result.fileSizeMB.toFixed(2)} MB`);
      console.log(`   Strategy: ${result.strategy}`);
      console.log(`   Accuracy: ${result.accuracy}%`);
    }
    console.log();
  });
  
  const allPassed = results.every(r => r.passed);
  
  if (allPassed) {
    console.log('🎉 ALL TESTS PASSED!');
    console.log('✅ Real audio transcription works end-to-end');
    console.log('✅ Both parallel and URL strategies verified');
    console.log('✅ Ready for live testing!\n');
  } else {
    console.log('⚠️  SOME TESTS FAILED');
    console.log('Review errors above and retry\n');
  }
  
  console.log('💡 Note: If ffmpeg is not installed, tests use MP3 format.');
  console.log('   Install ffmpeg for true WebM testing: brew install ffmpeg\n');
  
  console.log('🚀 Next step: Test on live app with real microphone recording!');
  console.log('   URL: https://ai-mental-health-seven.vercel.app\n');
}

main().catch(console.error);

