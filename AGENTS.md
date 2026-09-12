# AGENTS.md — Skelica

Orientações para agentes de IA trabalhando no projeto Skelica.

---

## Visão Geral

**Skelica** é um analisador de anatomia de prompts de IA: detecta componentes estruturais (role, contexto, instruções, etc.), calcula scores de qualidade e sugere melhorias. A análise tem dois passes — regex multilíngue (instantâneo) e embeddings multilíngues (carregado em background, depois autoritativo). O handoff do prompt anotado para ChatGPT/Claude é o caminho de correção; a otimização via LLM existe em `llm/` mas não está ligada à UI.

**Arquitetura:** aplicação web estática, totalmente client-side. Toda análise e scoring ocorre no navegador; não há backend.

---

## Stack Técnico

| Tecnologia | Propósito |
|------------|-----------|
| **React 19** | UI framework |
| **TypeScript** | Tipagem |
| **Vite 7** | Build e dev server |
| **Tailwind CSS 4** | Estilos e tema escuro |
| **Framer Motion** | Animações |
| **Transformers.js** | Embeddings multilíngues no navegador |
| **OpenAI / Anthropic SDK** | Otimização via LLM (código existe, não ligado à UI) |
| **React Query** | Estado assíncrono |
| **Lucide React** | Ícones |

---

## Estrutura do Projeto

```
skelica/
├── frontend/                 # App React
│   ├── src/
│   │   ├── App.tsx           # App principal
│   │   ├── main.tsx
│   │   ├── i18n.ts           # Internacionalização (en/pt/es)
│   │   ├── components/       # Componentes UI
│   │   │   ├── PromptInput.tsx
│   │   │   ├── AnatomyView.tsx
│   │   │   ├── ScoreCard.tsx
│   │   │   ├── ComponentsChecklist.tsx
│   │   │   ├── AIButtons.tsx
│   │   │   ├── SettingsPanel.tsx
│   │   │   └── Logo.tsx
│   │   ├── pages/
│   │   │   └── AboutPage.tsx
│   │   ├── analytics/        # Instrumentação de funil (no-op sem provider)
│   │   ├── core/             # Motor de análise
│   │   │   ├── anatomyParser.ts   # Detecção (regex + autoridade semântica)
│   │   │   ├── scorer.ts          # Scoring de qualidade (agnóstico de idioma)
│   │   │   ├── segmentation.ts    # Fonte única de segmentação de frases
│   │   │   ├── semanticClassifier.ts + worker.ts  # Embeddings multilíngues
│   │   │   ├── patterns.ts        # Carregamento de padrões
│   │   │   └── patterns/          # Regex por idioma (en, pt, es)
│   │   ├── llm/              # Clientes LLM
│   │   │   ├── openaiClient.ts
│   │   │   ├── anthropicClient.ts
│   │   │   ├── factory.ts
│   │   │   └── index.ts
│   │   ├── hooks/
│   │   │   └── usePromptAnalysis.ts
│   │   ├── adapters/         # Adaptadores de tipos (anatomy, score)
│   │   ├── config/
│   │   │   └── settings.ts   # localStorage para API keys
│   │   ├── data/
│   │   │   ├── components.ts # Info de componentes
│   │   │   ├── constants.ts
│   │   │   ├── templates.ts  # Templates profissionais (ainda sem consumidor)
│   │   │   └── validation-prompts.json  # Dataset dourado (83 prompts)
│   │   └── api/
│   │       └── types.ts      # Tipos TypeScript
│   ├── public/icons/
│   ├── package.json
│   ├── vite.config.ts
│   └── vitest.config.ts
├── docs/                     # Documentação
│   ├── design/               # Briefs de design
│   ├── migration/            # Migrações
│   ├── project/              # Status e planejamento
│   ├── testing/              # Casos de teste e validação
│   ├── translation/          # Governança de tradução
│   ├── api/                  # Documentação de APIs
│   └── frontend/             # Especificações do frontend
├── scripts/                  # Utilitários (calibração, validação)
├── glossary/                 # Glossários de tradução
├── .github/workflows/        # CI/CD (deploy)
└── README.md
```

---

## Convenções

- **Nomes:** lowercase para arquivos, pastas e identificadores
- **Padrões:** seguir padrões existentes em cada módulo
- **i18n:** usar `t('key')` do `i18n.ts` para textos de UI; não hardcodar strings

---

## Comandos

| Comando | Local | Descrição |
|---------|-------|-----------|
| `npm install` | `frontend/` | Instalar dependências |
| `npm run dev` | `frontend/` | Dev server em http://localhost:5173 |
| `npm run build` | `frontend/` | Build de produção → `dist/` |
| `npm run preview` | `frontend/` | Preview do build |
| `npm test` | `frontend/` | Testes Vitest |
| `npm run test:prompts` | `frontend/` | Testes de validação de prompts |
| `npm run i18n:ci` | `frontend/` | Checagem de i18n |
| `npm run lint` | `frontend/` | ESLint |

---

## Componentes de Prompt Detectados

| Componente | Descrição |
|------------|-----------|
| **Role** | Papel do modelo (ex.: "You are a senior engineer") |
| **Context** | Informação de fundo |
| **Instruction** | Tarefa principal |
| **Constraint** | Regras e limitações |
| **Example** | Exemplos de input/output |
| **Output Format** | Formato esperado da saída |
| **Audience** | Público-alvo |
| **Tone** | Tom de comunicação |

---

## Dimensões de Qualidade (Scoring)

- **Clarity** — Clareza e não ambiguidade
- **Specificity** — Requisitos específicos
- **Completeness** — Componentes necessários presentes
- **Structure** — Organização com seções/listas
- **Effectiveness** — Capacidade de guiar o modelo
- **Actionability** — Verbos de ação claros
- **Accuracy** — Tarefa bem definida
- **Relevance** — Foco no objetivo

---

## Idiomas Suportados

- **English (en)**
- **Portuguese (pt)**
- **Spanish (es)**

Idioma detectado automaticamente pelo conteúdo do prompt.

---

## API Keys e Configurações

- API keys (OpenAI, Anthropic) são configuradas pelo usuário na UI (Settings).
- Armazenadas em `localStorage`.
- Enviadas apenas para os provedores de LLM (cliente → OpenAI/Anthropic).
- Não há backend; chaves nunca passam por servidor próprio.

---

## Testes

- **Vitest** para testes unitários.
- `validation-prompts.test.ts` valida detecção de componentes e scoring.
- Dados de validação em `frontend/src/data/validation-prompts.json`.
- Docs: [docs/testing/regression-prompts.md](./docs/testing/regression-prompts.md) e [docs/testing/validation-dataset.md](./docs/testing/validation-dataset.md).

---

## Deploy

App estático, hospedado em **Cloudflare Pages** (`https://skelica.pages.dev`).

⚠️ **Projeto em parque:** os deploys automáticos estão desligados (só `workflow_dispatch`).
Não há `vercel.json` nem `netlify.toml` neste repositório. Para congelar ou apagar a
infraestrutura, ver [`docs/project/decommission-infra.md`](./docs/project/decommission-infra.md).

---

## Pontos de Atenção ao Editar

1. **`anatomyParser.ts`** — Mudanças em regex afetam detecção; rodar `npm run test:prompts` **e** `TEST_TIER=full npm run test:prompts` (o tier core já deixou passar regressões que o full pegou).
2. **`scorer.ts`** — Pesos e dimensões impactam scores. As dimensões leem presença de componente do parser (`_presence`), nunca de listas de palavras em inglês — é isso que mantém o score justo entre idiomas.
3. **`patterns/`** — Manter consistência entre en/pt/es. `no-useless-escape` está desligado nesses arquivos de propósito: remover a barra de `[:\-—]` transforma em *faixa* de `:` até `—`.
4. **Limiares semânticos** (`SEMANTIC_FILL`/`SEMANTIC_OVERRIDE` em `anatomyParser.ts`) — decidem quando o modelo pode contradizer o regex.
5. **`i18n.ts`** — Adicionar chaves novas quando alterar textos.
6. **Dataset** — Recalibrar apenas com `npx tsx scripts/calibrate-validation-prompts.ts --apply`, nunca para esconder um defeito.

---

## Documentação Relacionada

- [README.md](./README.md) — Introdução e quick start
- [docs/README.md](./docs/README.md) — Índice da documentação
- [docs/project/decision-parked.md](./docs/project/decision-parked.md) — Por que o projeto parou e o que justificaria reabrir
- [docs/project/decommission-infra.md](./docs/project/decommission-infra.md) — Como congelar/desligar a infraestrutura e revogar credenciais
- [docs/project/status.md](./docs/project/status.md) — O que existe hoje (estado verificado)
- [docs/migration/complete.md](./docs/migration/complete.md) — Migração para arquitetura client-side
- [docs/testing/regression-prompts.md](./docs/testing/regression-prompts.md) — Regressão e prompts de validação
