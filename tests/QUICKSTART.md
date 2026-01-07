# 🚀 Quick Start: Running Audio Pipeline Tests

## You're 3 Steps Away From Identifying Your Transcription Bottleneck!

### Step 1: Configure API Key (1 minute)

Your frontend server needs the OpenAI API key. Create or update:

```bash
cd frontend
```

Create/edit `.env.local` file:
```bash
# OpenAI API Key (REQUIRED for tests)
OPENAI_API_KEY=sk-proj-your-actual-key-here

# Supabase (if not already set)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your-key-here
```

### Step 2: Start Frontend Server (30 seconds)

```bash
cd frontend
npm run dev
```

Wait for: `✓ Ready on http://localhost:3000`

### Step 3: Run Tests (5-10 minutes)

**In a NEW terminal:**

```bash
cd tests
node audio-pipeline-test.js
```

Or run quick tests first:
```bash
node audio-pipeline-test.js --duration=short
```

## What You'll See

```
🚀 Audio Pipeline Test Suite
Testing against: http://localhost:3000

📋 Running ALL tests (8 total)

================================================================================
🧪 TEST: baseline-10s
   Baseline test - simple phrase, 10 seconds
================================================================================

📝 Step 1: Generating audio via TTS...
  🎤 Generating audio: Hello world...
  ✅ Audio generated: 48.3 KB (est. 5s)

🔍 Step 2: Validating audio file...
  ✅ Audio file valid: 48.3 KB

🎙️  Step 3: Transcribing audio via Whisper...
  ✅ Transcribed: "Hello world. This is a simple test..."

📊 Step 4: Calculating accuracy metrics...
  🎯 EXACT MATCH!
  📊 Accuracy: 100.0% (Grade: A)
  📝 WER: 0.0% | CER: 0.0%
  ⏱️  Total time: 3.2s (0.64x real-time)

✅ TEST PASSED: 100.0% accuracy
```

## Expected Results

### ✅ Success Case:
- Short tests (10s-30s) should all pass with 80%+ accuracy
- You'll see exact failure point for long recordings
- Summary identifies bottleneck (file size vs timeout)

### 🚨 Common Issues:

**"OPENAI_API_KEY environment variable is missing"**
→ Go back to Step 1, create `.env.local` in `frontend/` directory

**"Connection refused"**  
→ Make sure dev server is running (`npm run dev` in frontend/)

**413 errors on long tests**
→ **BOTTLENECK FOUND!** File exceeds Vercel's 4.5MB limit

**504 timeout errors**
→ **BOTTLENECK FOUND!** Audio too long to process in time

## After Tests Complete

Check the results:

```bash
# View summary
cat tests/test-results/summary.json

# View individual test
cat tests/test-results/stress-test-5min-result.json
```

Look for:
- Which duration starts failing? (1min? 2min? 5min?)
- What's the error? (413 = file size, 504 = timeout)
- File sizes of generated audio
- Accuracy degradation patterns

## Cost

Each full test run costs ~$0.20:
- 8 tests
- ~10 minutes total audio
- TTS + Whisper

Budget $1-2 for 5-10 runs during development.

## Next Actions Based on Results

### If tests fail at 2+ minutes (file size issue):
→ Implement Supabase Storage upload strategy
→ Upload full audio first, then transcribe from URL

### If tests fail at transcription (accuracy issue):
→ Check audio quality settings
→ Test different TTS voices/models

### If tests all pass:
→ Great! Your pipeline handles up to 5 minutes
→ Document max duration in user-facing limits

---

**Ready?** Go to Step 1 and let's find that bottleneck! 🔍

