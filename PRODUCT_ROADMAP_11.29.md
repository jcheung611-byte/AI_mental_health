# Product Roadmap
**Last Updated:** November 29, 2025  
**Product:** AI Mental Health Companion (Voice Venting App)  
**Vision:** Voice-first venting with AI conversation + longitudinal mental health tracking

---

## 🎯 Core Strategy

**Target User:** People who need to vent about stress/life (like me!)

**Key Differentiators vs ChatGPT:**
1. Persistent audio archive (every rant saved forever)
2. Unlimited venting time (no 5-min limit)
3. Mental health focused (specialized prompting)
4. Cross-session memory (remembers across all rants)
5. Longitudinal tracking (patterns over weeks/months)

**Business Model:** Freemium (Free tier + $8/month premium for analytics)

---

## 📅 Build Timeline

### **Phase 1: Foundation (Week 1-2) - Nov 29 - Dec 13**
**Goal:** Core differentiators working, immediately useful

### **Phase 2: Polish & UX (Week 3-4) - Dec 14 - Dec 27**
**Goal:** Beautiful, shippable MVP

### **Phase 3: Onboarding & Growth (Week 5-6) - Dec 28 - Jan 10**
**Goal:** Lower friction, easier to start, ready for users

### **Phase 4: Analytics & Premium (Month 2+) - Jan 11+**
**Goal:** Longitudinal insights, monetization ready

---

## 🎯 TIER 1: Foundation Features (BUILD FIRST)
**Priority:** P0 (Critical - nothing works without these)  
**Timeline:** Nov 29 - Dec 13 (2 weeks)  
**Status:** 🚧 In Progress

These create immediate differentiation from ChatGPT and unlock everything else.

---

### 1.1 Hybrid Recording System ⭐⭐⭐
**Priority:** P0 - HIGHEST  
**Effort:** 4-6 hours  
**Status:** Not started  
**Target:** Nov 29-30 (this weekend)

**What:**
- Continuous recording (no interruptions, unlimited length)
- Chunk audio every 30 seconds for live transcription
- Keep full audio buffer in memory
- On stop: Upload full audio to Supabase Storage
- Save audio URL with message in database
- Display live transcription as user speaks
- Allow editing transcription before sending

**Why Critical:**
- Core differentiator #1: Unlimited venting (vs 5-min limit)
- Core differentiator #2: Audio archive (vs ChatGPT losing it)
- Foundation for ALL future features
- Makes app actually useful for venting TODAY

**Technical Notes:**
- Use overlapping chunks (avoid mid-word cuts)
- Show "Transcribing..." state for each chunk
- Buffer full audio until user clicks "Send"
- Compress audio before upload (WebM format)
- Check file size before upload (warn if >10MB)

**Dependencies:** None (Supabase already set up)

**Success Metric:** Can record 30-minute rant, see live transcription, replay audio

---

### 1.2 Audio Playback on Messages ⭐⭐⭐
**Priority:** P0  
**Effort:** 1 hour  
**Status:** Not started  
**Target:** Dec 1

**What:**
- Play button (🔊) on every message with saved audio
- Audio player with play/pause, seek, speed control
- Show duration, current time
- Visual indicator when audio is playing

**Why Critical:**
- Makes audio archive discoverable
- Emotional connection (hear yourself from weeks ago)
- Proof of progress ("I sounded so stressed then!")
- Core value proposition

**Technical Notes:**
- Reuse existing audio player logic
- Fetch from Supabase Storage URL
- Cache audio blobs for performance
- Handle loading states gracefully

**Dependencies:** 1.1 (needs audio storage)

**Success Metric:** Can play back any message's audio

---

### 1.3 Voice Journal Library View ⭐⭐
**Priority:** P0  
**Effort:** 2-3 hours  
**Status:** Not started  
**Target:** Dec 2-3

**What:**
- New page: "Your Voice Journal"
- List all rants organized by date
- Show: Date, duration, first line of transcript, play button
- Filter by date range
- Search transcripts (basic text search)
- Sort by newest/oldest, longest/shortest

**Why Critical:**
- Surfaces the value of audio archive
- Makes old rants discoverable
- "Wow, I have 20 rants saved!" (lock-in)
- Foundation for analytics

**UI Mockup:**
```
📚 Your Voice Journal
━━━━━━━━━━━━━━━━━━━━━━

🔍 Search transcripts...

📅 November 28, 2025 (3 rants)
┌─────────────────────────────┐
│ 🎤 Work stress rant         │
│ 8 min 23 sec                │
│ "Ugh, today was so..."      │
│ [🔊 Play]                   │
└─────────────────────────────┘

📅 November 27, 2025 (1 rant)
┌─────────────────────────────┐
│ 🎤 Feeling overwhelmed      │
│ 15 min 12 sec               │
│ "I just feel like..."       │
│ [🔊 Play]                   │
└─────────────────────────────┘
```

**Technical Notes:**
- Query Supabase: `messages` table, filter by user, order by date
- Paginate if >50 messages
- Use Fuse.js for fuzzy search
- Cache transcripts for search performance

**Dependencies:** 1.1, 1.2 (needs audio storage + playback)

**Success Metric:** Can browse and find old rants easily

---

### 1.4 Basic Stats Dashboard ⭐⭐
**Priority:** P1 (Important but not blocking)  
**Effort:** 1-2 hours  
**Status:** Not started  
**Target:** Dec 4-5

**What:**
- Simple stats page showing:
  - Total conversations
  - Total venting time
  - Days using the app
  - Current streak (days in a row)
  - Most common topics (word cloud)
  - Average rant length

**Why Important:**
- Shows value building up
- Gamification (streak!)
- Early analytics (foundation for premium features)
- Makes progress visible

**UI Mockup:**
```
📊 Your Stats
━━━━━━━━━━━━━━━━━━━━━━

💬 23 conversations
⏱️ 4h 12m total venting
📅 Using for 2 weeks
🔥 8 day streak!

Most mentioned: work (18), stress (15), deadline (12)
```

**Technical Notes:**
- Simple SQL queries on Supabase
- Count messages, sum durations
- Streak calculation: consecutive days with messages
- Word frequency: tokenize transcripts, count occurrences

**Dependencies:** 1.3 (needs data in database)

**Success Metric:** See stats update in real-time

---

### 1.5 Quick UX Improvements ⭐⭐
**Priority:** P1  
**Effort:** 2-3 hours  
**Status:** Not started  
**Target:** Dec 6-7

**What:**
- Better loading states (skeleton screens, spinners)
- Smooth scroll to new messages
- Nicer empty states ("No rants yet - start venting!")
- Better error messages (actionable, friendly)
- Confirmation before clearing data
- Toast notifications (success, error)
- Keyboard shortcuts (Enter to send, Esc to cancel)

**Why Important:**
- Professional feel
- Quality of life
- Reduces friction
- Better error recovery

**Technical Notes:**
- Use Framer Motion for transitions (already installed!)
- Add react-hot-toast for notifications
- Better error boundaries
- Loading skeletons for async operations

**Dependencies:** None

**Success Metric:** App feels smooth and polished

---

## 🎨 TIER 2: Design & Polish (AFTER Foundation Works)
**Priority:** P1 (Important - makes it shippable)  
**Timeline:** Dec 14 - Dec 27 (2 weeks)  
**Status:** 📋 Planned

Build these AFTER Tier 1 is stable and you're using it daily.

---

### 2.1 Design Overhaul ⭐⭐⭐
**Priority:** P1  
**Effort:** 8-12 hours  
**Status:** Not started  
**Target:** Dec 14-20

**What:**
- New color palette (warm pastels, cozy vibes)
- Better typography (hierarchy, readability)
- Voice-first layout (big mic button as hero)
- Glassmorphism effects (modern, clean)
- Smooth animations (Framer Motion)
- Better spacing & visual hierarchy
- Dark mode support (optional)
- Mobile responsive

**Design Principles:**
- Warm, not clinical
- Cozy, not dystopian
- Safe, not manipulative
- Private, not social
- Voice-first, not text-first

**Color Palette Ideas:**
```
Primary: Soft purple (#B794F6)
Secondary: Warm pink (#FBB6CE)
Accent: Mint green (#81E6D9)
Background: Cream (#FFFAF0)
Text: Charcoal (#2D3748)
```

**Why Important:**
- Portfolio-ready
- Shareable (good screenshots!)
- Professional feel
- Matches brand/vision

**Technical Notes:**
- Update Tailwind config with new colors
- Create design system (components, spacing scale)
- Refactor existing components to use new styles
- A/B test with old design first?

**Dependencies:** Tier 1 complete (don't redesign broken features!)

**Success Metric:** Screenshots look amazing, people say "wow"

---

### 2.2 Micro-Interactions & Delight ⭐
**Priority:** P2 (Nice-to-have)  
**Effort:** 2-4 hours  
**Status:** Not started  
**Target:** Dec 21-22

**What:**
- Mic button pulses when recording
- Subtle sound effects (optional)
- Confetti on milestones (10th rant!)
- Loading animations (breathing circle)
- Smooth page transitions
- Haptic feedback (mobile)
- Easter eggs (secret features)

**Why Nice:**
- Adds personality
- Memorable experience
- Shareable moments
- Builds emotional connection

**Technical Notes:**
- Use Framer Motion for animations
- react-confetti for celebrations
- Tone.js for optional sound effects
- Keep it subtle (not annoying!)

**Dependencies:** 2.1 (design overhaul)

**Success Metric:** Users smile when using it

---

## 🚪 TIER 3: Onboarding & Growth (CHERRY ON TOP)
**Priority:** P2 (Nice-to-have - improves conversion)  
**Timeline:** Dec 28 - Jan 10 (2 weeks)  
**Status:** 📋 Planned

Build these AFTER core product works AND looks good.

---

### 3.1 ChatGPT Context Import ⭐⭐
**Priority:** P2  
**Effort:** 2-3 hours  
**Status:** Not started  
**Target:** Dec 28-30

**What:**
- Optional onboarding step for ChatGPT users
- Show prompt: "Go to ChatGPT and ask: 'Tell me what you know about me, outlined in 3 paragraphs'"
- Text area to paste ChatGPT's response
- Parse and save as initial memories
- Skip option: "I don't use ChatGPT / I'll add context later"

**UI Flow:**
```
┌─────────────────────────────────┐
│ Welcome! 👋                     │
│                                 │
│ Do you already use ChatGPT?     │
│                                 │
│ [Yes, import my context]        │
│ [No, I'll start fresh]          │
└─────────────────────────────────┘

If Yes:
┌─────────────────────────────────┐
│ Import Your ChatGPT Context     │
│                                 │
│ 1. Go to ChatGPT                │
│ 2. Ask: "Tell me what you know  │
│    about me in 3 paragraphs"    │
│ 3. Copy and paste the response: │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ [Paste here]                │ │
│ └─────────────────────────────┘ │
│                                 │
│ [Import] [Skip]                 │
└─────────────────────────────────┘
```

**Why Nice-to-have:**
- Solves "ChatGPT already knows me" problem
- Lower switching cost
- Faster time-to-value
- Shows understanding of user pain point

**Why NOT Critical:**
- Only helps ChatGPT users (subset of users)
- Manual process (not seamless)
- Can add context over time anyway
- Nice-to-have, not must-have

**Technical Notes:**
- Parse ChatGPT response into memory objects
- Save to `memories` table
- Show preview before confirming
- Mark as "imported from ChatGPT"

**Dependencies:** Core memory system (already exists)

**Success Metric:** 30%+ of new users import context

---

### 3.2 Optional Intro Flow (Non-ChatGPT Users) ⭐
**Priority:** P2  
**Effort:** 2-3 hours  
**Status:** Not started  
**Target:** Dec 31 - Jan 2

**What:**
- For users who don't use ChatGPT
- Optional 2-minute intro conversation with AI
- AI asks: "Tell me a bit about yourself"
- User can vent/talk, AI saves key facts
- Fully skippable: "I'll just start venting"

**UI Flow:**
```
┌─────────────────────────────────┐
│ Want a quick intro?             │
│                                 │
│ I can ask a few questions to    │
│ get to know you (2 min)         │
│                                 │
│ [Let's do it!]                  │
│ [Skip - I'll just start venting]│
└─────────────────────────────────┘

If "Let's do it":
[AI asks questions, saves context]
```

**Why Nice-to-have:**
- Lowers friction for new users
- Builds relationship from day 1
- Saves context early
- But: Can also just start venting (low friction)

**Why NOT Critical:**
- Adds friction (another step before venting)
- Not essential (can build context over time)
- Risk: Users bounce before trying core feature
- Could be optional tutorial, not mandatory

**Technical Notes:**
- Pre-scripted AI questions
- Extract memories from responses
- Time-box to 2 minutes max
- Easy to skip at any time

**Dependencies:** 3.1 (onboarding flow)

**Success Metric:** 50%+ of non-ChatGPT users complete intro

---

### 3.3 Better Empty States & First-Time UX ⭐
**Priority:** P2  
**Effort:** 1-2 hours  
**Status:** Not started  
**Target:** Jan 3-4

**What:**
- Beautiful empty state for voice journal (first visit)
- Helpful tooltip on first mic button click
- Sample prompt suggestions
- "What brings you here today?" starter
- Progress indicators (1/3 steps complete!)

**UI Examples:**
```
📚 Your Voice Journal
━━━━━━━━━━━━━━━━━━━━━━
(empty state)

🎤 No rants yet!

Ready to vent? Hit the mic button
and talk for as long as you need.

Your AI companion is listening.

[Start Your First Rant]
```

**Why Nice-to-have:**
- Guides new users
- Reduces confusion
- Shows value before they start
- But: Product should be self-explanatory

**Technical Notes:**
- Detect first-time user (no messages yet)
- Show tooltips with Tippy.js
- Hide after first use

**Dependencies:** None

**Success Metric:** Reduced bounce rate for new users

---

## 📊 TIER 4: Analytics & Premium (MONETIZATION)
**Priority:** P1 (Important - enables business model)  
**Timeline:** Jan 11+ (Month 2+)  
**Status:** 📋 Planned

Build these AFTER you have real usage data (1+ month of daily use).

---

### 4.1 Advanced Analytics Dashboard ⭐⭐⭐
**Priority:** P1 (for premium)  
**Effort:** 6-8 hours  
**Status:** Not started  
**Target:** Jan 11-18

**What:**
- Stress mentions over time (line chart)
- Most mentioned topics (word frequency)
- Rant patterns (which days/times?)
- Progress indicators ("40% less stress mentions!")
- Mood trends (if we add mood tracking)
- Voice tone analysis (future)
- Monthly summary reports

**UI Mockup:**
```
📊 Your Mental Health Dashboard
━━━━━━━━━━━━━━━━━━━━━━

Stress Level Trend (Last 3 Months)
┌─────────────────────────────┐
│    📈                       │
│   ╱                         │
│  ╱  ╲                       │
│ ╱    ╲___                   │
│           ───╲____          │
└─────────────────────────────┘
 Sep    Oct    Nov    Dec

Insights:
✅ Stress mentions down 40% vs 3 months ago
✅ Average rant length decreasing (good sign!)
⚠️ You vent most on Mondays (work deadline pattern?)

Top Topics:
work (45), deadline (32), stress (28), overwhelmed (18)
```

**Why Critical for Premium:**
- Killer differentiator (ChatGPT can NEVER do this)
- Justifies $8/month price
- Lock-in (can't leave without losing insights)
- Actual mental health value

**Technical Notes:**
- Need 2+ weeks of data minimum
- Use Chart.js or Recharts for visualizations
- NLP for sentiment analysis
- Cache computations (expensive queries)

**Dependencies:** Real usage data (use app for 1+ month)

**Success Metric:** Users say "holy shit" when seeing insights

---

### 4.2 Premium Features & Stripe Integration ⭐⭐
**Priority:** P1  
**Effort:** 4-6 hours  
**Status:** Not started  
**Target:** Jan 19-25

**What:**
- Free tier: Last 7 days audio, basic features
- Premium tier ($8/month): Unlimited archive + analytics
- Stripe integration for payments
- Subscription management
- Premium badge/indicator
- Trial period (7 days free)

**Pricing:**
```
Free:
✅ Unlimited conversations
✅ Live transcription
✅ 7 days audio playback
✅ Basic memory
✅ Export

Premium ($8/month or $80/year):
✅ Everything in Free
✅ Unlimited audio archive
✅ Advanced analytics dashboard
✅ Voice tone analysis (future)
✅ Monthly reports
✅ Priority support
```

**Why Important:**
- Enables business model
- Validates willingness to pay
- Funds development
- Creates premium/free split

**Technical Notes:**
- Stripe Checkout for payments
- Webhook for subscription events
- Store subscription status in Supabase
- Protect premium routes

**Dependencies:** 4.1 (need premium features first!)

**Success Metric:** 10%+ conversion to premium

---

## 🚫 EXPLICITLY NOT BUILDING (YET)

These are good ideas but NOT in scope for MVP. Revisit after everything above ships.

### Features We're NOT Building:
❌ **Social features** (sharing rants, community)
❌ **Multi-user collaboration** (therapist access, etc.)
❌ **Mobile app** (native iOS/Android)
❌ **Breathing exercises** (Phase 3 idea, not MVP)
❌ **Daily prompts** (reflector mode, later)
❌ **Habit tracking** (different product)
❌ **Crisis intervention** (too risky, need professionals)
❌ **Voice tone analysis** (too complex, Phase 4)
❌ **Multi-language support** (English only MVP)
❌ **Desktop app** (web-first)

### Why Not Now:
- Scope creep (kills MVPs)
- Distraction from core value
- Need validation first
- Can add later if users want

---

## 📅 MILESTONES & DATES

### Milestone 1: Core Features Working
**Date:** Dec 13, 2025  
**Definition of Done:**
- ✅ Can record unlimited length rants
- ✅ See live transcription
- ✅ Audio saved to Supabase
- ✅ Can replay any message
- ✅ Voice journal library works
- ✅ Basic stats showing
- ✅ Using it myself daily

---

### Milestone 2: Shippable MVP
**Date:** Dec 27, 2025  
**Definition of Done:**
- ✅ All Milestone 1 features
- ✅ Design overhaul complete
- ✅ Looks beautiful (screenshots worthy)
- ✅ No major bugs
- ✅ 2-3 friends tested it
- ✅ Positive feedback

---

### Milestone 3: Public Launch
**Date:** Jan 10, 2026  
**Definition of Done:**
- ✅ All Milestone 2 features
- ✅ Onboarding flow complete
- ✅ Landing page ready
- ✅ Demo video recorded
- ✅ Posted on Twitter, Reddit
- ✅ 50+ signups

---

### Milestone 4: Premium Ready
**Date:** Jan 31, 2026  
**Definition of Done:**
- ✅ Analytics dashboard complete
- ✅ Stripe integration working
- ✅ Free/premium tiers defined
- ✅ First premium subscribers
- ✅ $100+ MRR

---

## 🎯 SUCCESS METRICS

### Week 1 (Foundation):
- ✅ I use it to vent 3+ times
- ✅ Audio archive works (can replay old rants)
- ✅ No major bugs

### Week 2 (Polish):
- ✅ I use it daily
- ✅ Friends say it looks good
- ✅ Feel confident showing others

### Month 1 (Launch):
- ✅ 50+ signups
- ✅ 10+ weekly active users
- ✅ 20%+ retention (week 2)
- ✅ Positive feedback

### Month 2 (Premium):
- ✅ 100+ total users
- ✅ 30+ weekly active
- ✅ 5+ premium subscribers
- ✅ $40+ MRR

---

## 🚀 NEXT ACTIONS

### This Weekend (Nov 29-Dec 1):
1. Build hybrid recording system (Sat)
2. Add audio playback (Sun AM)
3. Start voice journal library (Sun PM)

### Next Week (Dec 2-8):
4. Finish voice journal library (Mon)
5. Add basic stats (Tue)
6. Quick UX improvements (Wed)
7. Use it myself all week! (Thu-Sun)

### Following Weekend (Dec 9-10):
8. Start design overhaul

---

## 💭 PRODUCT PHILOSOPHY

### Build Philosophy:
> "Make it work, make it good, make it pretty"

**Not:** Pretty → Good → Working  
**Yes:** Working → Good → Pretty

### Feature Philosophy:
> "Baseline features first, cherries on top later"

**Not:** Add everything, ship someday  
**Yes:** Ship core, iterate based on feedback

### Decision Framework:
**For every feature, ask:**
1. Does this help venting? (core use case)
2. Would I use this TODAY?
3. Does this differentiate from ChatGPT?
4. Can it wait until after MVP?

If 1 & 2 = Yes → Build now  
If 3 = Yes → Priority  
If 4 = Yes → Backlog

---

## 📝 NOTES & LEARNINGS

### Nov 29, 2025:
- Decided on Story A (The Venter) as MVP focus
- Identified 5 key differentiators vs ChatGPT
- Acknowledged tendency to over-scope ("cherry on top" features)
- Committed to foundation-first approach
- Created tiered roadmap with clear priorities
- Onboarding ideas are good but NOT critical path
- Design overhaul waits until features work
- 2-week sprint to working MVP, then iterate

### Key Insight:
"Competition validates the market. We don't need a new category, just better execution for voice-first venting + longitudinal tracking."

### Risk:
Over-focusing on ChatGPT users (context import) when most users might be new to AI venting entirely. Keep friction low, make it work for EVERYONE.

---

*End of Roadmap*  
*Next Update: After Week 1 progress review (Dec 6, 2025)*

