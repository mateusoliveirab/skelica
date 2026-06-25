# Skelica — Frontend

Prompt optimizer and analyzer. Client-side React application.

---

## Running Locally

```bash
cd skelica/frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Stack

- **React 19** — UI framework
- **Vite 7** — Build tool and dev server
- **TypeScript** — Type safety
- **Tailwind CSS 4** — Styling
- **Framer Motion** — Animations
- **React Query** — Async state management
- **OpenAI SDK** — GPT optimization
- **Anthropic SDK** — Claude optimization

---

## Environment Variables

Create `.env` in `skelica/frontend/`:

```env
VITE_OPENAI_API_KEY="sk-..."
VITE_ANTHROPIC_API_KEY="sk-ant-..."
```

API keys are stored in localStorage via the Settings panel. They are sent directly to OpenAI/Anthropic — no backend proxy.

---

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (port 5173) |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run test` | Run Vitest tests |
| `npm run test:prompts` | Run prompt validation tests |
| `npm run lint` | ESLint check |
| `npm run i18n:ci` | Check i18n strings |

---

## Project Structure

```
frontend/
├── src/
│   ├── App.tsx              # Main app
│   ├── main.tsx             # Entry point
│   ├── i18n.ts              # Internationalization
│   ├── components/          # UI components
│   │   ├── PromptInput.tsx
│   │   ├── AnatomyView.tsx
│   │   ├── ScoreCard.tsx
│   │   ├── ComponentsChecklist.tsx
│   │   ├── AIButtons.tsx
│   │   ├── SettingsPanel.tsx
│   │   └── Logo.tsx
│   ├── pages/
│   │   ├── AboutPage.tsx
│   │   └── PromptLinkGenerator.tsx
│   ├── core/                # Analysis engine
│   │   ├── anatomyParser.ts
│   │   ├── scorer.ts
│   │   └── patterns/
│   ├── llm/                 # LLM clients
│   │   ├── openaiClient.ts
│   │   ├── anthropicClient.ts
│   │   └── factory.ts
│   ├── hooks/
│   │   └── usePromptAnalysis.ts
│   └── config/
│       └── settings.ts
├── public/
└── package.json
```

---

## Features

- **Prompt Analysis** — Detects structural components (role, context, instruction, etc.)
- **Quality Scoring** — Scores prompts on clarity, specificity, completeness, etc.
- **AI Optimization** — Optimize prompts via GPT-4o or Claude
- **Multi-language** — Supports English, Portuguese, Spanish

---

## Documentation

- [Skelica Docs](../docs/README.md) — Full documentation index
- [Skelica AGENTS.md](../AGENTS.md) — Agent guidance
