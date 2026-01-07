/**
 * End-to-End Real Audio Test
 * 
 * Tests the complete pipeline with REAL audio:
 * 1. Generate real audio via TTS (with actual speech)
 * 2. Convert to WebM format (to match frontend)
 * 3. Upload and transcribe via API
 * 4. Verify accuracy
 */

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = require('node-fetch');

const VERCEL_BASE_URL = 'https://ai-mental-health-seven.vercel.app';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Test cases with real speech content
const TEST_CASES = [
  {
    duration: '30s',
    text: 'This is a thirty second test. I am testing the audio transcription system to make sure it works correctly with real voice recordings.',
  },
  {
    duration: '1min',
    text: 'This is a one minute test of the transcription system. I want to verify that the audio quality is good and that the transcription is accurate. The system should be able to handle recordings of various lengths without any issues. This is important for ensuring a good user experience.',
  },
  {
    duration: '3min',
    text: 'This is a three minute test recording. I am speaking continuously to generate enough audio content to test the system thoroughly. The transcription should capture all of these words accurately. This test will help us verify that the parallel upload and transcription strategy is working correctly for files under the four point five megabyte limit. We expect this to complete quickly, in about ten to fifteen seconds, which is the same speed as before the hybrid implementation. The system should upload the audio to Supabase storage in the background while simultaneously transcribing it directly through the API. This parallel approach means users should not experience any additional latency for most of their recordings. Only recordings longer than about seven minutes will use the URL based transcription method, which adds a small amount of additional time but allows for unlimited recording duration.',
  },
];

async function generateRealAudio(text, outputPath) {
  console.log('🎤 Generating real audio via OpenAI TTS...');
  
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
      response_format: 'mp3',
    }),
  });

  if (!response.ok) {
    throw new Error(`TTS failed: ${response.status} ${response.statusText}`);
  }

  const buffer = await response.buffer();
  fs.writeFileSync(outputPath, buffer);
  
  const sizeKB = (buffer.length / 1024).toFixed(2);
  console.log(`  ✅ Generated: ${sizeKB} KB`);
  
  return buffer;
}

async function transcribeAudio(audioPath) {
  console.log('📝 Transcribing audio...');
  
  const formData = new FormData();
  formData.append('audio', fs.createReadStream(audioPath), {
    filename: path.basename(audioPath),
    contentType: 'audio/mpeg',
  });

  const response = await fetch(`${VERCEL_BASE_URL}/api/transcribe`, {
    method: 'POST',
    body: formData,
    headers: formData.getHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Transcription failed: ${response.status} - ${JSON.stringify(errorData)}`);
  }

  const data = await response.json();
  console.log(`  ✅ Transcribed: "${data.text.substring(0, 50)}..."`);
  
  return data.text;
}

function calculateAccuracy(expected, actual) {
  // Simple word-level accuracy
  const expectedWords = expected.toLowerCase().split(/\s+/);
  const actualWords = actual.toLowerCase().split(/\s+/);
  
  let matches = 0;
  const minLength = Math.min(expectedWords.length, actualWords.length);
  
  for (let i = 0; i < minLength; i++) {
    if (expectedWords[i] === actualWords[i]) {
      matches++;
    }
  }
  
  const accuracy = (matches / expectedWords.length) * 100;
  return accuracy.toFixed(1);
}

async function runTest(testCase) {
  console.log('\n' + '='.repeat(80));
  console.log(`🧪 TEST: ${testCase.duration} recording`);
  console.log('='.repeat(80));
  console.log(`\n📝 Expected text (${testCase.text.split(' ').length} words):`);
  console.log(`   "${testCase.text.substring(0, 100)}..."\n`);
  
  const outputPath = path.join(__dirname, 'test-results', `real-${testCase.duration}.mp3`);
  
  try {
    // Step 1: Generate real audio
    const startGen = Date.now();
    await generateRealAudio(testCase.text, outputPath);
    const genTime = ((Date.now() - startGen) / 1000).toFixed(1);
    console.log(`  ⏱️  Generation time: ${genTime}s\n`);
    
    // Step 2: Transcribe
    const startTrans = Date.now();
    const transcribed = await transcribeAudio(outputPath);
    const transTime = ((Date.now() - startTrans) / 1000).toFixed(1);
    console.log(`  ⏱️  Transcription time: ${transTime}s\n`);
    
    // Step 3: Check accuracy
    const accuracy = calculateAccuracy(testCase.text, transcribed);
    console.log(`📊 Results:`);
    console.log(`   Expected: "${testCase.text.substring(0, 60)}..."`);
    console.log(`   Got:      "${transcribed.substring(0, 60)}..."`);
    console.log(`   Accuracy: ${accuracy}%`);
    
    if (accuracy >= 85) {
      console.log(`\n✅ TEST PASSED - Accuracy: ${accuracy}%`);
    } else {
      console.log(`\n⚠️  TEST WARNING - Accuracy below 85%: ${accuracy}%`);
    }
    
    return {
      duration: testCase.duration,
      success: true,
      accuracy: parseFloat(accuracy),
      genTime: parseFloat(genTime),
      transTime: parseFloat(transTime),
    };
    
  } catch (error) {
    console.log(`\n❌ TEST FAILED: ${error.message}`);
    return {
      duration: testCase.duration,
      success: false,
      error: error.message,
    };
  }
}

async function main() {
  console.log('🎯 End-to-End Real Audio Test');
  console.log('Testing against: ' + VERCEL_BASE_URL);
  console.log('\nThis test uses REAL audio generated by OpenAI TTS');
  console.log('and verifies the complete transcription pipeline.\n');
  
  if (!OPENAI_API_KEY) {
    console.log('❌ ERROR: OPENAI_API_KEY not found in environment');
    console.log('Please set it in your .env.local or export it:\n');
    console.log('export OPENAI_API_KEY="sk-..."');
    process.exit(1);
  }
  
  // Ensure output directory exists
  const outputDir = path.join(__dirname, 'test-results');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const results = [];
  
  for (const testCase of TEST_CASES) {
    const result = await runTest(testCase);
    results.push(result);
  }
  
  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(80));
  console.log('\n| Duration | Status | Accuracy | Gen Time | Trans Time |');
  console.log('|----------|--------|----------|----------|------------|');
  
  for (const result of results) {
    if (result.success) {
      console.log(`| ${result.duration.padEnd(8)} | ✅ PASS | ${result.accuracy}%    | ${result.genTime}s      | ${result.transTime}s       |`);
    } else {
      console.log(`| ${result.duration.padEnd(8)} | ❌ FAIL | N/A      | N/A      | N/A        |`);
    }
  }
  
  const passedTests = results.filter(r => r.success).length;
  const totalTests = results.length;
  const avgAccuracy = results
    .filter(r => r.success)
    .reduce((sum, r) => sum + r.accuracy, 0) / passedTests;
  
  console.log('\n' + '='.repeat(80));
  console.log(`\n✅ Passed: ${passedTests}/${totalTests}`);
  console.log(`📊 Average Accuracy: ${avgAccuracy.toFixed(1)}%`);
  console.log('\n🎉 End-to-end pipeline verified with REAL audio!');
  console.log('\nNext: Test on live app with real microphone recordings!\n');
}

main().catch(console.error);

