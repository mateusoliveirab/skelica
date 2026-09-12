# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Skelica** is a prompt anatomy analyzer. It detects 9 structural components in AI prompts (role, context, instruction, constraint, negative_constraint, example, output format, audience, tone) and calculates quality scores across 8 dimensions.

**Architecture:** Fully client-side static web app — no backend. Analysis runs in two passes: multilingual **regex** (instant, free) and **multilingual embeddings** (loads in the background, then becomes authoritative). Scoring runs in the browser. Nothing is sent anywhere.

## Commands

All commands run from `frontend/`:

```bash
npm run dev              # Vite dev server → http://localhost:5173
npm run build            # TypeScript check + Vite production build → dist/
npm test                 # Vitest (watch mode)
npm run test:prompts     # Regression tests — core tier (11 prompts)
npm run test:e2e         # Browser E2E via agent-browser (requires app running)
npm run lint             # ESLint
npm run i18n:ci          # i18n key validation
npm run preview          # Preview production build → http://localhost:4173
```

For full regression suite: `TEST_TIER=full npm run test:prompts`

E2E against a local preview: `bash scripts/e2e.sh http://localhost:4173` (there is no production URL anymore — see Deployment)

## Architecture

### Analysis Pipeline

```
User Input → usePromptAnalysis hook
  → Pass 1: AnatomyParser.parse()            (regex, all 3 languages, instant)
  → Scorer.score() → UI renders              (the user sees a result here)
  → Pass 2 (background): embeddings load → classifyComponents() per sentence
  → AnatomyParser.parse(text, semanticMap)   (semantic overrides regex)
  → Scorer.score() → UI updates
  → Adapters bridge core types → API types
```

### Key Modules

- **`core/anatomyParser.ts`** — Component detection via multilingual regex. Handles overlap resolution by priority and containment rules. Changes here require running `test:prompts`.
- **`core/scorer.ts`** — Weighted scoring across 8 dimensions (clarity 15%, specificity 12%, completeness 15%, structure 10%, effectiveness 12%, actionability 12%, accuracy 12%, relevance 12%). Includes anti-pattern detection and grade calculation (A+ to F).
- **`core/patterns.ts` + `patterns/`** — PatternLoader manages language-specific regex (en/pt/es). Patterns are pre-compiled and cached. **All three sets are collected for every prompt** and overlaps resolved once, with the detected language only breaking ties — so a language misdetection cannot change which components are found (locked by `engine-invariants.test.ts`).
- **`core/segmentation.ts`** — the single sentence-splitting source (`Intl.Segmenter`), shared by the semantic pass and the parser. Producer and consumer must use it or lookups silently miss.
- **`core/semanticClassifier.ts` + `core/worker.ts`** — multilingual embeddings + exemplar centroids. Loads in the **background** after the first result and is then the **authoritative** detector, able to override the regex (see `semantic-authority.test.ts`).
- **`llm/factory.ts`** — Factory pattern for LLM clients. SDKs are code-split into separate chunks via Vite.
- **`hooks/usePromptAnalysis.ts`** — Owns both passes: instant regex result, background model warm-up (`warmUp()`), then the semantic refinement. A failure in the semantic layer must never break `analyze()`.
- **`adapters/`** — Bridge between core types (`AnatomyResult`, `ScoreResult`) and legacy API types (`AnalyzeResponse`, `ScoreResponse`).
- **`config/settings.ts`** — localStorage-based settings store for API keys.
- **`data/validation-prompts.json`** — Golden test dataset: **83** multilingual prompts (11 core / 72 full) with per-prompt `expected` component presence and a calibrated `scoreRange`. Re-baseline ranges only with `scripts/calibrate-validation-prompts.ts --apply`, never to hide a defect.

### LLM integration — implemented but NOT wired to the UI

`llm/` contains working OpenAI and Anthropic clients (`optimizePrompt`) with tests. Nothing in the UI calls them, so the Settings panel collects API keys that are currently unused. Do not describe prompt *rewriting* as a shipped feature until it is reachable. The shipped "fix it" path is `AIButtons.tsx`, which hands the annotated prompt to ChatGPT/Claude.

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

## E2E Testing

Browser smoke tests live in `scripts/e2e.sh` and use `agent-browser` CLI.

Key `data-testid` attributes (do not rename without updating `e2e.sh`):
- `prompt-input` — main textarea
- `analyze-button` — Analyze button
- `grade` — score letter in ScoreCard
- `anatomy-view` — AnatomyView root
- `components-checklist` — ComponentsChecklist root

CI layers — **all three workflows are `workflow_dispatch` only** (auto triggers were removed when
the project was parked):
- **`e2e.yml`** — browser smoke against `vite preview` or a given URL
- **`deploy.yml`** — build + `wrangler pages deploy`, then a smoke job. **The Pages project was deleted on 2026-09-12**, so this cannot run until one is recreated
- **`iac.yml`** — Terraform plan. **The state is empty, so `destroy` removes nothing and `apply` will
  try to create a duplicate.** Do not use it to decommission; see `docs/project/decommission-infra.md`.

## Sensitive Areas

1. **`anatomyParser.ts`** — Regex changes affect detection accuracy; always run `npm run test:prompts`, and run `TEST_TIER=full npm run test:prompts` too: the core tier has missed real regressions that the full tier caught.
2. **`scorer.ts`** — Weight/dimension changes impact every score. Dimensions read component presence from the parser (`_presence`), never from English keyword lists — that is what keeps the score fair across languages.
3. **`patterns/`** — Must stay consistent across all 3 languages. `no-useless-escape` is disabled for these files on purpose: dropping the backslash in `[:\-—]` turns it into the *range* `:` to `—`.
4. **Semantic thresholds** (`SEMANTIC_FILL` / `SEMANTIC_OVERRIDE` in `anatomyParser.ts`) — these decide when the model may contradict the regex. Covered by `semantic-authority.test.ts`.
5. **`anatomyParser.generateEnhancedPrompt` / component aliases** — `negative_constraint` satisfies a `constraint` expectation in the dataset; a prohibition is a constraint.
6. **`i18n.ts`** — New UI text requires adding keys for all languages.
7. **`ComponentsChecklist.tsx` + `ScoreCard.tsx`** — These components intentionally have no card wrapper. The shared card is in `App.tsx`.

## Demo Prompt

`App.tsx` initializes `useState` with a pre-crafted prompt that grades **A-** and demonstrates all major components visually (it graded B while the completeness dimension was stuck at its floor — see the analysis-engine doc). The prompt uses `## Section` headers, numbered lists, and explicit keywords to match the anatomy parser patterns (e.g., `Target audience:` for audience, `Tone:` for tone, `Do not include` for negative_constraint, `## Output Format` for format).

When editing the default prompt, always verify the grade is A or B by running the analysis before committing.

## Deployment

**Decommissioned.** The static app was deployed to Cloudflare Pages at `skelica.pages.dev`; that project was **deleted on 2026-09-12** and the URL now returns HTTP 530. The repo is parked with deploys manual-only. To publish again, follow the rollback in `docs/project/decommission-infra.md` §6. There is no `vercel.json` or `netlify.toml` here, despite older docs claiming otherwise.

---

## Project Status

- **Classificação:** PARQUE
- **Objetivo:** Analisador de anatomia de prompts — detecta 9 componentes estruturais (regex multilíngue + embeddings como autoridade), calcula scores em 8 dimensões, e faz handoff do prompt anotado para ChatGPT/Claude. App client-side estática; o projeto do Cloudflare Pages foi **apagado em 2026-09-12**. Otimização por LLM existe em `llm/` mas não está ligada à UI.
- **Próximas ações:** **nenhuma.** Projeto em parque e infraestrutura descomissionada. Só reabrir se uma condição falsificável de `docs/project/decision-parked.md` §4 se cumprir. **Pendência única: revogar as credenciais** (`decommission-infra.md` §5), incluindo a `ANTHROPIC_API_KEY`.
- **Decisões recentes:** Motor reescrito para ser invariante de idioma (união dos 3 conjuntos de padrões); scorer tornado agnóstico de idioma (viés PT↔EN de 0,248 → 0,077); Fase 2 concluída (semântico autoritativo, carregado em background); dataset corrigido e recalibrado; ESLint destravado e limpo. Ver `docs/project/analysis-engine-architecture.md`.
- **Última revisão:** 2026-09-12
