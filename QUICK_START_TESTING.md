# ⚡ Quick Start - Testing Checklist

**Last Updated:** January 6, 2026  
**Status:** ✅ Code deployed, ready for testing

---

## 🎯 Your Tasks

### ✅ Step 1: Supabase Setup (Do This First!)

1. Go to: https://supabase.com/dashboard
2. Select your project
3. Go to: SQL Editor
4. Copy/paste this entire block:

```sql
-- Create storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('audio-recordings', 'audio-recordings', true)
ON CONFLICT DO NOTHING;

-- Allow uploads
CREATE POLICY "Allow public uploads to audio-recordings"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'audio-recordings');

-- Allow reads
CREATE POLICY "Allow public reads from audio-recordings"
ON storage.objects FOR SELECT
USING (bucket_id = 'audio-recordings');

-- Add audio_url column
ALTER TABLE messages ADD COLUMN IF NOT EXISTS audio_url TEXT;

-- Add index
CREATE INDEX IF NOT EXISTS idx_messages_audio_url 
ON messages(audio_url) 
WHERE audio_url IS NOT NULL;
```

5. Click "Run"
6. Verify: Storage → Buckets → Should see `audio-recordings`

---

### ✅ Step 2: Test Short Recording (3 minutes)

1. Go to: https://ai-mental-health-seven.vercel.app
2. Open browser console (F12)
3. Click mic button
4. Record for ~3 minutes
5. Release button
6. **Look for:** Console should say "PARALLEL upload + transcribe"
7. **Verify:** Transcription appears in ~10-15s (same speed as before!)

---

### ✅ Step 3: Test Long Recording (7 minutes)

1. Click mic button again
2. Record for ~7 minutes (this would have failed before!)
3. Release button
4. **Look for:** Console should say "Supabase URL method"
5. **Verify:** Transcription appears in ~15-25s (slightly slower, but works!)

---

### ✅ Step 4: Verify Storage

1. Go to: Supabase Dashboard → Storage → audio-recordings
2. **Should see:** 2 files (3-min and 7-min recordings)
3. Click one → Should play audio!

---

### ✅ Step 5: Verify Database

1. Go to: Supabase Dashboard → Table Editor → messages
2. Find your 2 user messages
3. **Should see:** `audio_url` column populated with URLs
4. Click URL → Should open audio file!

---

## ✅ Success Checklist

- [ ] Supabase bucket created ✓
- [ ] 3-min recording works ✓
- [ ] 7-min recording works ✓ (NEW!)
- [ ] Audio files in storage ✓
- [ ] audio_url in database ✓
- [ ] Can replay audio ✓

**If all checked → SUCCESS! Ready for Voice Journal UI! 🎉**

---

## 🐛 Quick Fixes

**Problem:** "bucket does not exist"  
**Fix:** Run the SQL commands in Step 1

**Problem:** "Permission denied"  
**Fix:** Check Storage → Policies tab, ensure 2 policies exist

**Problem:** Transcription fails  
**Fix:** Check browser console for error details

---

## 📚 Need More Details?

- **Full testing guide:** `MANUAL_TESTING_GUIDE.md`
- **What was built:** `IMPLEMENTATION_SUMMARY.md`
- **Overall status:** `TESTING_STATUS_SUMMARY.md`
- **Database help:** Run `node tests/verify-database-structure.js`

---

**Questions? Issues? Let me know!** 🚀



