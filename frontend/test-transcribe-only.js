// Test transcription API with a manually created audio file
require('dotenv').config({ path: '.env.local' });
const OpenAI = require('openai').default;
const fs = require('fs');
const path = require('path');

console.log('\n🔍 Testing Transcription API Only\n');

const openai = new OpenAI({
  apiKey: process.env.PORTKEY_API_KEY,
  baseURL: process.env.PORTKEY_BASE_URL,
  defaultHeaders: {
    'x-portkey-virtual-key': process.env.PORTKEY_VIRTUAL_KEY,
  },
});

async function testTranscription() {
  console.log('This test requires you to provide a test audio file.');
  console.log('Steps:');
  console.log('1. Open: file:///Users/jordan.cheung/Documents/GitHub/Personal/AI%20voice/frontend/test-recording.html');
  console.log('2. Record some audio (hold the button and speak)');
  console.log('3. Download the test-recording.webm file');
  console.log('4. Move it to the frontend folder');
  console.log('5. Run this test again');
  console.log('');
  
  const testFile = path.join(__dirname, 'test-recording.webm');
  
  if (!fs.existsSync(testFile)) {
    console.log('❌ test-recording.webm not found.');
    console.log('Please follow the steps above first.');
    return;
  }
  
  console.log('✅ Found test-recording.webm');
  const stats = fs.statSync(testFile);
  console.log(`   File size: ${stats.size} bytes (${(stats.size / 1024).toFixed(2)} KB)`);
  console.log('');
  
  if (stats.size < 1000) {
    console.log('⚠️  WARNING: File is very small (< 1KB). Audio might be too short.');
    console.log('');
  }
  
  try {
    console.log('📡 Sending to Whisper API...');
    
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(testFile),
      model: 'whisper-1',
    });
    
    console.log('✅ SUCCESS!');
    console.log('');
    console.log('Transcription:');
    console.log('━'.repeat(60));
    console.log(transcription.text);
    console.log('━'.repeat(60));
    console.log('');
    console.log('🎉 Transcription API is working correctly!');
    
  } catch (error) {
    console.log('❌ TRANSCRIPTION FAILED');
    console.log('');
    console.log('Error:', error.message);
    console.log('');
    
    if (error.message.includes('too short')) {
      console.log('💡 The audio file is too short or empty.');
      console.log('   This suggests the recording might not be capturing audio correctly.');
    }
  }
}

testTranscription();



