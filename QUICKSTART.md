# 🚀 Quick Start Guide - AI Voice Assistant v0

## You're Ready to Test!

All code is complete. Here's how to get it running:

### Step 1: Install Node.js (if needed)

Check if you have Node.js:
```bash
node --version
```

If not installed, download from: https://nodejs.org/ (LTS version)

### Step 2: Navigate to Project

```bash
cd "/Users/jordan.cheung/Documents/GitHub/Personal/AI voice/frontend"
```

### Step 3: Install Dependencies

```bash
npm install
```

This will install:
- Next.js & React
- OpenAI SDK
- TypeScript
- TailwindCSS
- Other dependencies

### Step 4: Configure API Key

```bash
cp .env.local.example .env.local
```

Then edit `.env.local` and add your Portkey API key:
```
PORTKEY_API_KEY=pk-xxx-your-actual-key
PORTKEY_BASE_URL=https://api.portkey.ai/v1
```

### Step 5: Start Development Server

```bash
npm run dev
```

You should see:
```
ready - started server on 0.0.0.0:3000, url: http://localhost:3000
```

### Step 6: Open the App

Open your browser to: http://localhost:3000

### Step 7: Test It!

1. **Allow microphone access** when prompted
2. **Press and hold** the big round button
3. **Speak** something like: "Hi, how are you?"
4. **Release** the button
5. **Watch** as it transcribes, processes, and speaks back!

## What to Test

Try these conversations to test different modes:

### Companion Mode
- "I'm feeling stressed about work"
- "I had a tough day"
- "I'm worried about something"

### Teacher Mode
- "Can you help me understand photosynthesis?"
- "How does the Pythagorean theorem work?"
- "Explain what recursion means"

### Assistant Mode
- "Help me plan my day tomorrow"
- "I need to organize a big project"
- "What are some good ways to stay productive?"

## Troubleshooting

### Issue: `npx: command not found`
**Solution**: Install Node.js first (see Step 1)

### Issue: Microphone not working
**Solution**: 
- Check browser permissions (should prompt automatically)
- Must use `localhost` or HTTPS
- Try Chrome/Edge (best support)

### Issue: API errors
**Solution**:
- Double-check your Portkey API key in `.env.local`
- Make sure you have Portkey credits
- Restart the dev server after editing `.env.local`

### Issue: "Module not found" errors
**Solution**: Run `npm install` again

## Files Created

All files are in: `/Users/jordan.cheung/Documents/GitHub/Personal/AI voice/frontend/`

**Core Files:**
- `pages/index.tsx` - Main UI with voice loop
- `pages/api/transcribe.ts` - Whisper endpoint
- `pages/api/chat.ts` - GPT-4 with personality
- `pages/api/speak.ts` - TTS endpoint
- `components/VoiceButton.tsx` - Push-to-talk button
- `utils/audioRecorder.ts` - Audio recording logic

**Config Files:**
- `package.json` - Dependencies
- `tsconfig.json` - TypeScript config
- `next.config.js` - Next.js config
- `tailwind.config.js` - Styling config
- `.env.local.example` - Environment template

## Next Steps After Testing

Once you verify it works:

1. **Tune the personality**: Edit the system prompt in `pages/api/chat.ts`
2. **Adjust voice**: Change the `voice` parameter in `pages/api/speak.ts`
   - Options: `alloy`, `echo`, `fable`, `onyx`, `nova`, `shimmer`
3. **Add features**: See the roadmap in `README.md`

## Cost Estimate

Per conversation (~5 seconds):
- Whisper: $0.006 per minute of audio
- GPT-4: ~$0.03 per request  
- TTS: ~$0.015 per 1000 chars

**Total: ~$0.05 per conversation**

For testing (20 conversations): ~$1.00

## Support

If you hit any issues:
1. Check the browser console (F12) for errors
2. Check the terminal where `npm run dev` is running
3. Review the troubleshooting section above

## Success Criteria

You'll know it's working when:
- ✅ Button turns red when held down
- ✅ You see "Transcribing audio..." status
- ✅ Your speech appears as text
- ✅ AI response appears below
- ✅ You hear the AI speak the response
- ✅ Status shows "Ready - Press and hold to speak again"

Happy testing! 🎉




