/**
 * End-to-End Real Audio Testing
 * 
 * Tests the complete pipeline with REAL audio:
 * 1. Generate audio via OpenAI TTS (real speech)
 * 2. Upload to live Vercel app
 * 3. Transcribe and verify accuracy
 * 4. Test both short (3min) and long (7min) recordings
 */

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = require('node-fetch');

const VERCEL_URL = process.env.VERCEL_URL || 'https://ai-mental-health-seven.vercel.app';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.error('❌ Error: OPENAI_API_KEY environment variable is required');
  console.log('\nUsage:');
  console.log('  OPENAI_API_KEY=sk-... node test-real-audio-e2e.js');
  process.exit(1);
}

// Test cases with progressively longer text
const TEST_CASES = [
  {
    name: '30 seconds',
    duration: 30,
    text: `This is a thirty second test of the audio transcription pipeline. 
           We're testing to ensure that the system can handle real audio generated 
           by text-to-speech and accurately transcribe it back to text. This should 
           take approximately thirty seconds to read aloud at a normal speaking pace.`
  },
  {
    name: '1 minute',
    duration: 60,
    text: `This is a one minute test of the audio transcription system. The purpose 
           of this test is to verify that our hybrid upload strategy works correctly 
           with real audio files. We're using OpenAI's text-to-speech to generate 
           authentic audio, then uploading it to our Vercel app, and finally transcribing 
           it using Whisper. This approach ensures we're testing the complete pipeline 
           with realistic audio data. The file size should be small enough to use the 
           parallel upload strategy, which means both uploading to storage and transcribing 
           happen simultaneously. This should complete in about one minute of audio.`
  },
  {
    name: '3 minutes',
    duration: 180,
    text: `This is a three minute test of our voice transcription system. The mental health 
           companion app needs to handle longer recording sessions where users might want to 
           talk through their feelings, thoughts, and experiences in depth. Three minutes is 
           a realistic duration for someone venting about their day or working through an emotion.
           
           The system uses a hybrid approach where files under four point five megabytes are 
           processed using parallel upload and transcription. This means the audio is uploaded 
           to Supabase storage while simultaneously being transcribed by OpenAI's Whisper API. 
           For the user, this results in no additional latency compared to the old system.
           
           For longer recordings that exceed the Vercel body size limit, we automatically switch 
           to a URL-based transcription method. The audio is first uploaded to Supabase, then 
           Whisper downloads it directly from the storage URL. This bypasses Vercel's four point 
           five megabyte limit entirely, allowing us to support recordings of twenty minutes or more.
           
           This three minute recording should generate an MP3 file of approximately one point four 
           megabytes, well under our threshold. We expect this to transcribe with high accuracy, 
           maintaining the original meaning and intent of the speech. Let's see how well it performs.`
  },
  {
    name: '7 minutes (STRESS TEST)',
    duration: 420,
    text: `This is a seven minute stress test of the transcription system. This duration 
           is specifically chosen because it exceeds the Vercel body size limit when encoded 
           as WebM audio from the browser. While this MP3 version will be smaller, around 
           three point three megabytes, the equivalent WebM recording would be approximately 
           four point nine megabytes, triggering our URL-based upload strategy.
           
           Let me tell you about why this mental health companion app exists. Many people 
           struggle to find someone to talk to when they're feeling overwhelmed, anxious, 
           or just need to process their thoughts. Traditional therapy is expensive and 
           not always accessible. Friends and family might not always be available or might 
           not understand what you're going through.
           
           That's where this app comes in. It provides a judgment-free space where you can 
           voice your thoughts, feelings, and experiences. The AI companion listens actively, 
           asks thoughtful questions, and helps you work through what you're feeling. It 
           remembers important details about your life, so conversations feel continuous 
           and meaningful rather than starting from scratch each time.
           
           The voice interface is crucial because speaking is more natural and cathartic 
           than typing. When you're upset or anxious, the last thing you want to do is 
           type out long messages. You just want to talk. The app transcribes everything 
           you say, processes it through a sophisticated language model, and responds with 
           empathy and understanding.
           
           One of the biggest technical challenges was handling long recording sessions. 
           Initially, recordings were limited to about seven minutes due to Vercel's 
           serverless function constraints. Users would hit this limit right when they 
           were getting into the flow of expressing themselves, which was frustrating 
           and broke the emotional connection.
           
           The solution was implementing a hybrid upload strategy using Supabase Storage. 
           For most recordings under seven minutes, the system uses parallel processing 
           to upload and transcribe simultaneously, maintaining the fast response time 
           users expect. For longer sessions, it gracefully switches to uploading first, 
           then transcribing from the storage URL. This adds a few seconds of latency 
           but removes the duration limit entirely.
           
           This seven minute test pushes the boundaries of what users might record in 
           a single session. It's long enough to have a real conversation, work through 
           a difficult emotion, or tell a complete story about something that happened. 
           The transcription accuracy at this duration is critical because users need to 
           trust that their words are being heard correctly, especially when discussing 
           sensitive mental health topics.
           
           The system also stores these audio recordings in a voice journal library, 
           allowing users to revisit past conversations and track their emotional journey 
           over time. This is powerful for mental health because you can see patterns, 
           recognize growth, and remember insights you had during previous sessions.
           
           By the time this seven minute recording completes, we'll have verified that 
           the entire pipeline works end-to-end with realistic audio. This gives us 
           confidence to ship the feature to real users who need this tool to support 
           their mental health journey.`
  }
];

/**
 * Generate real audio using OpenAI TTS
 */
async function generateRealAudio(text, outputPath) {
  console.log(`\n🎙️  Generating REAL audio with OpenAI TTS...`);
  
  const response = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'tts-1',
      voice: 'nova',
      input: text,
      speed: 1.0
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`TTS API failed: ${response.status} ${error}`);
  }

  const buffer = await response.buffer();
  fs.writeFileSync(outputPath, buffer);
  
  const sizeInMB = (buffer.length / 1024 / 1024).toFixed(2);
  console.log(`  ✅ Generated: ${path.basename(outputPath)} (${sizeInMB} MB)`);
  
  return { path: outputPath, size: buffer.length };
}

/**
 * Upload audio and transcribe via Vercel API
 */
async function transcribeAudio(audioPath) {
  console.log(`\n📤 Uploading to Vercel: ${VERCEL_URL}/api/transcribe`);
  
  const formData = new FormData();
  formData.append('audio', fs.createReadStream(audioPath), {
    filename: path.basename(audioPath),
    contentType: 'audio/mpeg'
  });

  const startTime = Date.now();
  
  const response = await fetch(`${VERCEL_URL}/api/transcribe`, {
    method: 'POST',
    body: formData,
    headers: formData.getHeaders()
  });

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(`Transcription failed (${response.status}): ${JSON.stringify(error)}`);
  }

  const result = await response.json();
  console.log(`  ✅ Transcribed in ${duration}s`);
  
  return {
    text: result.text,
    duration: parseFloat(duration)
  };
}

/**
 * Calculate similarity between original and transcribed text
 * Uses Levenshtein distance at character level to handle Whisper's normalization
 */
function calculateAccuracy(original, transcribed) {
  // Normalize text for comparison (handle Whisper's number/punctuation normalization)
  const normalize = (text) => text
    .toLowerCase()
    .replace(/\bone\b/g, '1')
    .replace(/\btwo\b/g, '2')
    .replace(/\bthree\b/g, '3')
    .replace(/\bfour\b/g, '4')
    .replace(/\bfive\b/g, '5')
    .replace(/\bsix\b/g, '6')
    .replace(/\bseven\b/g, '7')
    .replace(/\beight\b/g, '8')
    .replace(/\bnine\b/g, '9')
    .replace(/\bten\b/g, '10')
    .replace(/\btwenty\b/g, '20')
    .replace(/\bthirty\b/g, '30')
    .replace(/\bforty\b/g, '40')
    .replace(/\bfifty\b/g, '50')
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  const orig = normalize(original);
  const trans = normalize(transcribed);

  // Calculate character-level Levenshtein distance
  const distance = levenshteinDistance(orig, trans);
  const maxLen = Math.max(orig.length, trans.length);
  const accuracy = ((1 - distance / maxLen) * 100).toFixed(2);

  // Also calculate word count for reference
  const origWords = orig.split(' ').length;
  const transWords = trans.split(' ').length;
  
  return {
    accuracy: parseFloat(accuracy),
    originalWords: origWords,
    transcribedWords: transWords,
    distance
  };
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1, str2) {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix = Array(len1 + 1).fill(null).map(() => Array(len2 + 1).fill(0));

  for (let i = 0; i <= len1; i++) matrix[i][0] = i;
  for (let j = 0; j <= len2; j++) matrix[0][j] = j;

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[len1][len2];
}

/**
 * Run a single test case
 */
async function runTest(testCase) {
  console.log('\n' + '='.repeat(80));
  console.log(`🧪 TEST: ${testCase.name}`);
  console.log('='.repeat(80));

  const audioPath = path.join(__dirname, 'test-results', `e2e-${testCase.duration}s.mp3`);

  try {
    // Step 1: Generate real audio
    const audio = await generateRealAudio(testCase.text, audioPath);
    
    // Step 2: Transcribe
    const result = await transcribeAudio(audioPath);
    
    // Step 3: Calculate accuracy
    const accuracy = calculateAccuracy(testCase.text, result.text);
    
    // Step 4: Results
    console.log('\n📊 RESULTS:');
    console.log(`  Audio Size: ${(audio.size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  Transcription Time: ${result.duration}s`);
    console.log(`  Word Accuracy: ${accuracy.accuracy}%`);
    console.log(`  Words: ${accuracy.transcribedWords} (expected ~${accuracy.originalWords})`);
    
    console.log('\n📝 Original Text (first 200 chars):');
    console.log(`  "${testCase.text.substring(0, 200).replace(/\s+/g, ' ')}..."`);
    
    console.log('\n🎯 Transcribed Text (first 200 chars):');
    console.log(`  "${result.text.substring(0, 200)}..."`);
    
    const passed = accuracy.accuracy >= 80 && result.duration < 60;
    
    if (passed) {
      console.log('\n✅ TEST PASSED');
    } else {
      console.log('\n⚠️  TEST WARNING');
      if (accuracy.accuracy < 80) {
        console.log(`  - Accuracy ${accuracy.accuracy}% below 80% threshold`);
      }
      if (result.duration >= 60) {
        console.log(`  - Duration ${result.duration}s exceeded 60s threshold`);
      }
    }
    
    return {
      name: testCase.name,
      passed,
      accuracy: accuracy.accuracy,
      duration: result.duration,
      size: audio.size
    };
    
  } catch (error) {
    console.log(`\n❌ TEST FAILED: ${error.message}`);
    return {
      name: testCase.name,
      passed: false,
      error: error.message
    };
  }
}

/**
 * Main test runner
 */
async function main() {
  console.log('🎯 End-to-End Real Audio Testing');
  console.log(`Testing against: ${VERCEL_URL}`);
  console.log(`OpenAI API Key: ${OPENAI_API_KEY.substring(0, 20)}...`);
  
  // Ensure test results directory exists
  const resultsDir = path.join(__dirname, 'test-results');
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }

  const results = [];
  
  for (const testCase of TEST_CASES) {
    const result = await runTest(testCase);
    results.push(result);
    
    // Wait between tests to avoid rate limits
    if (testCase !== TEST_CASES[TEST_CASES.length - 1]) {
      console.log('\n⏳ Waiting 5 seconds before next test...');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }

  // Final summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 FINAL SUMMARY');
  console.log('='.repeat(80));
  
  results.forEach(result => {
    const status = result.passed ? '✅' : '❌';
    const details = result.error 
      ? `Error: ${result.error}`
      : `${result.accuracy}% accuracy, ${result.duration}s`;
    console.log(`${status} ${result.name}: ${details}`);
  });
  
  const passedCount = results.filter(r => r.passed).length;
  console.log(`\n${passedCount}/${results.length} tests passed`);
  
  if (passedCount === results.length) {
    console.log('\n🎉 ALL TESTS PASSED! System is working end-to-end! 🎉');
  } else {
    console.log('\n⚠️  Some tests failed. Review results above.');
  }
}

// Run tests
main().catch(console.error);

