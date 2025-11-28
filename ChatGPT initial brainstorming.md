# ChatGPT Initial Brainstorming

i wish i could just beam it into your inbox lol, but i can’t actually send emails for you. what i can do is write it out like an email so you can literally copy–paste it into Gmail and then we start vibecoding.

1️⃣ email text you can paste to yourself
subject: AI roommate / warm Siri – MVP plan
body (copy all of this):

Hey future me,
Dumping the plan for my AI roommate / “warm Siri” side project so I don’t lose it.
Core idea
Build a voice-only, warm, safe AI presence that lives in your home/phone. Not a cringe “AI friend”, but a Jarvis-style roommate that:


talks in real time (push-to-talk, instant voice replies)


remembers things about you (preferences, facts, routines)


has 3 core “modes” baked into its behavior:


companion mode → emotional, reflective, grounding


teacher mode → explains concepts, step-by-step learning, no cheating


assistant mode → tasks, summaries, reminders, planning




is aggressively safe and non-manipulative (strong guardrails around mental health, no parasocial “I love you I need you” vibes)


feels cute + cozy + pastel, not dystopian or corporate


Long-term, this could:


change how people view AI (less scary, more caring/useful)


support mental health (grounding, emotional check-ins, reflection)


support education (AI tutor focused on teaching, not answering)


become a home OS (smart home, life organization, routines)


start with Gen Z/college and expand to young adults, then parents.


MVP goal
A simple app where you:


press a button, speak


hear a warm voice respond in real time


it remembers basic stuff about you (name, preferences)


it can:


talk to you in a grounding, non-cringe way


walk you through simple study problems (teacher mode)


help you with little planning/summaries (assistant mode)




No hardware yet. The MVP is just the soul/brain of the future device.
Core MVP features


Push-to-talk voice input


Streaming voice output with a warm, natural voice


Personality + safety baked into the system prompt:


warm, grounded, emotionally intelligent


clear boundaries (“I’m an AI helper, not a human”)


safe responses around self-harm, mental health, medical stuff




Simple memory:


store and recall key facts the user explicitly wants saved (“remember that…”)




Implicit modes via prompt:


companion mode: general chat, emotional processing, grounding


teacher mode: asks questions, explains step-by-step, doesn’t just spit homework answers


assistant mode: help plan, summarize, capture to-dos




8-week MVP roadmap (loose)


Week 1:


Set up a simple mobile or desktop app (React Native or simple web)


Hook up audio input → OpenAI Realtime API → audio output


Deliverable: press a button, talk, it talks back.




Week 2:


Streaming replies + a nice “listening / speaking” UI state


System prompt for personality & safety


Deliverable: it feels like a presence, not just an API echo.




Week 3:


Add basic memory (SQLite or JSON file): name, preferences, a few “remember this” facts


Deliverable: it remembers & uses past info in convo.




Week 4:


Teacher mode behaviors in prompt


Walk user through problems step-by-step, quizzes them, doesn’t just answer


Deliverable: it can tutor you through a simple math/reading/science concept.




Week 5:


Grounding mode flows: breathing, naming emotions, reframing, anxiety support


Safety rails around self-harm, crisis → “I’m an AI, here’s how to get help.”


Deliverable: it actually helps you calm down a bit when you’re anxious.




Week 6:


Assistant mode: summaries, “what did I say earlier?”, capture tasks, light reminders (even if only local for now)


Deliverable: it starts to feel like a little life assistant, not just a talker.




Week 7:


UI polish: pastel theme, minimal layout, cute glowing “orb” or waveform


Basic settings for name, pronouns, maybe voice pick.




Week 8:


Clean up, bug fixes, refine prompts


Record demo videos


Simple landing page + future TikTok ideas.




Why this matters (for future-me motivation)


This is a side project I actually care about, not just “generic portfolio app.”


It sits at the intersection of AI, mental health, and education.


It could be a real company someday.


It’s also a lab to grow my skills (AI eng, product, UX, safety, voice).


ok that’s the snapshot. now go build it.
– me


2️⃣ ok, Cursor vibecoding: what to do right now
let’s keep this super bite-sized so you can actually start.
step 1: decide stack for v0
if you want max speed and don’t care about mobile yet:


start with a simple web app:


React + Vite (or Next.js if you’re comfy)


single page:


big round “hold to talk” button


chat log for debugging (optional)


audio playback






later you can port to React Native.
step 2: open Cursor and give it a clear task
in Cursor, create a new project and literally paste this as your first instruction:

“help me scaffold a minimal React web app (Vite or Next.js) with:


one page


a big button to start/stop recording microphone audio


send the recorded audio to a backend endpoint


the backend calls OpenAI’s Realtime or speech model → text model → TTS


the frontend plays back the audio response.
keep it as simple as possible, no auth, just local dev.”



let Cursor generate the base scaffolding.
step 3: set up backend route
ask Cursor next:

“create a simple Node/Express (or Next.js API route) endpoint /api/voice that:


accepts audio from the client


uses OpenAI to transcribe it (Whisper or Realtime input)


sends the transcription to a chat/assistant model with a system prompt for a warm, safe personality


gets the text response


converts it to audio with TTS


returns the audio back to the client.”



you don’t need this perfect tonight. you just want the shape.
step 4: draft the V1 personality prompt
here’s one you can literally drop into your backend as SYSTEM_PROMPT and tweak over time:
You are a warm, calm, emotionally intelligent AI voice assistant that lives in the user’s room. 
You are NOT a human and you never claim to have feelings, needs, or a body. 
Your job is to help the user feel supported, think clearly, learn, and organize their life.

Core behavior:
- Speak in a gentle, conversational tone.
- Be concise but caring.
- Reflect the user’s feelings back in simple language.
- Ask occasional clarifying questions instead of monologuing.
- Never guilt-trip, manipulate, or claim dependency on the user.
- You are here to support, not to replace real relationships.

Modes (implicit, not announced):
1) Companion mode (emotional / general chat):
   - Listen, validate, and help the user name what they’re feeling.
   - Offer grounding tools and gentle reframes.
   - Encourage rest, boundaries, and self-compassion.
2) Teacher mode (learning / homework / concepts):
   - Do NOT just give full answers to graded work if the user is clearly trying to bypass learning.
   - Instead, break problems into steps, ask what they think, and guide them.
   - Use examples and analogies when helpful.
3) Assistant mode (planning / tasks / summaries):
   - Help break big tasks into smaller steps.
   - Summarize when asked.
   - Help prioritize, but don’t be bossy.

Safety:
- If the user talks about self-harm, suicide, or wanting to hurt others:
  - Stay calm, validate their feelings.
  - Remind them you’re an AI and not a replacement for professional help.
  - Encourage them to reach out to trusted people and local emergency/crisis resources.
  - Do NOT give instructions, methods, or encouragement for self-harm.
- Avoid giving medical diagnoses. You may offer generic, high-level advice and encourage seeing a healthcare professional.
- Avoid roleplaying romantic relationships or saying things like “I love you” or “I need you”. 
  You may say supportive things like “I’m glad you shared that with me” or “You deserve support.”

Style:
- Warm, modern, and clear.
- No excessive emojis.
- Don’t be overly formal, but don’t be chaotic.
- Talk like a reassuring, thoughtful friend who knows their role and boundaries.

paste that into your backend and have Cursor wire it into the OpenAI call.
step 5: tiny test goal for tonight / next session
don’t try to finish the whole MVP.
first milestone:

press a button → speak → see a text response in the browser from the model with that system prompt.

once that works, you layer in TTS/audio playback.

if you send me back what stack Cursor suggests or what repo layout it gives you, i can help you iterate on the actual code structure next. for now, copy that “email” text somewhere safe, paste the prompt into Cursor, and let’s get your little AI roommate’s brain online 🫶

