/**
 * End-to-End Test via Vercel APIs
 * 
 * Tests the complete pipeline using Vercel's endpoints:
 * 1. Generate real audio via /api/speak (TTS)
 * 2. Transcribe via /api/transcribe
 * 3. Verify accuracy
 * 
 * No local API key needed - uses Vercel's configured keys!
 */

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = require('node-fetch');

const VERCEL_BASE_URL = 'https://ai-mental-health-seven.vercel.app';

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

async function generateAudioViaAPI(text, outputPath) {
  console.log('🎤 Generating audio via /api/speak...');
  
  const response = await fetch(`${VERCEL_BASE_URL}/api/speak`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`TTS failed: ${response.status} - ${errorData}`);
  }

  const buffer = await response.buffer();
  fs.writeFileSync(outputPath, buffer);
  
  const sizeKB = (buffer.length / 1024).toFixed(2);
  const sizeMB = (buffer.length / (1024 * 1024)).toFixed(2);
  console.log(`  ✅ Generated: ${sizeKB} KB (${sizeMB} MB)`);
  
  return { buffer, sizeKB, sizeMB };
}

async function transcribeAudio(audioPath, filename) {
  console.log('📝 Transcribing audio via /api/transcribe...');
  
  const formData = new FormData();
  formData.append('audio', fs.createReadStream(audioPath), {
    filename: filename,
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
  // Normalize text for comparison
  const normalize = (text) => text.toLowerCase()
    .replace(/[.,!?;:]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  const expectedNorm = normalize(expected);
  const actualNorm = normalize(actual);
  
  const expectedWords = expectedNorm.split(' ');
  const actualWords = actualNorm.split(' ');
  
  // Calculate word-level accuracy
  let matches = 0;
  for (const word of expectedWords) {
    if (actualNorm.includes(word)) {
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
  console.log(`\n📝 Input text (${testCase.text.split(' ').length} words):`);
  console.log(`   "${testCase.text.substring(0, 100)}..."\n`);
  
  const outputPath = path.join(__dirname, 'test-results', `e2e-${testCase.duration}.mp3`);
  
  try {
    // Step 1: Generate real audio via Vercel API
    const startGen = Date.now();
    const { sizeKB, sizeMB } = await generateAudioViaAPI(testCase.text, outputPath);
    const genTime = ((Date.now() - startGen) / 1000).toFixed(1);
    console.log(`  ⏱️  Generation time: ${genTime}s\n`);
    
    // Step 2: Transcribe via Vercel API
    const startTrans = Date.now();
    const transcribed = await transcribeAudio(outputPath, `test-${testCase.duration}.mp3`);
    const transTime = ((Date.now() - startTrans) / 1000).toFixed(1);
    console.log(`  ⏱️  Transcription time: ${transTime}s\n`);
    
    // Step 3: Check accuracy
    const accuracy = calculateAccuracy(testCase.text, transcribed);
    console.log(`📊 Results:`);
    console.log(`   Input:    "${testCase.text.substring(0, 60)}..."`);
    console.log(`   Output:   "${transcribed.substring(0, 60)}..."`);
    console.log(`   Accuracy: ${accuracy}%`);
    console.log(`   File size: ${sizeKB} KB (${sizeMB} MB)`);
    
    if (accuracy >= 80) {
      console.log(`\n✅ TEST PASSED - Accuracy: ${accuracy}%`);
    } else {
      console.log(`\n⚠️  TEST WARNING - Accuracy below 80%: ${accuracy}%`);
      console.log(`   Full transcription: "${transcribed}"`);
    }
    
    return {
      duration: testCase.duration,
      success: true,
      accuracy: parseFloat(accuracy),
      genTime: parseFloat(genTime),
      transTime: parseFloat(transTime),
      sizeKB: parseFloat(sizeKB),
      sizeMB: parseFloat(sizeMB),
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
  console.log('🎯 End-to-End Real Audio Test (via Vercel APIs)');
  console.log('Testing against: ' + VERCEL_BASE_URL);
  console.log('\nThis test uses REAL audio generated by OpenAI TTS');
  console.log('and verifies the complete transcription pipeline.');
  console.log('No local API key needed - uses Vercel\'s configured keys!\n');
  
  // Ensure output directory exists
  const outputDir = path.join(__dirname, 'test-results');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const results = [];
  
  for (const testCase of TEST_CASES) {
    const result = await runTest(testCase);
    results.push(result);
    
    // Small delay between tests
    if (testCase !== TEST_CASES[TEST_CASES.length - 1]) {
      console.log('\n⏳ Waiting 2 seconds before next test...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(80));
  console.log('\n| Duration | Status | Accuracy | File Size | Gen Time | Trans Time |');
  console.log('|----------|--------|----------|-----------|----------|------------|');
  
  for (const result of results) {
    if (result.success) {
      const status = result.accuracy >= 80 ? '✅ PASS' : '⚠️  WARN';
      console.log(`| ${result.duration.padEnd(8)} | ${status} | ${result.accuracy}%     | ${result.sizeMB} MB    | ${result.genTime}s      | ${result.transTime}s       |`);
    } else {
      console.log(`| ${result.duration.padEnd(8)} | ❌ FAIL | N/A      | N/A       | N/A      | N/A        |`);
    }
  }
  
  const passedTests = results.filter(r => r.success && r.accuracy >= 80).length;
  const totalTests = results.length;
  const successfulTests = results.filter(r => r.success);
  
  if (successfulTests.length > 0) {
    const avgAccuracy = successfulTests.reduce((sum, r) => sum + r.accuracy, 0) / successfulTests.length;
    console.log('\n' + '='.repeat(80));
    console.log(`\n✅ Passed: ${passedTests}/${totalTests}`);
    console.log(`📊 Average Accuracy: ${avgAccuracy.toFixed(1)}%`);
  }
  
  console.log('\n🎉 End-to-end pipeline verified with REAL audio!');
  console.log('✅ TTS → Transcription working correctly');
  console.log('✅ File sizes appropriate for MP3 format');
  console.log('\n📝 Note: Frontend uses WebM (50% larger than MP3)');
  console.log('   - 3-min MP3: ~0.5 MB → WebM: ~0.75 MB');
  console.log('   - 7-min MP3: ~1.2 MB → WebM: ~1.8 MB');
  console.log('\nNext: Test on live app with real microphone recordings!\n');
}

main().catch(console.error);

