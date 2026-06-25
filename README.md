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
├── docs/                  # Documentação do projeto
│   ├── design/            # Briefs de design
│   ├── migration/         # Migrações
│   ├── project/           # Status e planejamento
│   ├── testing/           # Casos de teste e validação
│   ├── translation/       # Governança de tradução
│   ├── api/               # Documentação de APIs
│   └── frontend/          # Especificações do frontend
└── frontend/
    ├── src/
    │   ├── App.tsx               # Main application
    │   ├── components/
    │   │   ├── PromptInput.tsx   # Text input with actions
    │   │   ├── AnatomyView.tsx   # Highlighted prompt display
    │   │   ├── ScoreCard.tsx     # Quality score visualization
    │   │   └── ComponentsChecklist.tsx  # Component grid
    │   ├── core/
    │   │   ├── anatomyParser.ts  # Prompt anatomy detection
    │   │   ├── scorer.ts         # Quality scoring engine
    │   │   └── patterns.ts       # Multilingual pattern loading
    │   ├── llm/
    │   │   ├── openaiClient.ts   # OpenAI integration
    │   │   ├── anthropicClient.ts # Anthropic integration
    │   │   └── factory.ts        # LLM client factory
    │   ├── hooks/
    │   │   └── usePromptAnalysis.ts  # Analysis state management
    │   ├── data/
    │   │   ├── templates.ts      # Prompt templates
    │   │   └── components.ts     # Component information
    │   └── api/
    │       └── types.ts          # TypeScript types
    └── package.json
```

## Quick Start

### Prerequisites
- Node.js 18+
- (Optional) OpenAI API key for prompt optimization
- (Optional) Anthropic API key for Claude integration

### Setup

```bash
cd skelica/frontend

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

Skelica is a static web application that can be deployed to any static hosting service:

### Vercel

```bash
npm run build
vercel deploy
```

### Netlify

```bash
npm run build
netlify deploy --prod
```

### GitHub Pages

Push to your repository and the GitHub Actions workflow will automatically deploy.

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
cd skelica/frontend
npm test
```

### Run Prompt Validation Tests

Regression tests for prompt analysis (component detection + scoring):

```bash
cd skelica/frontend
npm run test:prompts
```

See [docs/testing/regression-prompts.md](./docs/testing/regression-prompts.md) for details.

### Build for Production

```bash
cd skelica/frontend
npm run build
```

The build output will be in `frontend/dist/` and can be deployed to any static hosting service.

## Documentation

Toda a documentação está organizada em [`docs/`](./docs/). Ver [docs/README.md](./docs/README.md) para o índice completo.

## Status

See [docs/project/status.md](./docs/project/status.md) for current development status and known issues.

## License

MIT
