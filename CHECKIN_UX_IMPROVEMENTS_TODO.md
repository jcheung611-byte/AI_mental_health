# 🎨 Check-in UX Improvements - TODO

## Current Issues ❌

1. **Check-ins feel isolated** - Send message, get response, it disappears
2. **No conversation flow** - Can't continue the dialogue
3. **No history** - Past check-ins aren't visible
4. **Feedback required** - Forces user to give feedback before moving on
5. **Hard to start new check-in** - No clear way to reset

---

## Proposed UX Flow ✅

### New Experience:

```
┌─────────────────────────────────────┐
│  Quick Check-in                     │
│  ─────────────────────────────────  │
│  [🎤] How are you doing?    [Send]  │
└─────────────────────────────────────┘

        ↓ User sends check-in

┌─────────────────────────────────────┐
│  💬 Conversation                    │
│  ─────────────────────────────────  │
│  You: I'm stressed about work       │
│  ─────────────────────────────────  │
│  AI: [Ground mode 🌬️]              │
│  Let's calm your nervous system...  │
│  [breathing technique explained]    │
│  ─────────────────────────────────  │
│  [↩️ Reply] [⭐ Helpful?]           │
│  [🆕 New Check-in]                  │
└─────────────────────────────────────┘

        ↓ User can reply or skip

┌─────────────────────────────────────┐
│  You: That helped a bit, thanks     │
│  ─────────────────────────────────  │
│  AI: Glad to hear! Want to talk     │
│  about what's stressing you?        │
│  ─────────────────────────────────  │
│  [↩️ Reply] [⭐ Optional feedback]  │
│  [🆕 New Check-in]                  │
└─────────────────────────────────────┘

        ↓ Scroll down

┌─────────────────────────────────────┐
│  📚 Recent Check-ins                │
│  ─────────────────────────────────  │
│  ┌─────────────────────────────┐   │
│  │ 🌬️ Ground  2 hours ago      │   │
│  │ Stressed about work         │   │
│  │ 💬 3 messages               │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │ 💭 Reflect  Yesterday       │   │
│  │ Confused about relationship │   │
│  │ 💬 5 messages               │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

---

## Technical Implementation

### 1. Database Schema (✅ Already updated)

Added to `checkin_sessions` table:
- `ai_generated_title TEXT` - Short summary for history cards
- `conversation_messages JSONB` - Array of {role, text, timestamp}

### 2. Conversation State Management

**New State Fields:**
```typescript
interface CheckinConversationState {
  sessionId: string;
  messages: Array<{
    role: 'user' | 'assistant';
    text: string;
    timestamp: Date;
  }>;
  isActive: boolean;
}
```

### 3. API Changes

#### `/api/checkin` (POST)
**Request:**
```json
{
  "userId": "uuid",
  "transcript": "user message",
  "sessionId": "uuid or null",  // null = new check-in, uuid = continue convo
  "followupResponse": "optional"
}
```

**Response:**
```json
{
  "type": "intervention" | "followup_needed" | "continuation",
  "mode": "ground",
  "text": "AI response",
  "session_id": "uuid",
  "conversation": [
    {"role": "user", "text": "...", "timestamp": "..."},
    {"role": "assistant", "text": "...", "timestamp": "..."}
  ],
  "title": "Stressed about work"  // AI-generated
}
```

#### `/api/checkin/continue` (POST) - NEW
Handle conversation continuation within same session
```json
{
  "sessionId": "uuid",
  "message": "user reply"
}
```

#### `/api/checkin/history` (GET) - NEW
Fetch recent check-ins for history cards
```json
{
  "userId": "uuid",
  "limit": 10
}
```

### 4. AI Title Generation

Add to persist node:
```typescript
// Generate short title (3-6 words)
const titlePrompt = `Summarize this check-in in 3-6 words:
Input: ${raw_input}
Mode: ${selected_mode}

Examples:
- "Stressed about work deadline"
- "Confused about relationship"
- "Anxious before presentation"

Return ONLY the title, no quotes.`;

const title = await openai.chat.completions.create({
  model: 'gpt-4o-mini',  // Cheaper for simple task
  messages: [{role: 'user', content: titlePrompt}],
  max_tokens: 20
});
```

### 5. Frontend Components

#### New: `CheckinConversation.tsx`
- Shows conversation thread
- Input field for replies
- "New Check-in" button
- Optional feedback (not required)

#### New: `CheckinHistoryCard.tsx`
```tsx
<div className="border rounded-lg p-4 hover:shadow-lg transition">
  <div className="flex items-center gap-2 mb-2">
    <span className="text-2xl">{getModeEmoji(mode)}</span>
    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
      {mode}
    </span>
    <span className="text-xs text-gray-500 ml-auto">
      {timeAgo(created_at)}
    </span>
  </div>
  <h3 className="font-medium text-gray-900">{title}</h3>
  <p className="text-sm text-gray-500 mt-1">
    💬 {messageCount} messages
  </p>
</div>
```

#### Updated: `checkin.tsx`
- Add conversation state
- Add history section below
- Make feedback optional (skip button)
- Prominent "New Check-in" button

---

## Mode Emojis

```typescript
const getModeEmoji = (mode: string) => {
  switch(mode) {
    case 'ground': return '🌬️';  // Breathing/calming
    case 'reflect': return '💭';  // Thinking
    case 'action': return '⚡';   // Energy/action
    case 'hold': return '🤲';    // Holding space
    default: return '💬';
  }
};
```

---

## Conversation Logic

### When to Continue vs New Check-in?

**Continue conversation if:**
- User clicks "Reply" on active check-in
- Within 1 hour of last message
- < 10 messages in thread (prevent endless loop)

**New check-in if:**
- User clicks "New Check-in"
- > 1 hour since last message
- Thread has 10+ messages

### Multi-turn Handling

**Turn 1:** Check-in + Intervention
```
User: "I'm stressed about work"
AI: [Ground mode] "Let's calm your nervous system..."
```

**Turn 2:** User replies (optional)
```
User: "That helped a bit"
AI: "Glad to hear! Want to talk about what's stressing you?"
```

**Turn 3:** Can continue or end
```
User: "Yeah, it's the deadline"
AI: [Reflect mode] "Deadlines can be overwhelming. What specifically feels most pressing?"
```

---

## Feedback UX

**Current:** Required before moving on ❌
```
[Helped 👍] [Didn't Help 👎] [Too Much 😵]
(Must click to proceed)
```

**New:** Optional, non-blocking ✅
```
Was this helpful? (Optional)
[👍 Helped] [👎 Didn't Help] [😵 Too Much] [Skip]

[↩️ Reply to continue] [🆕 New Check-in]
```

---

## Storage Strategy

### Active Conversation
- Stored in component state
- Persisted to `conversation_messages` on each turn
- Loaded from DB when revisiting history

### History Display
- Query last 10 sessions
- Show as cards
- Click to expand full conversation

---

## Success Metrics

**Engagement:**
- ✅ Average messages per check-in > 2 (currently 1)
- ✅ % of check-ins where user replies > 30%
- ✅ % of users who view history > 50%

**Quality:**
- ✅ Conversation feels natural (qualitative)
- ✅ Users continue check-ins organically
- ✅ Feedback rate > 40% (even though optional)

---

## Implementation Order

1. ✅ Update DB schema (done)
2. Add title generation to persist node
3. Add conversation state to frontend
4. Build history cards component
5. Update main check-in page layout
6. Add continuation API endpoint
7. Add history API endpoint
8. Polish & test

**Estimated:** 2-3 hours of focused work

---

## Open Questions

1. **Max conversation length?** 
   - Proposal: 10 messages per check-in
   - After 10, suggest "New Check-in"

2. **Should history be paginated?**
   - Proposal: Load 10 most recent, "Load more" button

3. **Allow editing past check-ins?**
   - Proposal: No editing, but can add notes/tags

4. **Group by date?**
   - Proposal: "Today", "Yesterday", "This Week", "Older"

---

*Ready to build in next session! 🚀*

