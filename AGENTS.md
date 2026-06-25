# AGENTS.md — Skelica

Orientações para agentes de IA trabalhando no projeto Skelica.

---

## Visão Geral

**Skelica** é um otimizador de prompts que analisa a anatomia de prompts de IA, calcula scores de qualidade e sugere melhorias. Permite detectar componentes estruturais (role, contexto, instruções, etc.) e otimizar prompts via LLM (OpenAI/Anthropic).

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
| **OpenAI SDK** | Otimização via GPT-4o |
| **Anthropic SDK** | Otimização via Claude |
| **React Query** | Estado assíncrono/LLM |
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
│   │   │   ├── AboutPage.tsx
│   │   │   └── PromptLinkGenerator.tsx
│   │   ├── core/             # Motor de análise
│   │   │   ├── anatomyParser.ts   # Detecção de componentes
│   │   │   ├── scorer.ts          # Scoring de qualidade
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
│   │   │   ├── templates.ts  # Templates profissionais
│   │   │   └── constants.ts
│   │   ├── utils/
│   │   │   ├── memoize.ts
│   │   │   └── performance.ts
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

App estático; pode ser hospedado em:

- **Vercel** — `vercel deploy`
- **Netlify** — `netlify deploy --prod`
- **GitHub Pages** — deploy automático via Actions (`.github/workflows/deploy.yml`)

---

## Pontos de Atenção ao Editar

1. **`anatomyParser.ts`** — Mudanças em regex afetam detecção; rodar `npm run test:prompts`.
2. **`scorer.ts`** — Pesos e dimensões impactam scores.
3. **`patterns/`** — Padrões por idioma; manter consistência entre en/pt/es.
4. **`i18n.ts`** — Adicionar chaves novas quando alterar textos.
5. **LLM** — SDKs carregados dinamicamente (code splitting) para reduzir bundle.

---

## Documentação Relacionada

- [README.md](./README.md) — Introdução e quick start
- [docs/README.md](./docs/README.md) — Índice da documentação
- [docs/project/status.md](./docs/project/status.md) — Status atual e próximos passos
- [docs/migration/complete.md](./docs/migration/complete.md) — Migração para arquitetura client-side
- [docs/testing/regression-prompts.md](./docs/testing/regression-prompts.md) — Regressão e prompts de validação
