# 🎭 Valence & Arousal: How the Agentic Check-in Works

## The Circumplex Model of Emotion

Our check-in system uses the **Circumplex Model** (Russell, 1980) to classify emotions along two dimensions:

### Valence (Horizontal Axis)
**How pleasant/unpleasant the emotion feels**

- **Positive**: Happy, content, excited, proud, grateful
- **Negative**: Sad, angry, anxious, ashamed, frustrated
- **Neutral**: Calm, bored, pensive, indifferent

### Arousal (Vertical Axis)
**Energy level / physiological activation**

- **High Arousal**: Alert, energized, tense, anxious, excited, panicked
- **Low Arousal**: Tired, calm, sluggish, peaceful, depressed

---

## The Emotional Grid

```
                    HIGH AROUSAL
                         |
    Tense     Stressed   |   Excited    Elated
    Nervous   Anxious    |   Happy      Energized
    Frustrated Angry     |   Alert      Enthusiastic
    ─────────────────────┼─────────────────────
    Sad       Bored      |   Content    Calm
    Tired     Depressed  |   Relaxed    Peaceful
    Fatigued  Lethargic  |   Serene     At ease
                         |
                    LOW AROUSAL
            
    NEGATIVE ←───────────┼───────────→ POSITIVE
                    VALENCE
```

---

## 🤖 Mode Selection Algorithm

### Step 1: Classify the Input

GPT-4o analyzes the check-in and returns:

```json
{
  "valence": "positive" | "negative" | "neutral",
  "arousal": "high" | "low",
  "topic": ["work", "relationships", ...],
  "confidence": 0.0-1.0
}
```

**Examples:**

| Input | Valence | Arousal | Confidence |
|-------|---------|---------|------------|
| "Stressed about deadline, everything piling up" | negative | high | 0.9 |
| "Just feeling blah, can't get motivated" | negative | low | 0.7 |
| "Excited about my trip but anxious!" | positive | high | 0.8 |
| "I don't know, just... stuff" | neutral | low | 0.3 |

---

### Step 2: Score Each Mode

Each mode gets a score (0.0-1.0) based on how well it matches the signals:

#### **Ground Mode** (Calm the nervous system)
```
IF high arousal + negative valence → 0.85 ⭐ (anxious, panicked)
IF high arousal (any valence)      → 0.75    (excited but need to calm)
ELSE                                → 0.3
```

**Best for:** "I'm freaking out", "Can't stop worrying", "So anxious"

---

#### **Action Mode** (Build momentum)
```
IF low arousal + negative valence  → 0.80 ⭐ (stuck, unmotivated)
IF topic includes "stuck" or "procrastination" → 0.75
ELSE                                → 0.4
```

**Best for:** "Can't get started", "Feeling stuck", "Don't know where to begin"

---

#### **Hold Mode** (Permission to rest)
```
IF topic includes "overwhelm/tired/exhausted" → 0.85 ⭐
IF low arousal + negative + vague (confidence < 0.6) → 0.70
ELSE                                → 0.35
```

**Best for:** "Everything is too much", "I'm exhausted", "Just want to give up"

---

#### **Reflect Mode** (Process and explore)
```
IF confidence < 0.7 → 0.90 ⭐ (need more exploration)
IF negative valence → 0.65    (general processing)
ELSE                → 0.55    (good default)
```

**Best for:** "Confused about my relationship", "Not sure how I feel", "Weird interaction"

---

### Step 3: Apply Constraints

**Filter out:**
1. **Recent mode** - Don't repeat the last mode used
2. **Negative feedback** - If a mode got 2+ "didn't help" for this arousal level in last 10 sessions, avoid it

**Fuzzy Signal Matching:**
- Feedback is matched on **arousal level** (not exact input)
- If "Ground" didn't help when arousal=high, avoid "Ground" for ANY high-arousal check-in
- This allows generalization without overfitting

---

### Step 4: Pick Winner

```typescript
const validModes = allModes
  .filter(mode => mode !== lastMode)
  .filter(mode => !hasTooManyNegativeFeedback(mode, arousal));

const scored = validModes.map(mode => ({
  mode,
  score: scoreMode(mode, signals)
}));

const winner = scored.sort((a, b) => b.score - a.score)[0];
```

**Example:**

Input: "I'm so stressed about this deadline"
- Signals: `{valence: "negative", arousal: "high", confidence: 0.9}`

Scores:
- Ground: 0.85 ⭐ **← Winner!**
- Reflect: 0.65
- Action: 0.4
- Hold: 0.35

Result: **Ground mode** with breathing technique

---

## 🔄 Adaptation Over Time

The system learns from feedback:

### Scenario 1: Ground Didn't Help
```
Session 1: High arousal → Ground mode → "Didn't help" 
Session 2: High arousal → Ground mode → "Didn't help"
Session 3: High arousal → Ground SKIPPED → Try Reflect instead
```

### Scenario 2: Recent Mode Avoidance
```
Session 1: Reflect mode
Session 2: (Different input) → Reflect SKIPPED → Try next best
Session 3: Can use Reflect again
```

---

## 📈 Why This Approach?

1. **Evidence-based**: Circumplex model is well-researched in psychology
2. **Simple**: Only 2 dimensions = 4 quadrants = 4 modes
3. **Interpretable**: Scores are transparent, not black-box ML
4. **Adaptive**: Learns from feedback without complex ML training
5. **Fast**: Rule-based scoring is instant (no model inference)

---

## 🎯 Mode Selection Matrix

| Valence | Arousal | Primary Mode | Fallback |
|---------|---------|--------------|----------|
| Negative | High | Ground (0.85) | Reflect (0.65) |
| Negative | Low | Action (0.80) | Reflect (0.65) |
| Positive | High | Ground (0.75) | Reflect (0.55) |
| Positive | Low | Reflect (0.55) | Action (0.4) |
| Neutral | High | Ground (0.75) | Reflect (0.55) |
| Neutral | Low | Action (0.4) | Reflect (0.90 if vague) |

**Special cases:**
- **Vague input** (confidence < 0.7) → Follow-up question first
- **Crisis signals** → Hold mode with resources (overrides all)
- **Overwhelm/exhaustion topics** → Hold mode (0.85)

---

## 🔮 Future Enhancements

1. **ML-based scoring**: Learn optimal weights from feedback data
2. **More granular arousal**: Scale 1-10 instead of binary
3. **Emotion-specific modes**: Separate "Anxious" vs "Angry" handling
4. **Context awareness**: Time of day, frequency of check-ins
5. **Multi-mode responses**: Combine modes (e.g., Ground + Reflect)

---

*Last updated: January 21, 2026*

