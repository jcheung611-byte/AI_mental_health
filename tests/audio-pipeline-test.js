#!/usr/bin/env node

/**
 * Audio Pipeline Test Suite
 * Automated testing for voice transcription pipeline
 * 
 * Usage:
 *   node audio-pipeline-test.js                    # Run all tests
 *   node audio-pipeline-test.js --duration=short   # Run only short tests (< 1 min)
 *   node audio-pipeline-test.js --duration=long    # Run only long tests (>= 1 min)
 *   node audio-pipeline-test.js --base-url=https://your-deployment.vercel.app
 */

const fs = require('fs');
const path = require('path');
const { generateAudio, validateAudioFile } = require('./utils/audio-generator');
const { transcribeAudio } = require('./utils/transcription-tester');
const { calculateMetrics, calculatePerformanceMetrics, formatMetrics } = require('./utils/metrics-calculator');

// Parse command line arguments
const args = process.argv.slice(2);
const durationFilter = args.find(arg => arg.startsWith('--duration='))?.split('=')[1];
const baseUrlArg = args.find(arg => arg.startsWith('--base-url='))?.split('=')[1];

// Configuration
const CONFIG = {
  baseUrl: baseUrlArg || 'http://localhost:3000',
  testCasesPath: path.join(__dirname, 'test-cases.json'),
  resultsDir: path.join(__dirname, 'test-results'),
  summaryPath: path.join(__dirname, 'test-results', 'summary.json'),
};

/**
 * Load test cases from JSON
 */
function loadTestCases() {
  const rawData = fs.readFileSync(CONFIG.testCasesPath, 'utf8');
  const data = JSON.parse(rawData);
  
  let testCases = data.testCases;

  // Apply duration filter if specified
  if (durationFilter === 'short') {
    testCases = testCases.filter(tc => tc.estimatedDuration < 60);
    console.log(`📋 Running SHORT tests only (< 1 minute)\n`);
  } else if (durationFilter === 'long') {
    testCases = testCases.filter(tc => tc.estimatedDuration >= 60);
    console.log(`📋 Running LONG tests only (>= 1 minute)\n`);
  } else {
    console.log(`📋 Running ALL tests (${testCases.length} total)\n`);
  }

  return {
    testCases,
    config: data.configuration,
  };
}

/**
 * Run a single test case
 */
async function runTestCase(testCase, config) {
  const testId = testCase.id;
  const audioPath = path.join(CONFIG.resultsDir, `${testId}-audio.mp3`);
  const resultPath = path.join(CONFIG.resultsDir, `${testId}-result.json`);

  console.log(`\n${'='.repeat(80)}`);
  console.log(`🧪 TEST: ${testId}`);
  console.log(`   ${testCase.description}`);
  console.log(`   Duration: ${testCase.duration} | Words: ${testCase.text.split(/\s+/).length}`);
  console.log(`${'='.repeat(80)}\n`);

  const result = {
    testId,
    testCase: {
      id: testCase.id,
      duration: testCase.duration,
      estimatedDuration: testCase.estimatedDuration,
      description: testCase.description,
      originalText: testCase.text,
    },
    timestamp: new Date().toISOString(),
    success: false,
  };

  try {
    // Step 1: Generate audio
    console.log(`📝 Step 1: Generating audio via TTS...`);
    const audioMetadata = await generateAudio(testCase.text, {
      baseUrl: CONFIG.baseUrl,
      voice: config.voice,
      model: config.model,
      outputPath: audioPath,
    });

    result.audioGeneration = audioMetadata;

    if (!audioMetadata.success) {
      result.error = `Audio generation failed: ${audioMetadata.error}`;
      result.stage = 'audio_generation';
      console.log(`\n❌ TEST FAILED: ${result.error}\n`);
      return result;
    }

    // Step 2: Validate audio file
    console.log(`\n🔍 Step 2: Validating audio file...`);
    const validation = validateAudioFile(audioPath);
    result.audioValidation = validation;

    if (!validation.valid) {
      result.error = `Audio validation failed: ${validation.error}`;
      result.stage = 'audio_validation';
      console.log(`\n❌ TEST FAILED: ${result.error}\n`);
      return result;
    }

    console.log(`  ✅ Audio file valid: ${validation.fileSizeKB} KB`);

    // Step 3: Transcribe audio
    console.log(`\n🎙️  Step 3: Transcribing audio via Whisper...`);
    const transcriptionResult = await transcribeAudio(audioPath, {
      baseUrl: CONFIG.baseUrl,
    });

    result.transcription = transcriptionResult;

    if (!transcriptionResult.success) {
      result.error = `Transcription failed: ${transcriptionResult.error}`;
      result.stage = 'transcription';
      console.log(`\n❌ TEST FAILED: ${result.error}\n`);
      
      // Log detailed error info
      if (transcriptionResult.statusCode === 413) {
        console.log(`💡 DIAGNOSIS: File exceeds Vercel's 4.5MB limit`);
        console.log(`   This is your bottleneck for long recordings!`);
      } else if (transcriptionResult.statusCode === 504) {
        console.log(`💡 DIAGNOSIS: Request timeout - audio too long to process`);
      }
      
      return result;
    }

    // Step 4: Calculate accuracy metrics
    console.log(`\n📊 Step 4: Calculating accuracy metrics...`);
    const metrics = calculateMetrics(testCase.text, transcriptionResult.text);
    result.metrics = metrics;

    // Step 5: Calculate performance metrics
    const performance = calculatePerformanceMetrics(audioMetadata, transcriptionResult);
    result.performance = performance;

    // Display results
    console.log(formatMetrics(metrics));
    console.log(`  ⏱️  Total time: ${performance.totalTimeSec}s (${performance.throughput})`);

    // Display transcription comparison if not exact match
    if (!metrics.exactMatch && metrics.accuracyPercentage < 100) {
      console.log(`\n  📝 Transcription differences:`);
      console.log(`     Original:  "${testCase.text.substring(0, 100)}..."`);
      console.log(`     Received:  "${transcriptionResult.text.substring(0, 100)}..."`);
    }

    result.success = true;
    result.stage = 'completed';

    // Determine if this is a pass or fail based on accuracy
    const passed = metrics.accuracyPercentage >= 80; // 80% threshold
    console.log(`\n${passed ? '✅' : '⚠️'} TEST ${passed ? 'PASSED' : 'FAILED'}: ${metrics.accuracyPercentage}% accuracy\n`);

  } catch (error) {
    result.error = `Unexpected error: ${error.message}`;
    result.errorStack = error.stack;
    result.stage = 'exception';
    console.log(`\n❌ TEST FAILED: ${error.message}\n`);
    console.error(error);
  }

  // Save individual test result
  fs.writeFileSync(resultPath, JSON.stringify(result, null, 2));
  console.log(`💾 Results saved to: ${path.basename(resultPath)}`);

  return result;
}

/**
 * Generate summary report
 */
function generateSummary(results) {
  const total = results.length;
  const passed = results.filter(r => r.success && r.metrics?.accuracyPercentage >= 80).length;
  const failed = total - passed;

  const successfulTests = results.filter(r => r.success);
  const avgAccuracy = successfulTests.length > 0
    ? (successfulTests.reduce((sum, r) => sum + (r.metrics?.accuracyPercentage || 0), 0) / successfulTests.length).toFixed(2)
    : 0;

  const avgWER = successfulTests.length > 0
    ? (successfulTests.reduce((sum, r) => sum + (r.metrics?.werPercentage || 0), 0) / successfulTests.length).toFixed(2)
    : 0;

  const totalTime = results.reduce((sum, r) => sum + (r.performance?.totalTimeMs || 0), 0);

  // Identify bottlenecks
  const bottlenecks = results.filter(r => !r.success);
  const longDurationFailures = bottlenecks.filter(r => r.testCase.estimatedDuration >= 120);

  const summary = {
    timestamp: new Date().toISOString(),
    configuration: {
      baseUrl: CONFIG.baseUrl,
      durationFilter: durationFilter || 'all',
    },
    totals: {
      total,
      passed,
      failed,
      passRate: ((passed / total) * 100).toFixed(2) + '%',
    },
    metrics: {
      avgAccuracy: parseFloat(avgAccuracy),
      avgWER: parseFloat(avgWER),
      totalTimeMs: totalTime,
      totalTimeSec: (totalTime / 1000).toFixed(2),
    },
    bottlenecks: {
      count: bottlenecks.length,
      longDurationFailures: longDurationFailures.length,
      details: bottlenecks.map(b => ({
        testId: b.testId,
        duration: b.testCase.duration,
        stage: b.stage,
        error: b.error,
      })),
    },
    results,
  };

  return summary;
}

/**
 * Print summary to console
 */
function printSummary(summary) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`📊 TEST SUMMARY`);
  console.log(`${'='.repeat(80)}\n`);

  console.log(`Tests Run: ${summary.totals.total}`);
  console.log(`✅ Passed: ${summary.totals.passed}`);
  console.log(`❌ Failed: ${summary.totals.failed}`);
  console.log(`📈 Pass Rate: ${summary.totals.passRate}\n`);

  console.log(`Average Accuracy: ${summary.metrics.avgAccuracy}%`);
  console.log(`Average WER: ${summary.metrics.avgWER}%`);
  console.log(`Total Time: ${summary.metrics.totalTimeSec}s\n`);

  if (summary.bottlenecks.count > 0) {
    console.log(`🚨 BOTTLENECKS IDENTIFIED: ${summary.bottlenecks.count} failure(s)\n`);
    
    summary.bottlenecks.details.forEach(b => {
      console.log(`  ⚠️  ${b.testId} (${b.duration})`);
      console.log(`     Stage: ${b.stage}`);
      console.log(`     Error: ${b.error}\n`);
    });

    if (summary.bottlenecks.longDurationFailures > 0) {
      console.log(`💡 KEY FINDING: ${summary.bottlenecks.longDurationFailures} long-duration test(s) failed`);
      console.log(`   This suggests the bottleneck is with audio length, not quality.`);
      console.log(`   Likely cause: Vercel 4.5MB limit or Whisper timeout.\n`);
    }
  } else {
    console.log(`🎉 All tests passed! No bottlenecks detected.\n`);
  }

  console.log(`${'='.repeat(80)}\n`);
}

/**
 * Main test runner
 */
async function main() {
  console.log(`\n🚀 Audio Pipeline Test Suite`);
  console.log(`Testing against: ${CONFIG.baseUrl}\n`);

  // Ensure results directory exists
  if (!fs.existsSync(CONFIG.resultsDir)) {
    fs.mkdirSync(CONFIG.resultsDir, { recursive: true });
  }

  // Load test cases
  const { testCases, config } = loadTestCases();

  if (testCases.length === 0) {
    console.log(`No test cases match the filter criteria.`);
    return;
  }

  // Run all tests
  const results = [];
  for (const testCase of testCases) {
    const result = await runTestCase(testCase, config);
    results.push(result);
  }

  // Generate and save summary
  const summary = generateSummary(results);
  fs.writeFileSync(CONFIG.summaryPath, JSON.stringify(summary, null, 2));

  // Print summary
  printSummary(summary);

  console.log(`💾 Full summary saved to: test-results/summary.json`);
  console.log(`\n✨ Testing complete!\n`);

  // Exit with appropriate code
  process.exit(summary.totals.failed > 0 ? 1 : 0);
}

// Run the tests
main().catch(error => {
  console.error(`\n❌ Fatal error:`, error);
  process.exit(1);
});



