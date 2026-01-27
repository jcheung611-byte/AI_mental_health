# 🧪 Manual Testing Guide - Hybrid Upload Implementation

**Date:** January 6, 2026  
**Deployment:** https://ai-mental-health-seven.vercel.app  
**Commit:** 44e7053

---

## ✅ What's Already Done

- [x] **Step 1:** You're setting up Supabase Storage bucket
- [x] **Step 2:** Code committed & pushed to GitHub (commit 44e7053)
- [x] **Step 3:** Automated tests run - file size logic verified ✅

---

## 🧪 Your Testing Checklist

### Test 1: Short Recording (3 minutes) - Parallel Strategy

**Expected Behavior:**
- Uses parallel upload + transcription
- Same speed as before
- Audio saved to Supabase

**Steps:**
1. Open: https://ai-mental-health-seven.vercel.app
2. Click microphone button
3. Speak for ~3 minutes (or stay silent)
4. Release button
5. **Observe:**
   - Status should say "Uploading & transcribing..."
   - Should complete in ~10-15 seconds (same as before!)
   - Transcription appears
   - AI responds

**Verification:**
- [ ] Transcription works ✅
- [ ] Speed feels same as before ✅
- [ ] Check browser console for logs:
  - Should see: `📤 File ≤4.5MB - using PARALLEL upload + transcribe`
  - Should see: `✅ Supabase upload complete: https://...`
  - Should see: `✅ Direct transcription complete`
- [ ] Check Supabase Dashboard:
  - Storage → audio-recordings bucket
  - Should see new file: `00000.../{timestamp}.webm`
  - File size: ~2-3 MB
- [ ] Check Database:
  - Table Editor → messages table
  - Latest user message should have `audio_url` populated
  - Click URL → should play audio!

---

### Test 2: Long Recording (7 minutes) - URL Strategy

**Expected Behavior:**
- Uses URL-based transcription
- Slightly slower (+2-3s)
- Audio saved to Supabase
- **Bypasses 4.5MB Vercel limit!**

**Steps:**
1. Click microphone button
2. Speak for ~7 minutes (or stay silent - that's fine!)
3. Release button
4. **Observe:**
   - Status should say "Uploading large recording..."
   - Then "Transcribing from storage..."
   - Should complete in ~15-20 seconds
   - Transcription appears
   - AI responds

**Verification:**
- [ ] Transcription works ✅
- [ ] Slightly slower but completes successfully ✅
- [ ] Check browser console for logs:
  - Should see: `📤 File >4.5MB - using Supabase URL method`
  - Should see: `✅ Supabase upload complete: https://...`
  - Should see: `✅ URL transcription complete`
- [ ] Check Supabase Dashboard:
  - Storage → audio-recordings bucket
  - Should see new file: ~4.9 MB
- [ ] Check Database:
  - User message should have `audio_url`
  - **This would have failed before - now it works!** 🎉

---

### Test 3: Edge Cases

**Test 3a: Very Short Recording (<1 second)**
- Should see validation error: "Audio recording too short"
- Should NOT upload to Supabase
- Status returns to "Ready"

**Test 3b: Supabase Upload Failure**
- If Supabase bucket not set up yet:
- Should see console warning: `⚠️ Supabase upload failed (non-critical)`
- Transcription should STILL work (graceful degradation!)
- Just won't have audio_url in database

**Test 3c: Network Interruption**
- Turn off WiFi during recording
- Should see appropriate error message
- Should handle gracefully

---

## 🔍 What to Look For

### ✅ Success Indicators:

1. **Transcription Speed:**
   - 3-min recording: ~10-15s (same as before)
   - 7-min recording: ~15-20s (+2-3s, acceptable)

2. **Console Logs:**
   ```
   [timestamp] 📥 AUDIO RECORDED - handleAudioRecorded called
   [timestamp] ✅ Audio validated (X.XX MB), processing...
   [timestamp] 📤 File ≤4.5MB - using PARALLEL upload + transcribe
   [timestamp] ✅ Supabase upload complete: https://...
   [timestamp] ✅ Direct transcription complete
   [timestamp] ✅ Message saved to database with audio URL
   ```

3. **Supabase Storage:**
   - Files appear with correct timestamps
   - File sizes match expectations (2-5 MB typical)
   - Can click and play audio

4. **Database Records:**
   - `audio_url` populated for user messages
   - URLs are accessible (public)
   - Format: `https://xxxxx.supabase.co/storage/v1/object/public/audio-recordings/...`

### 🚨 Red Flags:

1. **"Failed to upload audio to storage"**
   - Means: Supabase bucket not set up correctly
   - Fix: Check bucket exists and policies are correct
   - Note: Transcription should still work (graceful degradation)

2. **413 Payload Too Large (for <4.5MB files)**
   - Shouldn't happen anymore!
   - Means: Something wrong with file size detection

3. **Slow transcription (>30s for 3-min recording)**
   - Might be network issue
   - Check Vercel function logs

4. **No audio_url in database**
   - Check Supabase Storage setup
   - Check browser console for errors

---

## 📊 Expected File Sizes

| Duration | WebM Size | Strategy | Speed |
|----------|-----------|----------|-------|
| 1 min | 0.7 MB | Parallel | 7-10s |
| 2 min | 1.4 MB | Parallel | 8-12s |
| 3 min | 2.1 MB | Parallel | 10-15s |
| 5 min | 3.5 MB | Parallel | 12-18s |
| 6 min | 4.2 MB | Parallel | 14-20s |
| **7 min** | **4.9 MB** | **URL** | **15-25s** |
| 10 min | 7.0 MB | URL | 20-30s |

---

## 🐛 Common Issues & Fixes

### Issue: "audio-recordings bucket does not exist"
**Fix:** Run the Supabase Storage setup SQL:
```sql
-- In Supabase SQL Editor:
INSERT INTO storage.buckets (id, name, public)
VALUES ('audio-recordings', 'audio-recordings', true)
ON CONFLICT DO NOTHING;
```

### Issue: "Permission denied" in Supabase
**Fix:** Add storage policies (already in supabase-schema.sql):
```sql
CREATE POLICY "Allow public uploads to audio-recordings"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'audio-recordings');

CREATE POLICY "Allow public reads from audio-recordings"
ON storage.objects FOR SELECT
USING (bucket_id = 'audio-recordings');
```

### Issue: Transcription still fails for 7-min recordings
**Possible causes:**
1. Supabase upload failed (check console)
2. `/api/transcribe-url` not working (check Vercel logs)
3. OpenAI API issue (check status)

---

## 📝 Test Results Template

Copy this and fill it out:

```
✅ HYBRID UPLOAD TESTING - [Date]

Test 1: 3-minute recording (Parallel Strategy)
- [ ] Transcription works: ___
- [ ] Speed acceptable: ___
- [ ] Audio in Supabase: ___
- [ ] audio_url in database: ___
- [ ] Can replay audio: ___

Test 2: 7-minute recording (URL Strategy)  
- [ ] Transcription works: ___
- [ ] Bypasses 4.5MB limit: ___
- [ ] Audio in Supabase: ___
- [ ] audio_url in database: ___
- [ ] Can replay audio: ___

Edge Cases:
- [ ] Short recording validation: ___
- [ ] Graceful degradation (if Supabase fails): ___

Overall Result: ✅ / ⚠️ / ❌
Notes:



Next Steps:


```

---

## 🎉 Success Criteria

You'll know it's working when:
- ✅ 3-min recordings work with same speed as before
- ✅ 7-min recordings work (would have failed before!)
- ✅ Audio appears in Supabase Storage
- ✅ Can replay past recordings from database
- ✅ Console shows correct strategy for each file size
- ✅ No errors in Vercel logs

**If all tests pass → Ready to build Voice Journal Library UI!** 🚀

---

**Questions or issues? Check:**
1. Browser console logs (F12)
2. Vercel function logs (dashboard)
3. Supabase Storage dashboard
4. Database records in Table Editor

Good luck testing! 🧪✨



