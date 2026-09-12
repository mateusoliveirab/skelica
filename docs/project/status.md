# Skelica — Status

**Última atualização:** 2026-09-12
**Classificação:** PARQUE — no ar, funcional, sem desenvolvimento ativo.

> **Leia primeiro:** [`decision-parked.md`](./decision-parked.md) — por que o desenvolvimento parou e quais condições falsificáveis justificariam reabrir. Este documento descreve apenas **o que existe hoje**.

---

## O que o produto faz

Análise de anatomia de prompts de IA, em dois passes:

1. **Regex multilíngue** (instantâneo, offline, custo zero) — detecta 9 componentes estruturais e calcula score em 8 dimensões.
2. **Embeddings multilíngues** (carregados em background após o primeiro resultado) — passam a ser o detector **autoritativo** e podem corrigir o regex.

Depois do diagnóstico, o usuário pode enviar o prompt anotado para ChatGPT ou Claude com os componentes ausentes explicitados (`AIButtons.tsx`).

**Não existe:** contas, pagamento, backend, histórico, e nenhuma otimização por LLM ligada à UI (`llm/` tem clientes funcionais, mas nenhum chamador).

---

## Estado técnico (verificado em 2026-09-12)

| Verificação | Comando | Resultado |
|---|---|---|
| Testes | `cd frontend && npx vitest run` | **416/416** |
| Tier completo de validação | `TEST_TIER=full npx vitest run src/__tests__/validation-prompts.test.ts` | **167/167** |
| Tipos + build | `cd frontend && npm run build` | ✅ |
| Lint | `cd frontend && npm run lint` | **limpo** |

### Arquitetura

Aplicação web estática, 100% client-side, sem backend. Deploy no Cloudflare Pages com custo de infraestrutura ~R$ 0 (a banda do modelo é do usuário).

```
prompt
  │
  ├─ 1. REGEX (todos os 3 idiomas, união, idioma só desempata)   → instantâneo
  ├─ 2. SCORE (8 dimensões, presença vinda do parser)            → instantâneo
  ├─ 3. EMBEDDINGS (background, ~140 MiB uma vez, em cache)      → refina
  └─ 4. HANDOFF para ChatGPT/Claude                              → ação
```

Detalhes e justificativas: [`analysis-engine-architecture.md`](./analysis-engine-architecture.md).

### Propriedades garantidas por teste

| Propriedade | Teste |
|---|---|
| Idioma detectado não altera os componentes encontrados | `engine-invariants.test.ts` |
| Prompt com estrutura nunca retorna zero componentes | `engine-invariants.test.ts` |
| Inglês comum nunca é lido como PT/ES | `engine-invariants.test.ts` |
| Viés de score PT↔EN ≤ 0,12 (medido 0,077) | `engine-invariants.test.ts` |
| Quando o semântico pode contradizer o regex | `semantic-authority.test.ts` |
| Dataset dourado: 83 prompts, detecção + faixa de score | `validation-prompts.test.ts` |

---

## Componentes detectados (9)

| Componente | Descrição |
|------------|-----------|
| `role` | Papel/persona atribuído à IA |
| `context` | Informação de fundo |
| `instruction` | Tarefa principal |
| `constraint` | Regras e limites positivos |
| `negative_constraint` | Proibições ("Não use X") |
| `example` | Exemplos de entrada/saída |
| `format` | Formato esperado da saída |
| `audience` | Público-alvo |
| `tone` | Tom e estilo |

## Dimensões de score (8)

Clarity 15% · Specificity 12% · Completeness 15% · Structure 10% · Effectiveness 12% · Actionability 12% · Accuracy 12% · Relevance 12%

Notas: **A+** ≥95 → **A** ≥90 → **B** ≥75 → **C** ≥60 → **D** ≥40 → **F** <40.
As dimensões derivam presença de componente do parser, **nunca de listas de palavras em inglês** — é isso que mantém o score justo entre idiomas.

---

## Idiomas

Conteúdo em **inglês, português e espanhol** (detecção automática; os três conjuntos de padrões valem para qualquer prompt).
A **interface está só em inglês** — `i18n.ts` tem um único dicionário `EN`. O suporte multilíngue é do conteúdo, não da UI.

---

## Limitações conhecidas (honestas, não maquiadas)

1. **A premissa central não foi validada.** Nada prova que nota alta → resposta melhor da IA. O dataset é calibrado contra o comportamento da própria ferramenta, não contra qualidade real. Este é o item nº 1 de `decision-parked.md` §4.
2. **Download de ~140 MiB** no primeiro uso do passe semântico (modelo 112,8 + tokenizer 16,3 + sentencepiece 4,8 + WASM 5,8 MiB). Fica fora do caminho crítico e é uma vez por navegador, mas existe. Um modelo só pt/en/es com vocabulário de ~50k tokens o cortaria para ~49 MiB (2,9×) ao custo de treinar modelo próprio. **Não** há ganho por quantização: `q4` é 380 MiB, maior que o `int8` atual.
3. **A otimização por LLM está desligada.** O painel de Settings coleta chaves de API que hoje não são usadas por ninguém.
4. **Sem contas, sem histórico, sem métrica de retenção.** Portanto não há dado de uso — a instrumentação de funil existe (`src/analytics/`) mas é no-op até um provedor ser configurado (`.env.example`).
5. **Sem página indexável além da raiz.** `meta description` e Open Graph passaram a existir nesta sessão, mas não há páginas por intenção de busca.

---

## Como rodar

```bash
cd frontend
npm install
npm run dev      # http://localhost:5173
```

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Dev server |
| `npm run build` | Checagem de tipos + build → `dist/` |
| `npm test` | Vitest (watch) |
| `npm run test:prompts` | Regressão — tier core (11 prompts) |
| `TEST_TIER=full npm run test:prompts` | Regressão — tier completo (83 prompts) |
| `npm run test:e2e` | Smoke test no browser (precisa do app rodando) |
| `npm run lint` | ESLint |
| `npm run i18n:ci` | Validação de chaves i18n |

Aplicar recalibração do dataset (só após mudança **intencional** — ver aviso no próprio script):

```bash
npx tsx scripts/calibrate-validation-prompts.ts            # dry-run (padrão)
npx tsx scripts/calibrate-validation-prompts.ts --apply    # escreve
```

---

## Documentos relacionados

| Documento | Conteúdo |
|-----------|----------|
| [`decision-parked.md`](./decision-parked.md) | Por que parou e o que justificaria reabrir |
| [`analysis-engine-architecture.md`](./analysis-engine-architecture.md) | Arquitetura do motor, medições e migração restante |
| [`product-strategy.md`](./product-strategy.md) | ICPs, escada de valor, créditos vs chave própria, time |
| [`monetization-analysis.md`](./monetization-analysis.md) | Diagnóstico técnico original |
| [`../research/prompt-tooling-monetization-2026.md`](../research/prompt-tooling-monetization-2026.md) | Pesquisa de mercado com fontes |
