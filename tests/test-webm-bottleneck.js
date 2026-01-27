#!/usr/bin/env node

/**
 * WebM Bottleneck Test - Tests REAL file sizes that frontend generates
 * This generates WebM files like the browser does, not MP3 from TTS
 */

const fs = require('fs');
const path = require('path');
const { generateWebM, analyzeFileSizeLimit } = require('./utils/webm-generator');
const { transcribeAudio } = require('./utils/transcription-tester');

// Configuration
const BASE_URL = process.argv[2] || 'https://ai-mental-health-seven.vercel.app';
const RESULTS_DIR = path.join(__dirname, 'test-results');

// Test cases focusing on the bottleneck
const TEST_DURATIONS = [
  { duration: 300, label: '5 minutes', expected: 'pass' },
  { duration: 360, label: '6 minutes', expected: 'pass' },
  { duration: 420, label: '7 minutes', expected: 'FAIL' },
  { duration: 480, label: '8 minutes', expected: 'FAIL' },
  { duration: 600, label: '10 minutes', expected: 'FAIL' },
];

console.log(`\n🎯 WebM Bottleneck Test`);
console.log(`Testing against: ${BASE_URL}`);
console.log(`Vercel limit: 4.5 MB\n`);

async function runTest(testConfig) {
  const { duration, label, expected } = testConfig;
  const testId = `webm-${duration}s`;
  const audioPath = path.join(RESULTS_DIR, `${testId}.webm`);
  
  console.log(`${'='.repeat(80)}`);
  console.log(`🧪 TEST: ${label} (${duration}s)`);
  console.log(`   Expected: ${expected === 'FAIL' ? '❌ 413 Error' : '✅ Success'}`);
  console.log(`${'='.repeat(80)}\n`);
  
  const result = {
    testId,
    duration,
    label,
    expected,
    timestamp: new Date().toISOString(),
  };
  
  try {
    // Step 1: Generate WebM file (simulates browser recording)
    console.log(`📝 Step 1: Generating ${duration}s WebM file...`);
    const fileMetadata = generateWebM(duration, audioPath);
    result.file = fileMetadata;
    
    // Step 2: Analyze against Vercel limit
    console.log(`\n🔍 Step 2: Analyzing file size...`);
    const analysis = analyzeFileSizeLimit(fileMetadata.fileSize);
    result.analysis = analysis;
    
    console.log(`   Size: ${fileMetadata.fileSizeMB} MB`);
    console.log(`   Limit usage: ${analysis.percentUsed}%`);
    console.log(`   Status: ${analysis.message}`);
    
    if (analysis.willFail) {
      console.log(`\n🚨 BOTTLENECK: File exceeds 4.5MB limit!`);
      console.log(`   This will result in 413 Payload Too Large error`);
      result.bottleneckIdentified = true;
      result.success = false;
      result.stage = 'file_size_check';
      result.error = `File too large (${fileMetadata.fileSizeMB} MB > 4.5 MB)`;
      
      const matchesExpectation = expected === 'FAIL';
      console.log(`\n${matchesExpectation ? '✅' : '⚠️'} TEST ${matchesExpectation ? 'PASSED' : 'UNEXPECTED'}: Confirmed bottleneck at ${label}\n`);
      return result;
    }
    
    // Step 3: Attempt transcription (if file is under limit)
    console.log(`\n🎙️  Step 3: Testing transcription API...`);
    const transcriptionResult = await transcribeAudio(audioPath, {
      baseUrl: BASE_URL,
    });
    
    result.transcription = transcriptionResult;
    
    if (!transcriptionResult.success) {
      console.log(`\n❌ Transcription failed: ${transcriptionResult.error}`);
      
      if (transcriptionResult.statusCode === 413) {
        console.log(`🚨 BOTTLENECK: 413 Payload Too Large`);
        console.log(`   Vercel rejected the ${fileMetadata.fileSizeMB} MB file`);
        result.bottleneckIdentified = true;
      }
      
      result.success = false;
      result.stage = 'transcription';
      result.error = transcriptionResult.error;
      
      const matchesExpectation = expected === 'FAIL';
      console.log(`\n${matchesExpectation ? '✅' : '⚠️'} TEST ${matchesExpectation ? 'PASSED' : 'FAILED'}: ${matchesExpectation ? 'Confirmed failure' : 'Unexpected failure'}\n`);
      return result;
    }
    
    // Success case
    console.log(`\n✅ Transcription successful`);
    console.log(`   Time: ${transcriptionResult.transcriptionTimeMs}ms`);
    console.log(`   Note: Generated WebM doesn't contain real speech`);
    
    result.success = true;
    result.stage = 'completed';
    
    const matchesExpectation = expected !== 'FAIL';
    console.log(`\n${matchesExpectation ? '✅' : '⚠️'} TEST ${matchesExpectation ? 'PASSED' : 'UNEXPECTED'}: File processed successfully\n`);
    
  } catch (error) {
    console.error(`\n❌ Unexpected error: ${error.message}\n`);
    result.success = false;
    result.error = error.message;
    result.stage = 'exception';
  }
  
  // Save result
  const resultPath = path.join(RESULTS_DIR, `${testId}-result.json`);
  fs.writeFileSync(resultPath, JSON.stringify(result, null, 2));
  
  return result;
}

async function main() {
  // Ensure results directory exists
  if (!fs.existsSync(RESULTS_DIR)) {
    fs.mkdirSync(RESULTS_DIR, { recursive: true });
  }
  
  const results = [];
  
  for (const testConfig of TEST_DURATIONS) {
    const result = await runTest(testConfig);
    results.push(result);
  }
  
  // Generate summary
  console.log(`\n${'='.repeat(80)}`);
  console.log(`📊 TEST SUMMARY`);
  console.log(`${'='.repeat(80)}\n`);
  
  console.log(`Bottleneck Analysis:\n`);
  
  results.forEach(r => {
    const icon = r.bottleneckIdentified ? '🚨' : r.success ? '✅' : '❌';
    const status = r.bottleneckIdentified ? 'BOTTLENECK' : r.success ? 'PASSED' : 'FAILED';
    console.log(`${icon} ${r.label.padEnd(12)} | ${r.file?.fileSizeMB || 'N/A'} MB | ${r.analysis?.percentUsed || 'N/A'}% | ${status}`);
  });
  
  const bottleneckTests = results.filter(r => r.bottleneckIdentified);
  
  if (bottleneckTests.length > 0) {
    const firstBottleneck = bottleneckTests[0];
    console.log(`\n💡 KEY FINDING:`);
    console.log(`   Bottleneck occurs at: ${firstBottleneck.label}`);
    console.log(`   File size: ${firstBottleneck.file.fileSizeMB} MB`);
    console.log(`   Vercel limit: 4.5 MB`);
    console.log(`   Overflow: ${(firstBottleneck.file.fileSizeMB - 4.5).toFixed(2)} MB over limit\n`);
    
    console.log(`🎯 SOLUTION:`);
    console.log(`   Current: Direct upload to /api/transcribe (4.5MB limit)`);
    console.log(`   Needed: Upload to Supabase Storage first, then transcribe from URL`);
    console.log(`   Benefit: No file size limit, enables Voice Journal Library\n`);
  }
  
  console.log(`${'='.repeat(80)}\n`);
  
  // Save summary
  const summary = {
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    vercelLimit: '4.5 MB',
    results,
    bottleneckFound: bottleneckTests.length > 0,
    bottleneckDuration: bottleneckTests[0]?.duration || null,
  };
  
  fs.writeFileSync(
    path.join(RESULTS_DIR, 'webm-bottleneck-summary.json'),
    JSON.stringify(summary, null, 2)
  );
  
  console.log(`💾 Results saved to: test-results/webm-bottleneck-summary.json\n`);
}

main().catch(error => {
  console.error(`\n❌ Fatal error:`, error);
  process.exit(1);
});



