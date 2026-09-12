# Skelica — Diagnóstico Real e Direção para MRR com Lucro

**Data:** 2026-09-12
**Escopo:** auditoria do código em `frontend/` (não da documentação, que está desatualizada) + análise de mercado + direção recomendada.
**Método:** leitura do código, `npm run build`/`vitest`, inspeção do bundle em `frontend/dist/`, checagem do site em produção (`skelica.pages.dev`) e pesquisa de mercado.

---

## TL;DR (resumo executivo)

1. **O motor de diagnóstico é bom e original.** Regex multilíngue + classificador semântico por embeddings, com um dataset dourado de 83 prompts. Isso é ativo real.
2. **O "tratamento" não existe no produto.** Todo o código de otimização por LLM (~380 LOC + clientes testados) está **desligado da UI**. O app diagnostica e não corrige. **Diagnóstico sem correção não gera disposição a pagar.**
3. **Existe um muro de ~140 MB no caminho crítico.** O primeiro resultado só sai depois de baixar 23,6 MB de WASM + 118 MB de modelo. A maioria dos visitantes nunca vê um score. Sem consertar isso, nada mais importa.
4. **Distribuição é zero.** Sem `meta description`, sem Open Graph, sem `robots.txt`/`sitemap` reais (hoje são fallback do SPA, retornam HTML), sem analytics, UI só em inglês.
5. **O mercado de "otimizador de prompt" genérico é ruim para entrar de frente** — commoditizado pelos próprios provedores e ocupado por concorrentes financiados.
6. **A direção com chance real de lucro** não é "mais um score de prompt para devs": é **diagnóstico grátis como isca + correção/memória/equipe como plano pago**, num nicho com dor recorrente, distribuído onde o usuário já está (dentro do ChatGPT/Claude).

**Recomendação:** 3 fases. Semana 1 destrava funil e mede ativação. Semanas 2–4 provam demanda em **um** canal. Só depois ligar pagamento.

---

## Parte 1 — O que realmente temos

### 1.1 O fluxo que está vivo em produção

```
App.tsx (nav + hero + prompt demo + modal Settings)
  → PromptInput.tsx (colar/copiar/analisar)
  → usePromptAnalysis.ts
      → semanticClassifier.ts + worker.ts   (embeddings, hoje BLOQUEIA o resultado)
      → anatomyParser.ts                    (regex, 9 componentes)
      → scorer.ts                           (8 dimensões, nota A+–F)
  → adapters/                               (tipos → resposta da UI)
  → AnatomyView + ScoreCard + ComponentsChecklist
```

Fim do fluxo. **Não existe botão de corrigir.**

### 1.2 Os "agentes" que temos (inventário honesto)

| # | Agente / motor | Arquivo | LOC | Status real |
|---|----------------|---------|-----|-------------|
| 1 | **Detecção determinística (regex)** | `core/anatomyParser.ts` + `core/patterns/{english,portuguese,spanish}.ts` | ~742 + 662 | ✅ vivo, roda no caminho crítico |
| 2 | **Classificador semântico (embeddings)** | `core/semanticClassifier.ts` + `core/worker.ts` | 122 + 162 | ✅ vivo, mas baixa 118 MB e só *adiciona* componentes que o regex perdeu (gate cosine > 0.90) |
| 3 | **Scoring** | `core/scorer.ts` | ~885 | ✅ vivo, é a nota que o usuário vê |
| 4 | **Otimizador LLM (OpenAI)** | `llm/openaiClient.ts` | ~380 no módulo `llm/` | ❌ **código morto** — zero importadores fora de testes |
| 5 | **Otimizador LLM (Anthropic)** | `llm/anthropicClient.ts` + `llm/factory.ts` + `llm/schema.ts` | (idem) | ❌ **código morto** |
| 6 | **Handoff para ChatGPT/Claude** | `components/AIButtons.tsx` | 170 | ❌ **não montado em lugar nenhum** (commit `c4eef47` implementou e nunca ligou) |

Observação técnica importante para o agente #2: o modelo **não é MobileBERT** (a doc está velha). É `Xenova/multilingual-e5-small`, `dtype: 'q8'`, `device: 'auto'`. A ideia dos centroides por exemplares (3 frases por componente) é boa e é a parte mais defensável do projeto.

**Sobre os "agentes" de processo do repo** (AGENTS.md, CLAUDE.md, `.claude/adr/` com 5 ADRs, CI `deploy.yml`/`e2e.yml`/`iac.yml`, personas em `TASKS.md`): isso é governança de desenvolvimento, não ativo de receita. Vale manter, mas não monetiza.

### 1.3 Os ativos que realmente valem

| Ativo | Evidência | Por que importa para dinheiro |
|-------|-----------|-------------------------------|
| **Dataset dourado** | `data/validation-prompts.json` — 83 prompts rotulados (11 core / 72 full), cada um com presença esperada por componente + `scoreRange` | É a semente de um produto de **avaliação/regressão**, que é onde times pagam. É o ativo mais defensável. |
| Motor de análise maduro | `anatomyParser` + `scorer`, 3 idiomas | Base de produto, mas replicável |
| Classificador semântico | 3 idiomas × 9 componentes × 3 exemplares, ~96% nos probes de validação | Diferencial técnico legítimo vs. concorrentes só-regex |
| Suite de testes | 403 testes (14 arquivos) | Qualidade, mas **18 estão vermelhos** (ver abaixo) |
| Design system | Tailwind 4, dark theme, Framer Motion, tokens em `design-system.css` | Reduz custo de construir novas telas |
| Deploy grátis + CI | Cloudflare Pages + `iac/pages.tf` + GitHub Actions | Custo de infra ≈ R$0, margem bruta do diagnóstico = 100% |

### 1.4 As dívidas que impedem a monetização

| # | Problema | Evidência | Impacto no negócio |
|---|----------|-----------|--------------------|
| 1 | **Sem tratamento** | `optimizePrompt` só é chamado em `llm/__tests__/*`; `AIButtons` sem importadores | Não há o que cobrar. O usuário sai com uma nota e nada mais. |
| 2 | **Muro de ~140 MB antes do 1º resultado** | `usePromptAnalysis.ts:65` faz `await classifyComponents(...)` antes de pontuar; `worker.ts:15` baixa `model_quantized.onnx` = **118.308.185 bytes** (medido no header do HF); bundle contém `ort-wasm-simd-threaded.asyncify` = **23,6 MB** | Mata conversão de 100% dos visitantes frios. É o problema nº 1. |
| 3 | **SEO/navegabilidade zero** | `index.html` só tem `<title>`; sem `meta description`/OG. `curl /robots.txt` e `/sitemap.xml` retornam HTML do próprio SPA | A única aquisição realista de uma ferramenta grátis (busca orgânica) não existe |
| 4 | **Sem analytics** | grep de `gtag`/`posthog`/`plausible`/`umami` → 0 | Impossível saber se alguém usa, muito menos otimizar funil |
| 5 | **Sem contas/persistência** | Único storage é `localStorage['skelica_settings']`; sem IndexedDB | Sem histórico → sem retenção → sem motivo para assinar |
| 6 | **Testes vermelhos** | `npx vitest run` → 385/403; falhas em `validation-prompts.test.ts`, `anatomyParser.test.ts`, `e2e-analysis-flow.test.ts` (detecção de constraint/example + 3 faixas de score) | O produto **vende confiança no score**. Score que regride é fraude de produto. |
| 7 | **Código morto e docs mentindo** | README promete "Optimize Prompts"; `api/index.ts` (cliente REST sem backend), `data/templates.ts`, `pages/PromptLinkGenerator.tsx`, `utils/promptEnhancer.ts` — tudo sem uso | Custa tempo de onboarding e cria falsa sensação de progresso |
| 8 | **UI só em inglês** | `i18n.ts` tem só o dict `EN`; `setLocale()` é no-op | Desperdiça a vantagem natural no mercado PT-BR (padrões e dataset PT já existem) |
| 9 | **Modelo vem de CDN de terceiro** | `worker.ts` → `huggingface.co` em runtime | Sem controle de versão, sujeito a latência/disponibilidade externa; não se beneficia do cache da própria origem |

---

## Parte 2 — A pergunta difícil: isso dá dinheiro?

### 2.1 Por que "otimizador de prompt" é um mercado ruim para atacar de frente

- **É feature, não produto.** "Melhorar prompt" já vem embutido nos provedores e nas interfaces que o usuário já usa.
- **Disposição a pagar do consumidor é baixa.** Quem paga de verdade é *time* com dor de governança, avaliação e regressão — e esse comprador exige motion de vendas que um fundador solo não tem.
- **A faixa de baixo já está ocupada por conteúdo grátis.** Páginas de ferramentas como o próprio benchmark de preços que consultamos oferecem "Prompt Optimizer" de graça como isca de SEO. Score de prompt tende a preço zero.
- **A faixa de cima tem concorrentes financiados** (avaliação/observabilidade de LLM). Competir de frente ali é perder.

### 2.2 Onde existe dinheiro recorrente de verdade

| Segmento | Quem paga | Ticket realista | Cabe num solo? |
|----------|-----------|-----------------|----------------|
| **Prosumer/creator** | Usuário individual | US$ 5–15/mês | ✅ sim, mas churn alto e CAC só funciona via orgânico |
| **Time de produto de IA** | Dev/PM | US$ 20–50/usuário/mês | ⚠️ possível, exige eval/regressão de verdade |
| **Enterprise (governança/eval)** | Plataforma/segurança | US$ 10k+/ano | ❌ não, sem vendas enterprise |
| **Serviço (consultoria de prompt ops)** | Agência/empresa | R$ 2k–15k/projeto | ✅ caixa rápido, financia o produto — mas não é MRR |

**Conclusão:** para um solo, MRR com lucro só fecha combinando **orgânico (ferramenta grátis) + prosumer/time pequeno**, com **serviço** financiando o começo.

### 2.3 Unit economics — a parte boa

| Item | Custo | Comentário |
|------|-------|------------|
| Diagnóstico (regex + score) | **R$ 0** | Roda no browser; banda é do usuário |
| Modelo semântico | **R$ 0** para nós | Baixado do HF pelo browser do usuário |
| Otimização com chave do usuário (BYO key) | **R$ 0** | Margem 100%, mas **ninguém paga por isso** |
| Otimização com nossa chave — Claude Haiku 4.5 | ~**US$ 0,011**/chamada | Preços verificados: US$ 1/M input, US$ 5/M output, considerando ~600 tokens de entrada + teto de 2.000 de saída (`llm/openaiClient.ts`) |
| Otimização com nossa chave — Claude Sonnet 5 | ~**US$ 0,021**/chamada | US$ 2/M input, US$ 10/M output |

**Leitura:** um plano de US$ 9/mês com 200 otimizações em Haiku custa ~US$ 2,1 → **~77% de margem bruta**. A economia unitária **não é o problema**. O problema é funil e disposição a pagar.

> Fontes de preço: [BenchLM — Claude API Pricing, set/2026](https://benchlm.ai/anthropic/api-pricing). Verificar preços OpenAI antes de fixar o plano (o default do código é `gpt-4o`).

---

## Parte 3 — Direção recomendada

### Princípio central

> **Nunca cobre pelo diagnóstico. Cobre pela correção, pela memória e pela equipe.**

O diagnóstico é a isca mais barata que existe (custo marginal zero, client-side, instantâneo se tirarmos o modelo do caminho crítico). A cobrança vem de: (a) aplicar a correção sem trazer chave de API, (b) guardar/versionar/comparar prompts, (c) rodar regressão de prompt em time.

### Fase 0 — Destravar o funil (dias) — *sem isso, nada mais importa*

1. **Resultado instantâneo.** Mostrar o resultado do regex imediatamente e refinar com o semântico **em background** (hoje `usePromptAnalysis.ts` faz `await` do classificador antes de pontuar). O score pode aparecer com um selo "refinando…".
2. **Matar o muro de 140 MB.** Três opções, em ordem de custo/benefício:
   - tornar o semântico **opt-in** ("análise profunda") e deixar regex como padrão;
   - trocar e5-small (118 MB) por um modelo 10–20× menor, ou servir um modelo próprio quantizado (~5–10 MB) da nossa origem com cache imutável;
   - no mínimo, **timeout + fallback**: nunca deixar o usuário preso esperando o modelo.
3. **Ligar o tratamento grátis.** `AIButtons.tsx` já está pronto e testado; montá-lo no `App.tsx` (ou em `PromptInput`) custa ~1 linha e entrega "corrigir com ChatGPT/Claude" sem custo para nós.
4. **SEO/social mínimo viável.** `meta description`, Open Graph/Twitter card, `robots.txt` e `sitemap.xml` **reais** (não o fallback do SPA), `<h1>`/conteúdo indexável, e páginas por intenção de busca ("otimizador de prompt para SQL", "para redação", "para atendimento").
5. **Analytics privacy-friendly** (Plausible/Umami) medindo o funil: visita → colou prompt → clicou analisar → viu score → clicou corrigir.

**Métrica de saída da Fase 0:** % de visitantes que veem um score e tempo até o primeiro score.

### Fase 1 — Provar demanda em UM canal e UM nicho (semanas)

Escolher **um** dos três, não os três:

| Opção | Prós | Contras | Veredito |
|-------|------|---------|----------|
| **A. Extensão de navegador** (botão dentro do ChatGPT/Claude) | Distribuição real (Chrome Web Store); captura o usuário onde ele já está; resolve o atrito de "copiar e colar" | Review da store, manutenção de DOM instável | ⭐ **Melhor aposta de escala** |
| **B. Ferramenta PT-BR para agências/freelancers** | Padrões e dataset PT já existem; menos concorrência; Pix/Mercado Pago | Teto de mercado menor; churn | ⭐ **Melhor aposta de caixa rápido** |
| **C. Prompt ops / eval para times** | Maior ticket; usa o dataset dourado; B2B paga | Exige eval de verdade + vendas | Fase 2, depois de A ou B |

**Recomendação:** comece por **B** para gerar caixa e prova social em 2–4 semanas, montando ao mesmo tempo a **A** como motor de aquisição. Guarde **C** como upsell quando tiver 3–5 times usando o dataset.

### Fase 2 — Só então cobrar

| Plano | Preço-alvo | O que entrega |
|-------|-----------|---------------|
| Free | R$ 0 | Análise, score, anatomia, **3 otimizações/dia** com nossa chave (Haiku) |
| Pro | **US$ 9–12/mês** ou **R$ 29–39/mês** | Otimizações amplas, histórico, biblioteca, versionamento, export, comparação A/B |
| Team | **US$ 29/usuário/mês** | Workspace, regressão/CI de prompts usando o dataset dourado, compartilhamento |

**Infra mínima necessária** (nada disso existe hoje):
- **Cloudflare Workers + D1** (o host atual já é Cloudflare) para auth, metering e histórico;
- **Stripe** (global) + **Pix/Mercado Pago** (BR);
- rate limit **no servidor** (o `llm/rateLimiter.ts` atual é em memória do cliente — inútil);
- chaves de LLM **nunca** no cliente.

### O que NÃO fazer

- ❌ Não construir dashboard enterprise multi-tenant.
- ❌ Não integrar pagamento antes de medir ativação.
- ❌ Não competir de frente com LangSmith/Braintrust/Langfuse em eval genérico.
- ❌ Não manter 118 MB no caminho crítico.
- ❌ Não mexer no `scorer.ts` antes de consertar os 18 testes vermelhos — você perderia a única garantia de que o score é confiável.

---

## Parte 4 — Próximos 7 dias (proposta concreta)

| Dia | Ação | Arquivos | Esforço |
|-----|------|----------|---------|
| 1 | Consertar os 18 testes vermelhos (constraint/example + faixas de score) e travar como gate de CI | `core/__tests__/`, `__tests__/validation-prompts.test.ts` | 4–6 h |
| 2 | Análise instantânea: regex primeiro, semântico em background com selo "refinando" | `hooks/usePromptAnalysis.ts`, `App.tsx` | 3–4 h |
| 3 | Semântico vira opt-in + timeout/fallback; parar de baixar 118 MB por padrão | `core/semanticClassifier.ts`, `core/worker.ts` | 3–4 h |
| 4 | Ligar o handoff (tratamento grátis) | `App.tsx` + `components/AIButtons.tsx` | 1 h |
| 5 | SEO/social: meta/OG, `robots.txt`, `sitemap.xml` reais, `<h1>` | `frontend/index.html`, `frontend/public/` | 4 h |
| 6 | Analytics + eventos de funil | `frontend/index.html`, `App.tsx` | 2 h |
| 7 | Limpar código morto e corrigir README/status (parar de prometer o que não existe) | `llm/`, `api/`, `data/templates.ts`, docs | 3 h |

**Ao final da semana:** você tem um funil mensurável, um produto instantâneo e um tratamento. Aí a pergunta deixa de ser "dá dinheiro?" e passa a ser "quanto tráfego eu consigo?". Que é a pergunta certa.

---

## Anexo — Como este diagnóstico foi obtido

- Leitura direta: `App.tsx`, `usePromptAnalysis.ts`, `AIButtons.tsx`, `semanticClassifier.ts`, `worker.ts`, `PromptInput.tsx`, `package.json`, `iac/pages.tf`.
- Build real: `npm run build` (passa; `index-*.js` 453 kB, `worker-*.js` 530 kB, WASM 23,6 MB).
- Testes: `npx vitest run` → 385/403.
- Tamanho do modelo: header `x-linked-size` do HF para `Xenova/multilingual-e5-small/onnx/model_quantized.onnx` = 118.308.185 bytes.
- Produção: `curl https://skelica.pages.dev/` (sem meta description/OG; `/robots.txt` e `/sitemap.xml` retornam o HTML do SPA).
- Preços de LLM: [BenchLM, set/2026](https://benchlm.ai/anthropic/api-pricing).
