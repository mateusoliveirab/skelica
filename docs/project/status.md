# skelica - Prompt Anatomy & Optimizer

## Status: Client-Side Architecture Complete ✅

**Last Updated:** 2026-03-24

---

## Architecture

**Type:** Static Web Application (Client-Side Only)

All prompt analysis, scoring, and processing happens in the browser using TypeScript. No backend server required.

---

## Running the Application

| Command | Purpose |
|---------|---------|
| `npm install` | Install dependencies |
| `npm run dev` | Development server at http://localhost:5173 |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build |
| `npm test` | Run test suite |
| `npm run test:prompts` | Regression tests — core tier (11 prompts) |
| `npm run lint` | ESLint |
| `npm run i18n:ci` | i18n key validation |

For full regression suite: `TEST_TIER=full npm run test:prompts`

---

## ✅ Completed Features

| Feature | Status | Implementation |
|---------|--------|----------------|
| Prompt Anatomy Detection | ✅ | Client-side regex patterns (EN/PT/ES) |
| Quality Scoring | ✅ | 8-dimension scoring algorithm |
| Component Highlighting | ✅ | Real-time visual highlighting with color-coded spans |
| Mouse-following Tooltip | ✅ | Tracks cursor over highlighted segments, smart edge-flip |
| Component Checklist | ✅ | 3-column grid, absent items show dashed border + `+` icon |
| Unified Results Block | ✅ | ScoreCard + Checklist merged in one card, Anatomy above |
| Horizontal ScoreCard | ✅ | Grade (30%) left / recommendation text (70%) right |
| Staggered Results Reveal | ✅ | Framer Motion sequential animation of result sections |
| Pre-filled Demo Prompt | ✅ | B-grade example loaded on first visit, ready to analyze |
| LLM Optimization | ✅ | OpenAI & Anthropic integration |
| Settings Management | ✅ | localStorage for API keys |
| Templates | ✅ | 4 professional templates |
| Performance Optimization | ✅ | Memoization + monitoring |
| Deployment Configs | ✅ | Vercel, Netlify, GitHub Pages, Cloudflare Pages |

---

## UI Layout — Results Section

The results section follows a narrative two-step reveal:

```
┌─────────────────────────────────────┐
│  Anatomy                  7 detected │  ← Step 1: observation
│  [color-coded prompt text]           │    mouse tooltip follows cursor
│  [component legend]                  │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  Quality Score                       │  ← Step 2: verdict + audit
│  ┌──────────┬───────────────────┐   │    unified card, no double borders
│  │   B      │ Top recommendation │   │
│  │ (grade)  │ (text, 70% width) │   │
│  └──────────┴───────────────────┘   │
│  ─────────────────────────────────  │
│  Component Checklist        7/9     │
│  ┌──────┐ ┌──────┐ ┌──────┐        │
│  │Role ✓│ │Ctx ✓ │ │Task ✓│        │
│  │Ex  ✓ │ │Const✓│ │NC  + │ ←dashed│
│  │Fmt ✓ │ │Aud ✓ │ │Tone+ │ ←dashed│
│  └──────┘ └──────┘ └──────┘        │
│  Anatomy Coverage ████████░░  78%   │
└─────────────────────────────────────┘
```

**Key design decisions:**
- `AnatomyView` keeps its own card (bg + border + rounded)
- `ScoreCard` and `ComponentsChecklist` are stripped of card wrappers — `App.tsx` provides the shared outer card with `overflow-hidden`
- The vertical divider in ScoreCard uses a gradient fade (`transparent → gradeColor → transparent`) matching the letter grade color
- `ComponentsChecklist` uses `grid-cols-3 content-start` to prevent items from stretching vertically

---

## Tech Stack

| Technology | Purpose |
|------------|---------|
| **React 19** | UI framework |
| **TypeScript** | Type safety |
| **Vite 7** | Build tool + dev server |
| **Tailwind CSS 4** | Styling + dark theme |
| **Framer Motion** | Smooth animations + stagger reveals |
| **OpenAI SDK** | GPT-4o optimization |
| **Anthropic SDK** | Claude 3.5 Sonnet optimization |

---

## Project Structure

```
skelica/
└── frontend/
    ├── src/
    │   ├── App.tsx                  # AppContent (nav + routing) + MainApp (analysis flow)
    │   ├── components/
    │   │   ├── AnatomyView.tsx      # Highlighted prompt + mouse-following tooltip
    │   │   ├── ScoreCard.tsx        # Horizontal grade/recommendation card (no border)
    │   │   ├── ComponentsChecklist.tsx  # 3-col grid checklist (no border)
    │   │   ├── PromptInput.tsx      # Textarea with copy + analyze actions
    │   │   ├── Logo.tsx
    │   │   ├── SettingsPanel.tsx
    │   │   └── ErrorBoundary.tsx
    │   ├── core/                    # Analysis engine
    │   │   ├── anatomyParser.ts     # Component detection (overlap-safe)
    │   │   ├── scorer.ts            # 8-dimension weighted scoring
    │   │   └── patterns/
    │   │       ├── english.ts
    │   │       ├── portuguese.ts
    │   │       └── spanish.ts
    │   ├── llm/                     # LLM clients (code-split via Vite)
    │   │   ├── openaiClient.ts
    │   │   ├── anthropicClient.ts
    │   │   └── factory.ts
    │   ├── hooks/
    │   │   └── usePromptAnalysis.ts # Full analysis orchestration
    │   ├── adapters/                # AnatomyResult/ScoreResult → API types
    │   ├── config/settings.ts       # localStorage API key store
    │   ├── data/validation-prompts.json  # Golden test dataset
    │   ├── pages/AboutPage.tsx
    │   └── i18n.ts                  # en/pt/es translations
    ├── vercel.json
    ├── netlify.toml
    └── .github/workflows/deploy.yml
```

---

## Performance

| Metric | Target | Status |
|--------|--------|--------|
| Analysis time (< 500 chars) | < 100ms | ✅ |
| Analysis time (2000+ chars) | < 300ms | ✅ |
| Main bundle size | < 500KB | ✅ ~450KB |
| LLM SDK code splitting | Yes | ✅ |
| Result caching (LRU) | 50 entries | ✅ |
| Pattern pre-compilation | Yes | ✅ |

---

## Deployment

Deploy to any static hosting service:

- **Cloudflare Pages**: Auto-deploy via `.github/workflows/deploy.yml` on push to `main`
- **Vercel**: `vercel deploy`
- **Netlify**: `netlify deploy --prod`
- **GitHub Pages**: Push to main (auto-deploy via Actions)

All configs include SPA redirect for client-side routing.

---

## API Keys Configuration

Users configure their own API keys in the app:

1. Click **Settings** in the nav
2. Enter OpenAI and/or Anthropic API key
3. Keys stored in browser `localStorage` — never sent to any backend
4. Keys sent only to respective LLM providers directly from the client

---

## Components Detected (9 total)

| Component | Label | Description |
|-----------|-------|-------------|
| `role` | Role / Persona | Who the AI should act as |
| `context` | Context | Background and situational information |
| `instruction` | Instruction | Main task or action to perform |
| `constraint` | Constraints | Positive rules and limitations |
| `negative_constraint` | Negative Constraints | What to avoid or exclude |
| `example` | Examples | Sample inputs, outputs, or demonstrations |
| `format` | Output Format | Structure or format of the expected response |
| `audience` | Target Audience | Who will read or use the output |
| `tone` | Tone / Style | Communication style or voice |

---

## Quality Scoring Dimensions (8 total)

| Dimension | Weight | Description |
|-----------|--------|-------------|
| Clarity | 15% | Clear and unambiguous language |
| Specificity | 12% | Concrete, measurable requirements |
| Completeness | 15% | All necessary components present |
| Structure | 10% | Well-organized with sections/lists |
| Effectiveness | 12% | Guides AI toward the desired output |
| Actionability | 12% | Clear action verbs and tasks |
| Accuracy | 12% | Well-defined, unambiguous task |
| Relevance | 12% | Focused on the stated goal |

Grades: **A+** (≥95) → **A** (≥90) → **B** (≥75) → **C** (≥60) → **D** (≥40) → **F** (<40)

---

## Multilingual Support

- **English** (`en`) — primary
- **Portuguese** (`pt`)
- **Spanish** (`es`)

Language is auto-detected based on prompt content. All UI strings use `t('key')` from `i18n.ts`.

---

## Demo Prompt (default on load)

The app loads with a pre-filled prompt designed to score **B grade** and demonstrate all major components:

```
You are an expert UX researcher and product strategist...

## Context
We are redesigning the onboarding flow for a fintech app...

## Task
Analyze the onboarding screen designs and identify the top 3 friction points...

For example: if a screen has a long form, suggest progressive disclosure...

## Constraints
- Each solution must be implementable in under 2 weeks by a team of 2 developers.
- Do not include third-party integrations or any changes that require backend work.

## Output Format
Structure each friction point as follows:
1. Issue + severity (1–5)
2. Root cause
3. Proposed fix
4. Success metric

## Audience
Target audience: product designers and frontend engineers...

Tone: professional but accessible — avoid jargon without explanation.
```

This demonstrates role, context, instruction, example, constraints, output format, and audience in a structured, readable format.

---

## Known Issues

None currently. All core features working as expected.

---

## Next Steps

- [ ] Add more language support
- [ ] Expand template library
- [ ] Add export/import functionality
- [ ] Add prompt history
- [ ] Add collaborative features
- [ ] Improve recommendation text readability (wall of text in ScoreCard)
