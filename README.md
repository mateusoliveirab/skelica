# Skelica — Prompt Anatomy & Optimizer

Skelica dissects your AI prompts to reveal what's strong and what needs sharpening. It analyzes prompt structure, calculates quality scores, and suggests improvements — helping you write prompts that get better results.

## What It Does

Paste any prompt and Skelica will:

1. **Analyze Anatomy** — Detect structural components like role, context, instructions, constraints, examples, and output format
2. **Score Quality** — Get a multi-dimensional quality score (clarity, specificity, completeness, structure, actionability)
3. **Highlight Components** — See your prompt with color-coded annotations showing each detected element
4. **Suggest Improvements** — Receive actionable recommendations for missing or weak components
5. **Optimize Prompts** — Generate an improved version of your prompt using LLM integration

## Features

- **Real-time Anatomy Detection** — Pattern-based component detection in English, Portuguese, and Spanish
- **Visual Highlighting** — Color-coded prompt visualization showing detected components
- **Quality Scoring** — Weighted scoring across 8 dimensions with letter grades (A+ to F)
- **Component Checklist** — Visual grid showing present/missing components
- **Prompt Optimization** — AI-powered prompt enhancement via OpenAI or Anthropic
- **Professional Templates** — Pre-built templates for coding, analysis, writing, and business tasks
- **Client-Side Processing** — Fast, privacy-focused analysis runs entirely in your browser

## Tech Stack

- **React 19** with **TypeScript**
- **Vite 7** for fast development and optimized builds
- **Tailwind CSS 4** for styling
- **Framer Motion** for smooth animations
- **OpenAI** & **Anthropic** SDK for LLM integration
- Regex-based pattern matching for fast, cost-free analysis

## Project Structure

```
skelica/
├── .github/
│   └── workflows/
│       ├── deploy.yml     # Deploy to Cloudflare Pages on push to main
│       ├── iac.yml        # Terraform IaC (manual trigger)
│       └── e2e.yml        # Browser E2E gate on PRs
├── docs/                  # Project documentation
│   ├── design/            # Design briefs
│   ├── project/           # Status and planning
│   ├── testing/           # Test cases and validation datasets
│   ├── translation/       # i18n governance
│   └── frontend/          # Frontend specs
├── frontend/
│   ├── src/
│   │   ├── App.tsx               # Main application
│   │   ├── components/
│   │   │   ├── PromptInput.tsx   # Text input with actions
│   │   │   ├── AnatomyView.tsx   # Highlighted prompt display
│   │   │   ├── ScoreCard.tsx     # Quality score visualization
│   │   │   └── ComponentsChecklist.tsx  # Component grid
│   │   ├── core/
│   │   │   ├── anatomyParser.ts  # Prompt anatomy detection
│   │   │   ├── scorer.ts         # Quality scoring engine
│   │   │   └── patterns.ts       # Multilingual pattern loading
│   │   ├── llm/
│   │   │   ├── openaiClient.ts   # OpenAI integration
│   │   │   ├── anthropicClient.ts # Anthropic integration
│   │   │   └── factory.ts        # LLM client factory
│   │   └── hooks/
│   │       └── usePromptAnalysis.ts  # Analysis orchestration
│   └── package.json
├── iac/                   # Terraform — Cloudflare Pages project
├── scripts/
│   └── e2e.sh             # Browser E2E script (agent-browser)
└── glossary/              # Multilingual term glossary
```

## Quick Start

### Prerequisites
- Node.js 18+
- (Optional) OpenAI API key for prompt optimization
- (Optional) Anthropic API key for Claude integration

### Setup

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

### Access the Application

- **Application**: http://localhost:5173

### Configure API Keys (Optional)

For prompt optimization features, you can configure API keys in two ways:

**Option 1: Via Environment File (not needed for static deployment)**
```bash
# Copy the example file
cp .env.example .env
# Edit .env and add your API keys
```

**Option 2: Via UI Settings (Recommended)**
1. Click the settings icon in the application
2. Enter your OpenAI API key and/or Anthropic API key
3. Keys are stored securely in your browser's localStorage
4. Keys are never sent to any server except OpenAI/Anthropic directly

## Deployment

Deployed to **Cloudflare Pages** at https://skelica.pages.dev via GitHub Actions.

Push to `main` with changes in `frontend/**` triggers `deploy.yml` automatically.

Required GitHub secrets: `CLOUDFLARE_API_TOKEN` (Pages:Edit), `CLOUDFLARE_ACCOUNT_ID`.

IaC for the Cloudflare Pages project lives in `iac/` and is managed via `iac.yml` (manual trigger).

## Prompt Components Detected

| Component | Description | Example |
|-----------|-------------|---------|
| **Role** | Who the AI should act as | "You are a senior software engineer..." |
| **Context** | Background information | "Given that we're building a healthcare app..." |
| **Instruction** | The main task | "Write a function that sorts a list..." |
| **Constraint** | Limitations and rules | "Do not use external libraries..." |
| **Example** | Sample inputs/outputs | "Example: [1,3,2] → [1,2,3]" |
| **Output Format** | Expected structure | "Output as JSON with keys: name, age" |
| **Audience** | Target readers | "Written for beginner developers" |
| **Tone** | Communication style | "Use a friendly, conversational tone" |

## Quality Dimensions

Scores are calculated across these dimensions:

- **Clarity** — How clear and unambiguous is the prompt?
- **Specificity** — How specific are the requirements?
- **Completeness** — Does it have all necessary components?
- **Structure** — Is it well-organized with sections/lists?
- **Effectiveness** — How well does it guide the AI?
- **Actionability** — Are there clear action verbs?
- **Accuracy** — Is the task well-defined?
- **Relevance** — Does it stay focused on the goal?

## Multilingual Support

Skelica detects prompt components in:
- **English** (en)
- **Portuguese** (pt)
- **Spanish** (es)

Language is auto-detected based on prompt content, with English as fallback.

## Development

### Run Tests

```bash
cd frontend
npm test                          # Vitest unit tests (watch)
npm run test:prompts              # Regression: core tier (11 prompts)
TEST_TIER=full npm run test:prompts  # Regression: full tier (26 prompts)
npm run test:e2e                  # Browser E2E via agent-browser (needs app running)
```

Browser E2E against production:
```bash
bash scripts/e2e.sh https://skelica.pages.dev
```

See [docs/testing/regression-prompts.md](./docs/testing/regression-prompts.md) for regression details.

### Build for Production

```bash
cd frontend && npm run build
# Output: frontend/dist/
```

## Documentation

Toda a documentação está organizada em [`docs/`](./docs/). Ver [docs/README.md](./docs/README.md) para o índice completo.

## Status

See [docs/project/status.md](./docs/project/status.md) for current development status and known issues.

## License

MIT
