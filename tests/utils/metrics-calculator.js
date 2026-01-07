/**
 * Metrics Calculator - Calculate accuracy metrics for transcription testing
 * Implements Word Error Rate (WER) and Character Error Rate (CER)
 */

/**
 * Calculate Levenshtein distance (edit distance) between two strings
 * Used for both WER and CER calculations
 * @param {Array} ref - Reference array (words or characters)
 * @param {Array} hyp - Hypothesis array (words or characters)
 * @returns {number} Edit distance
 */
function levenshteinDistance(ref, hyp) {
  const refLen = ref.length;
  const hypLen = hyp.length;

  // Create a matrix to store distances
  const matrix = Array(refLen + 1).fill(null).map(() => Array(hypLen + 1).fill(0));

  // Initialize first row and column
  for (let i = 0; i <= refLen; i++) {
    matrix[i][0] = i;
  }
  for (let j = 0; j <= hypLen; j++) {
    matrix[0][j] = j;
  }

  // Fill in the matrix
  for (let i = 1; i <= refLen; i++) {
    for (let j = 1; j <= hypLen; j++) {
      if (ref[i - 1] === hyp[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,    // deletion
          matrix[i][j - 1] + 1,    // insertion
          matrix[i - 1][j - 1] + 1 // substitution
        );
      }
    }
  }

  return matrix[refLen][hypLen];
}

/**
 * Calculate Word Error Rate (WER)
 * WER = (Substitutions + Deletions + Insertions) / Total Words in Reference
 * Lower is better. 0 = perfect, 1 = completely wrong
 * @param {string} reference - Original/expected text
 * @param {string} hypothesis - Transcribed text
 * @returns {object} WER metrics
 */
function calculateWER(reference, hypothesis) {
  // Normalize text: lowercase and split by whitespace
  const refWords = reference.toLowerCase().trim().split(/\s+/).filter(w => w.length > 0);
  const hypWords = hypothesis.toLowerCase().trim().split(/\s+/).filter(w => w.length > 0);

  const refWordCount = refWords.length;
  const hypWordCount = hypWords.length;

  if (refWordCount === 0) {
    return {
      wer: hypWordCount > 0 ? 1.0 : 0.0,
      editDistance: hypWordCount,
      referenceWordCount: 0,
      hypothesisWordCount: hypWordCount,
      accuracy: hypWordCount > 0 ? 0.0 : 1.0,
    };
  }

  const editDistance = levenshteinDistance(refWords, hypWords);
  const wer = editDistance / refWordCount;
  const accuracy = Math.max(0, 1 - wer); // Accuracy percentage (capped at 0)

  return {
    wer: parseFloat(wer.toFixed(4)),
    werPercentage: parseFloat((wer * 100).toFixed(2)),
    editDistance,
    referenceWordCount: refWordCount,
    hypothesisWordCount: hypWordCount,
    accuracy: parseFloat(accuracy.toFixed(4)),
    accuracyPercentage: parseFloat((accuracy * 100).toFixed(2)),
  };
}

/**
 * Calculate Character Error Rate (CER)
 * CER = (Substitutions + Deletions + Insertions) / Total Characters in Reference
 * More granular than WER, better for shorter texts
 * @param {string} reference - Original/expected text
 * @param {string} hypothesis - Transcribed text
 * @returns {object} CER metrics
 */
function calculateCER(reference, hypothesis) {
  // Normalize text: lowercase and remove extra whitespace
  const refChars = reference.toLowerCase().trim().replace(/\s+/g, ' ').split('');
  const hypChars = hypothesis.toLowerCase().trim().replace(/\s+/g, ' ').split('');

  const refCharCount = refChars.length;
  const hypCharCount = hypChars.length;

  if (refCharCount === 0) {
    return {
      cer: hypCharCount > 0 ? 1.0 : 0.0,
      editDistance: hypCharCount,
      referenceCharCount: 0,
      hypothesisCharCount: hypCharCount,
      accuracy: hypCharCount > 0 ? 0.0 : 1.0,
    };
  }

  const editDistance = levenshteinDistance(refChars, hypChars);
  const cer = editDistance / refCharCount;
  const accuracy = Math.max(0, 1 - cer);

  return {
    cer: parseFloat(cer.toFixed(4)),
    cerPercentage: parseFloat((cer * 100).toFixed(2)),
    editDistance,
    referenceCharCount: refCharCount,
    hypothesisCharCount: hypCharCount,
    accuracy: parseFloat(accuracy.toFixed(4)),
    accuracyPercentage: parseFloat((accuracy * 100).toFixed(2)),
  };
}

/**
 * Check if transcription is an exact match
 * @param {string} reference - Original text
 * @param {string} hypothesis - Transcribed text
 * @returns {boolean} True if exact match (case-insensitive)
 */
function isExactMatch(reference, hypothesis) {
  return reference.toLowerCase().trim() === hypothesis.toLowerCase().trim();
}

/**
 * Calculate comprehensive accuracy metrics
 * @param {string} reference - Original/expected text
 * @param {string} hypothesis - Transcribed text
 * @returns {object} All metrics combined
 */
function calculateMetrics(reference, hypothesis) {
  const wer = calculateWER(reference, hypothesis);
  const cer = calculateCER(reference, hypothesis);
  const exactMatch = isExactMatch(reference, hypothesis);

  // Determine overall grade
  let grade = 'F';
  if (wer.accuracyPercentage >= 95) grade = 'A';
  else if (wer.accuracyPercentage >= 90) grade = 'B';
  else if (wer.accuracyPercentage >= 80) grade = 'C';
  else if (wer.accuracyPercentage >= 70) grade = 'D';

  return {
    exactMatch,
    wer: wer.wer,
    werPercentage: wer.werPercentage,
    cer: cer.cer,
    cerPercentage: cer.cerPercentage,
    accuracy: wer.accuracy,
    accuracyPercentage: wer.accuracyPercentage,
    grade,
    details: {
      wordMetrics: wer,
      characterMetrics: cer,
    },
  };
}

/**
 * Calculate timing and performance metrics
 * @param {object} audioMetadata - Metadata from audio generation
 * @param {object} transcriptionMetadata - Metadata from transcription
 * @returns {object} Performance metrics
 */
function calculatePerformanceMetrics(audioMetadata, transcriptionMetadata) {
  const totalTimeMs = audioMetadata.generationTimeMs + transcriptionMetadata.transcriptionTimeMs;
  const totalTimeSec = (totalTimeMs / 1000).toFixed(2);

  // Calculate throughput (how fast compared to audio duration)
  const estimatedAudioDuration = audioMetadata.estimatedDurationSeconds || 0;
  const realTimeMultiplier = estimatedAudioDuration > 0 
    ? (totalTimeMs / 1000 / estimatedAudioDuration).toFixed(2)
    : 'N/A';

  return {
    audioGenerationMs: audioMetadata.generationTimeMs,
    transcriptionMs: transcriptionMetadata.transcriptionTimeMs,
    totalTimeMs,
    totalTimeSec: parseFloat(totalTimeSec),
    estimatedAudioDurationSec: estimatedAudioDuration,
    realTimeMultiplier: realTimeMultiplier !== 'N/A' ? parseFloat(realTimeMultiplier) : null,
    throughput: realTimeMultiplier !== 'N/A' 
      ? `${realTimeMultiplier}x real-time`
      : 'N/A',
  };
}

/**
 * Format metrics for console display
 * @param {object} metrics - Metrics object
 * @returns {string} Formatted string
 */
function formatMetrics(metrics) {
  let output = '';
  
  if (metrics.exactMatch) {
    output += '  🎯 EXACT MATCH!\n';
  }
  
  output += `  📊 Accuracy: ${metrics.accuracyPercentage}% (Grade: ${metrics.grade})\n`;
  output += `  📝 WER: ${metrics.werPercentage}% | CER: ${metrics.cerPercentage}%\n`;
  
  return output;
}

module.exports = {
  calculateWER,
  calculateCER,
  calculateMetrics,
  calculatePerformanceMetrics,
  isExactMatch,
  formatMetrics,
};

