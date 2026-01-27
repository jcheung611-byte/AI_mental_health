# 🎯 Audio Pipeline Test Suite

## Overview
Automated testing system for the voice transcription pipeline. Tests audio generation (TTS) → transcription (Whisper) accuracy across different durations, with focus on identifying long-duration bottlenecks.

## What It Tests

### Test Cases (8 total):
1. **baseline-10s** - Simple 10-second phrase
2. **numbers-10s** - Numbers and punctuation
3. **medium-30s** - 30-second varied content
4. **technical-30s** - Technical terminology  
5. **long-1min** - 1-minute mental health monologue
6. **narrative-2min** - 2-minute venting session (realistic use case)
7. **complex-3min** - 3-minute educational content
8. **stress-test-5min** - 5-minute venting (CRITICAL TEST)

### Metrics Calculated:
- **Word Error Rate (WER)** - Industry standard for transcription accuracy
- **Character Error Rate (CER)** - More granular accuracy
- **Accuracy Percentage** - Overall transcription quality (target: 80%+)
- **Performance** - Latency, throughput, real-time multiplier
- **File Size Analysis** - Vercel 4.5MB limit checking

## Prerequisites

Before running tests, make sure:

1. **Environment variables are set** in `frontend/.env.local`:
   ```bash
   OPENAI_API_KEY=sk-proj-your-actual-key-here
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your-key-here
   ```

2. **Frontend dev server is running**:
   ```bash
   cd frontend
   npm run dev
   ```
   (Server must be at http://localhost:3000)

3. **Test dependencies are installed**:
   ```bash
   cd tests
   npm install
   ```

## Running Tests

### Run All Tests (8 tests, ~5-10 minutes):
```bash
cd tests
node audio-pipeline-test.js
```

### Run Only Short Tests (< 1 minute):
```bash
node audio-pipeline-test.js --duration=short
```

### Run Only Long Tests (>= 1 minute):
```bash
node audio-pipeline-test.js --duration=long
```

### Test Against Vercel Deployment:
```bash
node audio-pipeline-test.js --base-url=https://your-app.vercel.app
```

## Test Output

### Console Output:
- Real-time progress for each test
- Accuracy metrics (WER, CER, grade)
- Performance metrics (latency, throughput)
- Final summary with pass/fail counts
- Bottleneck analysis

### Saved Files:
- `test-results/summary.json` - Aggregate results
- `test-results/{test-id}-result.json` - Individual test details
- `test-results/{test-id}-audio.mp3` - Generated audio files

## What To Look For

### 🎯 Success Indicators:
- ✅ Accuracy >= 80% (Grade C or better)
- ✅ All tests pass through transcription stage
- ✅ File sizes under 4.5MB limit
- ✅ Reasonable latency (<30s for short tests)

### 🚨 Red Flags:
- ❌ Tests fail at `audio_generation` stage → API key issue
- ❌ Tests fail at `transcription` stage → Bottleneck identified!
- ❌ 413 errors → File exceeds Vercel 4.5MB limit
- ❌ 504 errors → Request timeout (audio too long)
- ❌ Low accuracy (<80%) → TTS/Whisper mismatch or quality issue

## Expected Findings

Based on your progress tracker, this should reveal:

1. **Why live chunking failed** - WebM header issues with partial chunks
2. **5-minute limit root cause** - File size vs timeout vs Whisper limitation
3. **Optimal chunk duration** - Sweet spot for live transcription
4. **Format issues** - MP3 (TTS) vs WebM (frontend recording) compatibility

## Troubleshooting

### "OPENAI_API_KEY environment variable is missing"
**Solution**: Create `frontend/.env.local` with your OpenAI API key (see Prerequisites)

### "Server is NOT running"
**Solution**: Start the dev server in frontend directory:
```bash
cd frontend && npm run dev
```

### "Connection refused" errors
**Solution**: Wait 10-15 seconds after starting dev server, then retry tests

### All tests fail at audio_generation
**Solution**: Check that `.env.local` exists and has valid OPENAI_API_KEY

### Tests take very long
**Solution**: Run short tests only: `node audio-pipeline-test.js --duration=short`

## Architecture

```
Test Flow:
┌─────────────────┐
│  test-cases.json │ ← Test definitions
└────────┬─────────┘
         │
         ▼
┌─────────────────────────┐
│ audio-pipeline-test.js  │ ← Main orchestrator
└────────┬────────────────┘
         │
         ├──► audio-generator.js ──► POST /api/speak ──► audio.mp3
         │
         ├──► transcription-tester.js ──► POST /api/transcribe ──► text
         │
         └──► metrics-calculator.js ──► WER, CER, accuracy
                       │
                       ▼
              ┌─────────────────┐
              │ test-results/   │
              │ - summary.json  │
              │ - {id}.json     │
              │ - {id}.mp3      │
              └─────────────────┘
```

## Next Steps After Testing

1. **Review summary.json** - Identify failure patterns
2. **Analyze bottlenecks** - Which duration starts failing?
3. **Check file sizes** - Do 2+ minute recordings exceed 4.5MB?
4. **Document findings** - Update PROGRESS_TRACKER.md
5. **Implement fixes** - Based on root cause analysis

## Quick Reference

| Command | Description |
|---------|-------------|
| `npm test` | Run all tests |
| `npm run test:long` | Run long-duration tests only |
| `npm run test:short` | Run short tests only |

## Cost Estimate

Per full test run (8 tests):
- TTS: ~$0.10 (generating 10+ minutes of audio)
- Whisper: ~$0.10 (transcribing 10+ minutes)
- **Total: ~$0.20 per run**

Budget for 5-10 test runs during development: ~$1-2

---

**Built:** December 30, 2024  
**Purpose:** Identify long-duration transcription bottlenecks  
**Status:** Ready to use ✅



