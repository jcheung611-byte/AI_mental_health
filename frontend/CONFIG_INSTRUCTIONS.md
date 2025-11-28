# Configuration Instructions

Since Cursor blocks `.env.local` files by default, we're using `config.env` instead for development.

## Edit Your Keys Here:

Open `config.env` in this directory and add:

```
PORTKEY_API_KEY=pk-your-actual-personal-key
PORTKEY_VIRTUAL_KEY=openai-virtual-xxxxxxx
PORTKEY_BASE_URL=https://api.portkey.ai/v1
```

## Where to Get Your Keys:

1. **PORTKEY_API_KEY**: Your personal Portkey API key from https://app.portkey.ai/
2. **PORTKEY_VIRTUAL_KEY**: Company's shared OpenAI virtual key (from Portkey → Virtual Keys)
3. **PORTKEY_BASE_URL**: Already set correctly (don't change)

## After Editing:

Run this command to copy it to the right place:
```bash
cp config.env .env.local
```

Then start the app:
```bash
npm run dev
```

## Before Pushing to Git:

Delete or move `config.env` so you don't accidentally commit your keys!



