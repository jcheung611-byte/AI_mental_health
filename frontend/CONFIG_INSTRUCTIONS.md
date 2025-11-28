# Configuration Instructions

## Required API Keys:

You'll need:
1. **OpenAI API Key** - For Whisper (speech-to-text), GPT-4 (chat), and TTS (text-to-speech)
2. **Supabase Project** - For persistent storage of conversations and memories

## Setup Instructions:

### 1. OpenAI API Key

1. Go to: https://platform.openai.com/api-keys
2. Create new API key for this project
3. Copy the key (starts with `sk-proj-...`)

### 2. Supabase Setup

1. Go to: https://supabase.com
2. Create new project (name: `ai-mental-health`)
3. Wait ~2 minutes for setup
4. Go to **Settings → API**
5. Copy:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **anon public** key (starts with `eyJ...`)
6. Go to **SQL Editor**
7. Run the SQL from `supabase-schema.sql` to create tables

### 3. Create `.env.local` File

Create a file named `.env.local` in this directory with:

```bash
# OpenAI API Key
OPENAI_API_KEY=sk-proj-your-key-here

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your-key-here
```

### 4. Start the App

```bash
npm install
npm run dev
```

Visit: http://localhost:3000

## Deploying to Vercel:

1. Push your code to GitHub (`.env.local` is automatically ignored)
2. Import project on Vercel
3. Add the same 3 environment variables in Vercel settings
4. Deploy!

## Security Note:

Never commit `.env.local` to git! It's already in `.gitignore`.



