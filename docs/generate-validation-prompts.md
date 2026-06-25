# Prompt: Generate Validation Test Prompts

Use this prompt with any LLM to generate new batches of test prompts for the Skelica validation loop.

**Workflow:**
1. Send the prompt below to an LLM
2. Paste the returned JSON into `frontend/src/data/validation-prompts.json` (inside the `"prompts"` array)
3. Run `TEST_TIER=full npm run test:prompts`
4. Fix any failures following the same loop used in Sections 1–4 (see `docs/testing/cases.md`)

Update the section number and ID prefix each batch (Section 5 → X1–X15, Section 6 → Y1–Y15, etc.).

---

## Prompt

I need you to generate 15 new test prompts for a prompt anatomy analyzer validation dataset. These prompts will be used to regression-test a parser that detects 8 structural components in AI prompts.

### Component Types

- **role** — explicit role or persona assigned to the AI (e.g., "You are a UX writer", "Act as a senior developer")
- **context** — background information, situation, or constraints provided (e.g., "I work at a startup with 10 people")
- **instruction** — the main task or action requested (e.g., "Write 5 subject lines", "Rewrite this paragraph")
- **example** — one or more concrete examples provided inline (e.g., "Like this: X → Y", "something like a bruschetta")
- **constraint** — rules, limits, or restrictions on the output (e.g., "under 15 words", "no emojis", "don't use passive voice")
- **format** — explicit output structure (e.g., "numbered list", "just the dish names", "Format as a table")
- **audience** — who the content is for (e.g., "my audience would be nurses", "targeting millennials")
- **tone** — desired voice or mood (e.g., "sound professional but not robotic", "want it to feel personal")

### Quality Categories

- **bad** — vague, contradictory, or minimal context; few components
- **medium** — has instruction and some context, but missing key components
- **medium-good** — conversational, human-written; has most components but informally expressed
- **good** — well-structured; has role, instruction, constraints, and format
- **perfect** — all 8 components present and well-defined

### Scoring

The scorer returns a float between 0.0 and 1.0 based on clarity, specificity, completeness, structure, effectiveness, actionability, accuracy, and relevance. Typical ranges:
- bad: 0.15–0.40
- medium: 0.20–0.45
- medium-good: 0.30–0.60
- good: 0.55–0.75
- perfect: 0.75–0.95

### Style Guidelines

- Write prompts as a **real human would type them** — not as perfectly formatted AI prompts
- Mix formal and informal phrasing
- The "medium-good" category should feel like someone who knows what they want but expresses it conversationally
- Vary use cases: email writing, content creation, coding help, education, career advice, product copy, etc.
- Avoid use cases already covered: LinkedIn bio, Etsy candle, email marketing, onboarding flow, nurse newsletter, dinner party menu, cold email, compound interest explanation, interview prep, UX grant, meeting reschedule, protein bars, Instagram captions

### JSON Format

Return a JSON array of 15 objects with this exact structure:

```json
[
  {
    "id": "X1",
    "section": "5",
    "tier": "full",
    "category": "medium-good",
    "label": "Short label (3-6 words)",
    "text": "The actual prompt text as a human would write it",
    "expected": {
      "role": "absent",
      "context": "present",
      "instruction": "present",
      "example": "absent",
      "constraint": "present",
      "format": "absent",
      "audience": "absent",
      "tone": "absent"
    },
    "scoreRange": { "min": 0.34, "max": 0.49 }
  }
]
```

### Rules for `expected` values

- Use `"present"` only when the component is **clearly detectable by regex** — there's an explicit keyword or pattern
- Use `"absent"` when the component is **not mentioned at all** or only implied semantically
- Use `"partial"` only for genuinely ambiguous cases
- Be conservative: if the component is only implied (e.g., audience can be inferred from context but no phrase like "my audience", "targeting", "for X users" appears), mark it `"absent"`

### Distribution Requirements

Generate exactly:
- 2 × bad
- 4 × medium
- 5 × medium-good
- 3 × good
- 1 × perfect

Use IDs X1 through X15. Return only the JSON array, no prose.
