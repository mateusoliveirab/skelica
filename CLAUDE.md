# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Skelica** is a prompt anatomy analyzer and optimizer. It detects 9 structural components in AI prompts (role, context, instruction, constraint, negative_constraint, example, output format, audience, tone), calculates quality scores across 8 dimensions, and offers AI-powered optimization via OpenAI/Anthropic.

**Architecture:** Fully client-side static web app — no backend. All analysis and scoring runs in the browser using regex patterns. LLM integration is optional and calls providers directly from the client.

## Commands

All commands run from `frontend/`:

```bash
npm run dev              # Vite dev server → http://localhost:5173
npm run build            # TypeScript check + Vite production build → dist/
npm test                 # Vitest (watch mode)
npm run test:prompts     # Regression tests — core tier (11 prompts)
npm run lint             # ESLint
npm run i18n:ci          # i18n key validation
npm run preview          # Preview production build
```

For full regression suite: `TEST_TIER=full npm run test:prompts`

## Architecture

### Analysis Pipeline

```
User Input → usePromptAnalysis hook
  → AnatomyParser.parse() (regex detection, overlap-safe)
  → Scorer.score() (8-dimension quality scoring)
  → Adapters (convert to API format)
  → UI (AnatomyView → unified [ScoreCard + ComponentsChecklist])
```

### Key Modules

- **`core/anatomyParser.ts`** — Component detection via multilingual regex. Handles overlap resolution by priority and containment rules. Changes here require running `test:prompts`.
- **`core/scorer.ts`** — Weighted scoring across 8 dimensions (clarity 15%, specificity 12%, completeness 15%, structure 10%, effectiveness 12%, actionability 12%, accuracy 12%, relevance 12%). Includes anti-pattern detection and grade calculation (A+ to F).
- **`core/patterns.ts` + `patterns/`** — PatternLoader manages language-specific regex (en/pt/es). Patterns are pre-compiled and cached.
- **`llm/factory.ts`** — Factory pattern for LLM clients. SDKs are code-split into separate chunks via Vite.
- **`hooks/usePromptAnalysis.ts`** — Orchestrates the full analysis flow with performance tracking.
- **`adapters/`** — Bridge between core types (`AnatomyResult`, `ScoreResult`) and legacy API types (`AnalyzeResponse`, `ScoreResponse`).
- **`config/settings.ts`** — localStorage-based settings store for API keys.
- **`data/validation-prompts.json`** — Golden test dataset (~26 multilingual prompts) used for regression.

### LLM Integration

- API keys stored in `localStorage`, sent only to OpenAI/Anthropic directly
- SDKs loaded dynamically (code splitting in `vite.config.ts`) to reduce initial bundle
- OpenAI client includes rate limiting

## UI Layout — Results Section

The results section renders in a two-step staggered reveal (Framer Motion `staggerChildren`):

**Step 1 — AnatomyView** (its own card with `bg-[--bg-surface]` + border):
- Renders the prompt with color-coded highlighted spans per detected component
- Tooltip follows the mouse cursor (`onMouseMove` + `useRef`), with smart edge-flip when near right boundary
- Legend row at the bottom shows all 9 components, dimmed if absent

**Step 2 — Unified card** (`App.tsx` owns `bg-[--bg-surface]` + border + `overflow-hidden`):
- **ScoreCard** (top half): horizontal 30/70 split — letter grade + label on left, recommendation text on right. No own card wrapper.
- Divider: `border-t border-[--border-subtle]`
- **ComponentsChecklist** (bottom half): 3-column grid (`grid-cols-3 content-start`). Present items have filled colored circle + checkmark. Absent items have dashed border + `+` icon. No own card wrapper.
- Progress bar at bottom shows anatomy coverage %.

> **Important:** `ScoreCard` and `ComponentsChecklist` have NO card wrapper (no `bg`, `border`, `rounded`) — they rely on the outer unified card in `App.tsx`. Do not add card styling back to these components.

## Conventions

- **Filenames:** lowercase (camelCase for modules)
- **i18n:** Use `t('key')` from `i18n.ts` — never hardcode UI strings. Supports en/pt/es.
- **TypeScript:** Strict mode with `noUnusedLocals`, `noUnusedParameters`
- **Testing:** Vitest. Regression data in `data/validation-prompts.json`.

## Sensitive Areas

1. **`anatomyParser.ts`** — Regex changes affect detection accuracy; always run `npm run test:prompts`
2. **`scorer.ts`** — Weight/dimension changes impact all scores
3. **`patterns/`** — Must maintain consistency across all 3 languages
4. **`i18n.ts`** — New UI text requires adding keys for all languages
5. **`ComponentsChecklist.tsx` + `ScoreCard.tsx`** — These components intentionally have no card wrapper. The shared card is in `App.tsx`.

## Demo Prompt

`App.tsx` initializes `useState` with a pre-crafted prompt designed to score **B grade** and demonstrate all major components visually. The prompt uses `## Section` headers, numbered lists, and explicit keywords to match the anatomy parser patterns (e.g., `Target audience:` for audience, `Tone:` for tone, `Do not include` for negative_constraint, `## Output Format` for format).

When editing the default prompt, always verify the grade is A or B by running the analysis before committing.

## Deployment

Static app deployed to Cloudflare Pages (auto via `.github/workflows/deploy.yml` on push to main), Netlify (`netlify.toml`), or Vercel (`vercel.json`). All configs include SPA redirect.

---

## Project Status

- **Classificação:** PARQUE
- **Objetivo:** Analisador de anatomia de prompts — detecta 9 componentes estruturais, calcula scores em 8 dimensões, oferece otimização via LLM. App client-side estática deployada no Cloudflare Pages.
- **Próximas 3 ações:** N/A — projeto em modo de manutenção passiva. Sem foco ativo.
- **Decisões recentes:** Deployed e funcionando. App totalmente client-side (sem backend). Deploy automático via GitHub Actions em push para `main`. Zero manutenção necessária no momento.
- **Última revisão:** 2026-03-29
