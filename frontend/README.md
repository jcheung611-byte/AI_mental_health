# AI Voice Assistant - v0

A warm, safe AI voice assistant with emotional intelligence. Speak naturally and hear warm, helpful responses.

## ✅ Status: v0 Complete - All Phases Implemented

### Features

- 🎤 **Voice Input**: Press and hold to speak
- 🎯 **Speech-to-Text**: Powered by OpenAI Whisper
- 🤖 **Warm AI Personality**: GPT-4 with emotional intelligence
- 🔊 **Voice Output**: Natural-sounding TTS responses
- ⚡ **Full Loop**: Complete conversation in ~5 seconds
- 🛡️ **Safety**: Built-in guardrails and error handling

## Quick Start

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Set Up Environment

Copy the example env file:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your Portkey API key:

```
PORTKEY_API_KEY=your_actual_portkey_key_here
PORTKEY_BASE_URL=https://api.portkey.ai/v1
```

### 3. Run Development Server

```bash
npm run dev
```

### 4. Open the App

Navigate to [http://localhost:3000](http://localhost:3000)

### 5. Test the Voice Loop

1. Click and hold the "Hold to Talk" button
2. Speak into your microphone
3. Release the button
4. Watch as it:
   - Transcribes your speech
   - Gets an AI response
   - Speaks the response back to you

## Project Structure

```
frontend/
├── pages/
│   ├── index.tsx              # Main UI with full voice loop
│   ├── _app.tsx               # App wrapper
│   └── api/
│       ├── transcribe.ts      # Whisper API endpoint
│       ├── chat.ts            # GPT-4 chat endpoint
│       └── speak.ts           # TTS API endpoint
├── components/
│   └── VoiceButton.tsx        # Push-to-talk button component
├── utils/
│   └── audioRecorder.ts       # MediaRecorder API wrapper
├── styles/
│   └── globals.css            # Global styles with Tailwind
├── package.json               # Dependencies
├── tsconfig.json              # TypeScript config
├── tailwind.config.js         # Tailwind config
└── next.config.js             # Next.js config
```

## Tech Stack

- **Frontend**: Next.js 14 (Pages Router), React 18, TypeScript
- **Styling**: TailwindCSS
- **Voice APIs**: OpenAI (via Portkey)
  - Whisper (speech-to-text)
  - GPT-4 (conversation)
  - TTS (text-to-speech)
- **Audio**: Web Audio API, MediaRecorder

## AI Personality

The AI has a warm, emotionally intelligent personality with three implicit modes:

1. **Companion Mode**: Emotional support, validation, grounding
2. **Teacher Mode**: Step-by-step learning, no homework cheating
3. **Assistant Mode**: Planning, summaries, task breakdown

### Safety Features

- No romantic/dependency language
- Crisis support with professional help referrals
- No medical diagnoses
- Clear AI/human boundaries

## Development Phases (Completed)

- ✅ **Phase 1**: Audio recording with MediaRecorder API
- ✅ **Phase 2**: Transcription with Whisper
- ✅ **Phase 3**: Chat responses with GPT-4
- ✅ **Phase 4**: Text-to-speech playback
- ✅ **Phase 5**: Integration, polish, and error handling

## Troubleshooting

### No microphone access
- Check browser permissions
- Make sure you're using HTTPS or localhost
- Allow microphone access when prompted

### Transcription fails
- Speak clearly and loudly enough
- Make sure your recording is at least 1 second
- Check API key is configured correctly

### No audio playback
- Check browser audio isn't muted
- Try clicking on the page first (browsers require user interaction)
- Check developer console for errors

### API errors
- Verify your Portkey API key is correct in `.env.local`
- Check that you have API credits available
- Restart the dev server after changing `.env.local`

## What's Next (Future Phases)

### Memory & Context
- Conversation history
- User preferences storage
- Long-term memory system

### Advanced Features
- Multiple conversation turns
- Mode switching UI
- Voice selection
- Custom personality tuning
- Mobile app (React Native)

### Production Ready
- User authentication
- Database integration
- Better error recovery
- Performance optimization
- Deployment to Vercel

## API Usage

The app makes the following API calls per conversation:

1. **Whisper** (transcribe): ~$0.006 per minute of audio
2. **GPT-4** (chat): ~$0.03 per request
3. **TTS** (speak): ~$0.015 per 1000 characters

Estimated cost per conversation: **~$0.05**

## License

Personal project - not licensed for redistribution

## Acknowledgments

Built following the plan from `ChatGPT initial brainstorming.md` - a thoughtful approach to creating warm, safe AI interactions.
