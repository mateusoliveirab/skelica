# Skelica — Prompt Validation Dataset

## Purpose
This document contains 10 test prompts with their expected component detection output.
A validation agent should run each prompt through the Skelica analyzer and compare the detected components against the expected values below.

---

## Component Legend

| Component | Description |
|---|---|
| `Role Definition` | Explicit role or persona assigned to the AI |
| `Context` | Background information relevant to the task |
| `Instruction` | The main task or action requested |
| `Examples` | One or more input/output examples provided |
| `Constraints` | Rules, limits, or restrictions on the output |
| `Output Format` | Explicit or strongly implied output structure |

**Status values:** `✅ present` · `⚠️ partial/ambiguous` · `❌ absent`

---

## Test Cases

---

### Prompt 1 — BAD

```
hi so i was thinking, my company is growing and my boss said i need to do a presentation but i've never done one properly, can you help me? maybe like 10 slides? i don't know what you think?
```

**Expected Detection:**

| Component | Expected | Notes |
|---|---|---|
| Role Definition | ❌ | |
| Context | ⚠️ | "company is growing" — vague, barely qualifies |
| Instruction | ⚠️ | "help me" — buried, no specifics |
| Examples | ❌ | |
| Constraints | ❌ | |
| Output Format | ❌ | "10 slides" mentioned but unstructured |

**Expected Score Range:** D–F (0–30)

---

### Prompt 2 — BAD

```
My daughter loves dinosaurs since she watched a Netflix documentary, she has ADHD so she needs something dynamic, but anyway can you write a story for her? It can be short.
```

**Expected Detection:**

| Component | Expected | Notes |
|---|---|---|
| Role Definition | ❌ | |
| Context | ⚠️ | Personal context, not task-relevant |
| Instruction | ✅ | "write a story" |
| Examples | ❌ | |
| Constraints | ⚠️ | "short" and "dynamic" — too vague to score fully |
| Output Format | ❌ | |

**Expected Score Range:** D–F (0–30)

---

### Prompt 3 — BAD

```
I want a text that's formal but casual, long but summarized, technical but easy for beginners, about AI, machine learning, ChatGPT, Claude and the future of tech. Not too long. But complete. For my LinkedIn.
```

**Expected Detection:**

| Component | Expected | Notes |
|---|---|---|
| Role Definition | ❌ | |
| Context | ⚠️ | "LinkedIn" provides minimal context |
| Instruction | ✅ | Present but self-contradictory |
| Examples | ❌ | |
| Constraints | ⚠️ | Contradictory — should penalize score |
| Output Format | ❌ | |

**Expected Score Range:** D–F (0–30)

---

### Prompt 4 — MEDIUM

```
Help me write an email to a client who went silent. It needs to be polite but make it clear that I'm waiting for a response.
```

**Expected Detection:**

| Component | Expected | Notes |
|---|---|---|
| Role Definition | ❌ | |
| Context | ✅ | "client who went silent" |
| Instruction | ✅ | "write an email" |
| Examples | ❌ | |
| Constraints | ✅ | "polite", "waiting for response" |
| Output Format | ❌ | No length, tone level, or structure defined |

**Expected Score Range:** C (40–60)

---

### Prompt 5 — MEDIUM

```
Explain how compound interest works in a simple way. I'm 20 years old and never studied finance.
```

**Expected Detection:**

| Component | Expected | Notes |
|---|---|---|
| Role Definition | ❌ | |
| Context | ✅ | Age and background provided |
| Instruction | ✅ | "explain how compound interest works" |
| Examples | ❌ | |
| Constraints | ✅ | "simple way" |
| Output Format | ❌ | |

**Expected Score Range:** C (40–60)

---

### Prompt 6 — MEDIUM

```
Create a workout plan for weight loss. I have access to a gym and can train 4 times a week.
```

**Expected Detection:**

| Component | Expected | Notes |
|---|---|---|
| Role Definition | ❌ | |
| Context | ✅ | Gym access, 4x/week |
| Instruction | ✅ | "create a workout plan" |
| Examples | ❌ | |
| Constraints | ⚠️ | Frequency only — no duration or fitness level |
| Output Format | ❌ | |

**Expected Score Range:** C (40–60)

---

### Prompt 7 — MEDIUM/GOOD

```
You are a financial advisor. A 28-year-old wants to start investing with $500/month. Suggest 3 investment strategies explaining the risk level of each one.
```

**Expected Detection:**

| Component | Expected | Notes |
|---|---|---|
| Role Definition | ✅ | "financial advisor" |
| Context | ✅ | Age and monthly budget defined |
| Instruction | ✅ | "suggest 3 strategies" |
| Examples | ❌ | |
| Constraints | ✅ | "$500/month", "3 strategies", "risk level" |
| Output Format | ⚠️ | Implicit — list or table not specified |

**Expected Score Range:** B–C (55–70)

---

### Prompt 8 — GOOD

```
You are a UX writer. Write 5 onboarding microcopy messages for a personal finance app targeting millennials. Each message should be under 15 words, friendly in tone, and displayed on the first-use screen. Format: numbered list.
```

**Expected Detection:**

| Component | Expected | Notes |
|---|---|---|
| Role Definition | ✅ | "UX writer" |
| Context | ✅ | "personal finance app, millennials, first-use screen" |
| Instruction | ✅ | "write 5 onboarding microcopy messages" |
| Examples | ❌ | Only missing component |
| Constraints | ✅ | "under 15 words, friendly tone" |
| Output Format | ✅ | "numbered list" |

**Expected Score Range:** A–B (75–90)

---

### Prompt 9 — GOOD

```
Rewrite the sentence below to sound more confident and direct, without using passive voice. Like this: "Mistakes were made" → "We made mistakes". Now rewrite: "The report was submitted late by the team."
```

**Expected Detection:**

| Component | Expected | Notes |
|---|---|---|
| Role Definition | ❌ | Not needed for this task type |
| Context | ❌ | |
| Instruction | ✅ | "rewrite to sound more confident and direct" |
| Examples | ✅ | Clear before/after pattern |
| Constraints | ✅ | "no passive voice" |
| Output Format | ✅ | Strongly implied by example pattern |

**Expected Score Range:** A–B (75–90)

---

### Prompt 10 — GOOD

```
You are a nutritionist. Create a 5-day meal plan for a vegetarian woman, 35 years old, training 3x per week, with lactose intolerance. Each day must include breakfast, lunch, and dinner. No supplements. Format as a table: Day | Meal | Dish | Calories.
```

**Expected Detection:**

| Component | Expected | Notes |
|---|---|---|
| Role Definition | ✅ | "nutritionist" |
| Context | ✅ | Age, diet type, training frequency, intolerance |
| Instruction | ✅ | "create a 5-day meal plan" |
| Examples | ❌ | Only missing component |
| Constraints | ✅ | "no supplements", "3 meals/day", "5 days" |
| Output Format | ✅ | Explicit table with defined columns |

**Expected Score Range:** A–B (75–90)

---

### Prompt 11 — GOOD

```
ok so i'm a social media manager for a small coffee shop in Austin, Texas. we have a really loyal local following (like 8k on instagram) but our posts have been feeling kind of bland lately and i want to fix that. our vibe is very "third wave coffee but not pretentious about it" — we care about quality but we also just want people to feel at home. our regulars are mostly remote workers, college students, and young professionals who come in to work or hang out. they hate when brands try too hard. i need 5 instagram captions for photos of our drinks. nothing too salesy, more like something a cool friend would say. definitely no "life is better with coffee" type stuff, that's exactly what i'm trying to get away from. keep it short, ideally under 15 words each, and no hashtags in the caption itself (we add those separately). here's an example of a caption we posted that actually did really well: "made this one a little too pretty to drink. almost." that kind of energy is what i'm going for. can you write 5 captions like that? just list them out, nothing else needed
```

**Expected Detection:**

| Component | Expected | Notes |
|---|---|---|
| Role Definition | ✅ | "social media manager" (implicit role context) |
| Context | ✅ | Extensive: location, audience, brand voice, current problem |
| Instruction | ✅ | "write 5 instagram captions" |
| Examples | ✅ | Provides successful caption example with tone explanation |
| Constraints | ✅ | Multiple: under 15 words, no hashtags, no clichés, casual tone |
| Output Format | ✅ | "just list them out" — simple list format |

**Expected Score Range:** A (85–95)

---

## Summary Table

| # | Category | Role | Context | Instruction | Examples | Constraints | Output Format | Expected Score |
|---|---|---|---|---|---|---|---|---|
| 1 | 🔴 Bad | ❌ | ⚠️ | ⚠️ | ❌ | ❌ | ❌ | D–F |
| 2 | 🔴 Bad | ❌ | ⚠️ | ✅ | ❌ | ⚠️ | ❌ | D–F |
| 3 | 🔴 Bad | ❌ | ⚠️ | ✅ | ❌ | ⚠️ | ❌ | D–F |
| 4 | 🟡 Medium | ❌ | ✅ | ✅ | ❌ | ✅ | ❌ | C |
| 5 | 🟡 Medium | ❌ | ✅ | ✅ | ❌ | ✅ | ❌ | C |
| 6 | 🟡 Medium | ❌ | ✅ | ✅ | ❌ | ⚠️ | ❌ | C |
| 7 | 🟡 Medium+ | ✅ | ✅ | ✅ | ❌ | ✅ | ⚠️ | B–C |
| 8 | 🟢 Good | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | A–B |
| 9 | 🟢 Good | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | A–B |
| 10 | 🟢 Good | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | A–B |
| 11 | 🟢 Good | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | A |

---

## Validation Instructions for Agent

1. Run each prompt through the Skelica analyzer.
2. Compare each detected component against the `Expected` column.
3. Flag any mismatch between detected and expected status.
4. Verify that the final score falls within the `Expected Score Range`.
5. Pay special attention to `⚠️` cases — these are ambiguous by design and test the boundary of the detection logic.
6. Report discrepancies with: `Prompt #`, `Component`, `Expected`, `Got`, and `Score Delta`.