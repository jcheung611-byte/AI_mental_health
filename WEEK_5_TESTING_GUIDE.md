# Week 5 Testing Guide - Unified Voice Input 🧪

## Quick Start
- **Local:** http://localhost:3000
- **Vercel:** https://ai-mental-health-2838qd9g4-jordans-projects-70f3e8b9.vercel.app/

---

## 🖥️ Desktop Testing (Chrome/Edge Recommended)

### Test 1: Long-Press Gesture (Main Feature!)
**What to test:** Hold-to-record gesture

**Steps:**
1. Go to http://localhost:3000
2. Look at the bottom input area
3. **Important:** DON'T click the mic button!
4. Instead, **press and HOLD** the mic button
5. Keep holding for at least 1 second

**Expected behavior:**
- ⏱️ After 500ms: Recording starts
- 🔴 Mic button turns red and pulses
- 📊 **3 animated waveform bars appear** to the right of button
- ⏰ Timer shows: "0:01", "0:02", etc.
- 💬 Text says: "(Release to send)"

**Try saying:** "This is a test of the new voice input"

**Expected when you release:**
- 🔵 Mic button turns blue (transcribing)
- 🔄 Spinner animation appears
- ⏳ Wait 2-5 seconds
- ✅ Transcribed text appears in input field
- ✏️ You can edit the text!
- ⬆️ Press Enter or click send button

**✅ Pass if:**
- Recording starts after holding
- Waveform bars animate
- Transcription appears in text field
- You can edit before sending

**❌ Fail if:**
- Recording starts on quick click (should NOT)
- No waveform appears
- Mic access denied (check browser permissions)

---

### Test 2: Quick Click Should NOT Record
**What to test:** Prevent accidental recordings

**Steps:**
1. **Quick click** the mic button (don't hold)
2. Release immediately

**Expected behavior:**
- ❌ Recording should NOT start
- ❌ No waveform should appear
- ✅ Nothing happens (this is correct!)

**Why:** We require 500ms hold to avoid accidental recordings

**✅ Pass if:**
- Quick clicks do nothing
- Only long-press starts recording

---

### Test 3: Audio Level Detection
**What to test:** Waveform responds to voice

**Steps:**
1. Hold mic button to start recording
2. **Speak loudly:** "HELLO TESTING"
3. Watch the 3 waveform bars

**Expected behavior:**
- 📊 Bars should **bounce higher** when you speak loudly
- 📊 Bars should be **smaller** during silence
- 📊 Each bar animates at slightly different times

**✅ Pass if:**
- Bars react to your voice
- Louder voice = taller bars
- Visual feedback is smooth

---

### Test 4: Edit Transcription
**What to test:** Fix transcription errors

**Steps:**
1. Record: "My name is Jordan"
2. Wait for transcription
3. **Intentionally change it:** Type "My name is Bob"
4. Press Enter to send

**Expected behavior:**
- ✏️ Can click in text field to edit
- ⌨️ Can type to change text
- ✅ Sends the EDITED version (not original)

**✅ Pass if:**
- Text field is editable
- Edited text is what gets sent

---

### Test 5: Recording During Processing
**What to test:** Can't record while processing

**Steps:**
1. Type a message and send it
2. While "Processing..." shows, try to hold mic button

**Expected behavior:**
- 🚫 Mic button should be disabled (grayed out)
- 🚫 Can't start recording

**✅ Pass if:**
- Button is disabled during processing
- No recording possible while busy

---

### Test 6: Multiple Recordings
**What to test:** Recording multiple times in a row

**Steps:**
1. Hold mic → Say "First message" → Release
2. Wait for transcription → Delete the text
3. Hold mic again → Say "Second message" → Release
4. Wait for transcription

**Expected behavior:**
- ✅ Both recordings work independently
- ✅ No leftover state from first recording
- ✅ Clean slate each time

**✅ Pass if:**
- Can record multiple times without refresh
- Each transcription is separate

---

### Test 7: Cancel Recording (Mouse Leave)
**What to test:** What happens if you move mouse away while holding

**Steps:**
1. Hold mic button
2. While holding, **move mouse off the button**
3. Release mouse button

**Expected behavior:**
- ⏹️ Recording should stop
- ✅ Transcription should still complete

**✅ Pass if:**
- Recording stops when mouse leaves
- Transcription still happens

---

## 📱 Mobile Testing (iOS Safari / Android Chrome)

### Test 8: Tap to Open Voice Sheet
**What to test:** Full-screen voice experience

**Steps:**
1. Open http://localhost:3000 on phone
2. **Tap** the mic button (don't hold!)

**Expected behavior:**
- 🎬 Full-screen black sheet slides up
- 🎙️ Large purple mic icon in center
- 📊 Space for waveform (20 bars)
- 🔴 Red circular record button at bottom
- ❌ Close button (×) in top-right
- 💬 Text: "Tap to start recording"

**✅ Pass if:**
- Sheet opens on tap
- UI is fullscreen
- Buttons are large and easy to tap

---

### Test 9: Mobile Recording
**What to test:** Full recording flow on mobile

**Steps:**
1. Tap mic → Voice sheet opens
2. Tap the red record button
3. Speak: "Testing mobile voice"
4. Tap the red stop button

**Expected behavior:**
- 🔴 Recording starts
- 📊 **20 animated waveform bars** appear
- ⏰ Timer shows: "0:01", "0:02"
- 🎨 Bars animate with your voice (random heights)
- ⏹️ Tap stop → Recording ends
- 🔵 Blue spinner shows "Transcribing..."
- ✅ Sheet closes automatically
- ✏️ Transcribed text in input field

**✅ Pass if:**
- Full flow works start to finish
- Waveform is visible and animated
- Sheet closes after transcription
- Text appears in main input

---

### Test 10: Close Voice Sheet
**What to test:** Can cancel before recording

**Steps:**
1. Tap mic button → Sheet opens
2. **Tap × button** in top-right corner

**Expected behavior:**
- 🎬 Sheet closes with slide-down animation
- ✅ No recording happens
- ✅ Back to normal chat view

**✅ Pass if:**
- Close button works
- No recording created
- Smooth closing animation

---

## ⚠️ Error Handling Tests

### Test 11: Microphone Permission Denied
**What to test:** Graceful error handling

**Steps:**
1. Open browser settings
2. **Block** microphone permissions for localhost
3. Try to hold mic button to record

**Expected behavior:**
- 🚫 Recording doesn't start
- 🔴 Red toast message appears: "Microphone access denied"
- 💬 Helpful error message

**To fix:** Allow mic permissions in browser settings

**✅ Pass if:**
- Error message is clear
- App doesn't crash
- Can try again after allowing permissions

---

### Test 12: API Transcription Error
**What to test:** Handle transcription failures

**Steps:**
1. If OpenAI API key is not set, recording will fail to transcribe
2. Hold mic → Record → Release

**Expected behavior:**
- 🔴 Error toast: "Failed to transcribe audio"
- ❌ No text appears in input
- ✅ Can try recording again

**✅ Pass if:**
- Error is displayed
- App remains functional
- Can retry

---

## 🎨 Visual Quality Tests

### Test 13: Animation Smoothness
**What to observe:** All animations should be smooth

**Check:**
- [ ] Mic button color transitions (purple → red → blue)
- [ ] Waveform bars bounce smoothly
- [ ] Recording indicator slides in/out smoothly
- [ ] Mobile voice sheet slides up/down smoothly
- [ ] Spinner rotation is smooth
- [ ] No janky or stuttering animations

**✅ Pass if:**
- All animations are at 60fps
- No visible stuttering
- Feels polished and professional

---

### Test 14: Placeholder Text
**What to check:** New placeholder message

**Expected:**
- Input placeholder: "Type or hold mic to speak..."
- During processing: "Processing..."

**✅ Pass if:**
- Placeholder text is correct
- Changes during processing state

---

### Test 15: Button States
**What to check:** Mic button appearance in each state

**States:**
1. **Idle:** Purple (#a855f7), mic icon
2. **Recording:** Red (#ef4444), square icon, pulsing
3. **Transcribing:** Blue (#3b82f6), spinner
4. **Disabled:** Gray, opacity 50%, cursor not-allowed

**✅ Pass if:**
- All states have distinct visuals
- Color changes are clear
- Icons change appropriately

---

## 🔍 Edge Cases

### Test 16: Very Short Recording
**What to test:** Recording < 1 second

**Steps:**
1. Hold mic button
2. Immediately say "Hi"
3. Release (total time < 1 second)

**Expected behavior:**
- ✅ Should still transcribe
- ✅ Might transcribe as empty or "Hi"

**✅ Pass if:**
- Doesn't crash
- Handles short audio

---

### Test 17: Very Long Recording
**What to test:** Recording > 60 seconds

**Steps:**
1. Hold mic button
2. Keep talking for 60+ seconds
3. Watch timer: "1:00", "1:01", etc.

**Expected behavior:**
- ⏰ Timer continues counting
- 📊 Waveform keeps animating
- ✅ Transcribes the full message

**✅ Pass if:**
- Handles long recordings
- No timeout errors
- Full transcription

---

### Test 18: Background Tab
**What to test:** Recording while tab is in background

**Steps:**
1. Start recording
2. Switch to another browser tab
3. Come back to the tab
4. Release recording

**Expected behavior:**
- ⚠️ Might stop recording (browser limitation)
- ✅ Should handle gracefully

**Note:** This is a browser limitation, not a bug

---

### Test 19: Fast Switching
**What to test:** Quick record → type → record

**Steps:**
1. Hold mic → Record "Test one" → Release
2. Immediately start typing in text field
3. Before transcription appears, hold mic again

**Expected behavior:**
- ⚠️ Second recording might be blocked while transcribing
- ✅ Should handle gracefully

**✅ Pass if:**
- Doesn't crash
- Clear which action is happening

---

## 📊 Comparison Test

### Test 20: Side-by-Side Before/After
**What to test:** Compare old vs new UX

**Before (Original VoiceButton):**
- Click mic → Modal opens
- Start/Stop buttons
- No waveform
- Auto-sends after transcription

**After (VoiceInput):**
- Hold mic 500ms
- Inline waveform
- Editable transcription
- Modern UX

**Question:** Which is better?
- ✅ New: Faster, more feedback, editable
- ✅ Old: Simpler, fewer steps

**Your preference?** (Note for feedback)

---

## 🚀 Performance Tests

### Test 21: Page Load Time
**Check:**
- Does page load fast with new component?
- Is there any lag when opening the page?

**Expected:**
- ✅ Should load in < 2 seconds
- ✅ No noticeable slowdown from Week 4

---

### Test 22: Memory Leak Check
**Steps:**
1. Record 5 messages in a row
2. Open browser DevTools → Performance
3. Check memory usage

**Expected behavior:**
- ✅ Memory stays stable
- ✅ No continuous increase
- ✅ Cleanup happens after recordings

**✅ Pass if:**
- Memory usage is reasonable
- No obvious memory leaks

---

## ✅ Final Checklist

### Desktop (http://localhost:3000):
- [ ] Hold 500ms starts recording
- [ ] Quick click does nothing
- [ ] Waveform animates with voice
- [ ] Transcription is editable
- [ ] Can send edited text
- [ ] Mic disabled during processing
- [ ] Smooth animations
- [ ] Error handling works

### Mobile (test on phone if possible):
- [ ] Tap opens voice sheet
- [ ] Full-screen UI appears
- [ ] 20-bar waveform visible
- [ ] Recording works
- [ ] Timer counts correctly
- [ ] Sheet closes after transcription
- [ ] Text appears in main input
- [ ] Close button works

### Vercel Deployment:
- [ ] Page loads without errors
- [ ] All desktop tests pass on Vercel
- [ ] (Bonus) Test on real mobile device

---

## 🐛 Bug Report Template

**If you find issues, report them like this:**

```
## Bug: [Short description]

**Environment:**
- Browser: Chrome 120 on macOS
- Device: Desktop / Mobile
- URL: localhost:3000 or Vercel

**Steps to reproduce:**
1. Step one
2. Step two
3. Step three

**Expected:**
[What should happen]

**Actual:**
[What actually happened]

**Screenshots:**
[If applicable]

**Console errors:**
[Check browser console for errors]
```

---

## 🎯 Success Criteria

**Week 5 is successful if:**
- ✅ Hold-to-record works reliably (desktop)
- ✅ Voice sheet opens and works (mobile)
- ✅ Waveform visualization is visible
- ✅ Transcriptions are editable
- ✅ No major bugs or crashes
- ✅ Feels better than the old voice button

**Nice to have:**
- ✅ Smooth animations at 60fps
- ✅ Clear error messages
- ✅ Works on first try (no confusion)

---

## 💡 Testing Tips

1. **Use Chrome/Edge** - Best browser support
2. **Allow mic permissions** - Required for testing
3. **Test on phone** - Mobile UX is very different
4. **Speak clearly** - Better transcription accuracy
5. **Check console** - Look for error messages
6. **Try edge cases** - Very short, very long, interrupted
7. **Compare to old version** - Is it actually better?

---

## 📞 Need Help?

**Common issues:**

1. **Recording doesn't start:**
   - Are you HOLDING for 500ms? (not clicking)
   - Check mic permissions in browser
   - Check browser console for errors

2. **Waveform not showing:**
   - Recording might not have started
   - Check if mic access was granted

3. **Transcription fails:**
   - Check if OpenAI API key is set in .env.local
   - Check network tab for API errors
   - Check if audio file is too large

4. **Mobile sheet doesn't open:**
   - Are you on mobile? (It only opens on mobile)
   - Try refreshing the page
   - Check browser console

---

**Ready to test?** Start with Test 1 (Desktop Long-Press) on http://localhost:3000! 🚀
