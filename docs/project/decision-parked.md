# Decisão: estacionar o Skelica

**Data:** 2026-09-12
**Status:** decidido — projeto em modo passivo
**Decisor:** dono do produto

---

## A decisão

O Skelica é **descomissionado e sem manutenção ativa**. O site saiu do ar em 2026-09-12 e não há mais infraestrutura rodando (ver `decommission-infra.md`). O código permanece neste repositório. O desenvolvimento para aqui. Nenhum esforço novo de engenharia, produto ou marketing é investido até que uma das condições de reabertura (§4) se cumpra.

Não é um abandono por bug ou por fracasso técnico. É uma decisão de alocação: **manter isso como foco ativo consome o poder de escolha do fundador, e o retorno esperado não paga esse custo.**

---

## 1. Contexto: o que existe hoje

O produto está em bom estado técnico — melhor do que estava quando esta sessão começou:

| Métrica | Antes | Depois |
|---------|-------|--------|
| Testes | 385/403 | **416/416** |
| Tier completo de validação | 58 falhas | **167/167** |
| Invariância de idioma na detecção | dependia do idioma | **83/83** |
| Viés de score PT↔EN | 0,248 | **0,077** |
| ESLint | quebrado (crash) | **limpo** |
| Código morto | 7 módulos | **0** |

Estava em deploy estático no Cloudflare Pages, custo de infraestrutura ~R$ 0 — **projeto apagado em 2026-09-12**. O motor é multilíngue, tem dataset dourado de 83 prompts e o semântico é autoritativo sobre o regex; roda localmente com `npm run dev`.

**O que não existe:** contas, pagamentos, analytics configurado, backend, e — o mais importante — **nenhuma evidência de que alguém queira pagar.**

---

## 2. Por que parar

### 2.1 A metade do mercado onde o produto está, está morrendo

- **PromptPerfect** (Jina), o produto mais conhecido de "otimize meu prompt", **encerra em 1º/set/2026** após a aquisição da Jina pela Elastic.
- **Vellum** pivotou para fora da categoria.
- **Anthropic absorveu o time da Humanloop** (ago/2025).
- O capital foi para **eval/observabilidade**: Braintrust levantou US$ 80M a ~US$ 800M (fev/2026).

### 2.2 É feature grátis dos donos da plataforma

OpenAI tem **Prompt Optimizer grátis** no dashboard desde o GPT-5. Anthropic tem prompt improver no console. Google tem escrita de prompt com IA. O "teste do wrapper" — *se o provedor lançar isso amanhã, alguém ainda usa?* — já foi respondido, e a resposta é não.

### 2.3 A distribuição é o gargalo real, e é brutal

- **86,3%** das ~112 mil extensões do Chrome têm menos de 1.000 usuários; a mediana é ~17 instalações.
- **ExtensionPay** processou **US$ 500 mil acumulados entre TODOS os desenvolvedores** — não por mês, no total.
- Lançamento documentado no Product Hunt: 512 visitantes → 63 cadastros → **4 pagantes**.
- A US$ 9/mês, **US$ 1k de MRR exige ~11.000 visitantes/mês a 1% de conversão** — e 1% é otimista para uma ferramenta sem cadastro.

### 2.4 A premissa central nunca foi validada

Ninguém provou que uma nota alta no Skelica produz resposta melhor da IA. O "dataset dourado" era **auto-referente** — calibrado contra a própria saída da ferramenta, não contra qualidade real. O experimento que decidiria isso (`product-strategy.md` §1.1) custa ~1 dia e ~US$ 5 e **nunca foi rodado**.

Pior: a indústria caminha na direção **oposta** à premissa do scorer. A OpenAI agora orienta **encurtar** system prompts (testes internos: −41% a −66% de tokens após encurtar), revertendo a própria orientação anterior. A Anthropic removeu **>80% do system prompt do Claude Code**. O scorer dá 15% de peso a `completeness`, que **sobe quando o prompt fica maior** — pode estar premiando o que os modelos passaram a punir.

### 2.5 A estimativa honesta

Para "o Skelica, como analisador/otimizador de prompt, vira um negócio de MRR lucrativo":

| Definição de sucesso | Chance |
|---|---|
| MRR relevante (>US$ 5k/mês) em 12 meses, solo | 1–2/10 |
| Qualquer receita recorrente real (>US$ 500/mês) | 2–3/10 |
| Alguma receita, ou valor de portfólio/aprendizado | 5–6/10 |

**2/10 não paga o custo de oportunidade** de manter isso como foco ativo.

---

## 3. O que essa sessão ensinou (e que se aplica ao próximo projeto)

1. **Qualidade de engenharia nunca foi o gargalo.** Foram horas tornando a máquina melhor sem uma única evidência de que alguém quer a máquina. A ordem certa é: validar demanda → construir → polir.
2. **Testar é mais barato que construir.** O experimento que poderia matar a ideia custava 1 dia. O polimento do motor custou muito mais.
3. **Um teste que não pode falhar não é um teste.** O dataset era calibrado contra a própria saída da ferramenta; por isso um bug que zerava 15% do score ficou invisível por tempo indeterminado.
4. **"Consertar" sem medir pode piorar.** Desligar uma regra de lint ("escape desnecessário") criou uma faixa de caracteres em regex e quebrou 3 prompts — o tier core não pegou, o tier completo pegou.
5. **Decisões de produto se decidem com dados de usuário, não com elegância de código.**

---

## 4. Condições de reabertura (falsificáveis)

Reabrir **somente** se pelo menos uma destas for verdadeira. Sem isso, não gastar mais esforço:

1. **O experimento score → qualidade passou.** 10 tarefas × 4 variantes de prompt em faixas de score diferentes, avaliação cega, correlação forte (ρ > 0,6) entre nota e qualidade percebida. Custo: ~1 dia, ~US$ 5.
2. **20 conversas com o ICP B** (não-técnicos donos de prompts críticos: suporte, ops, marketing) — pelo menos 5 descrevem a dor espontaneamente, sem o produto ser mencionado.
3. **A landing page de teste atinge ≥3% de clique no preço** com tráfego real, e ≥200 visitantes.
4. **Alguém pede para pagar** — alguém que já usa pergunta, sem ser provocado, como paga/compartilha/comprova a qualidade dos prompts.

Note que as quatro são **testes de demanda**, não de engenharia. Nenhuma exige construir nada.

---

## 4.1 Descomissionar a infraestrutura

A infraestrutura que roda hoje (Cloudflare Pages, GitHub Actions, secrets) tem plano próprio, com
inventário, duas opções — **congelar** ou **apagar** —, armadilhas e checklist de revogação de
credenciais:

👉 **[`decommission-infra.md`](./decommission-infra.md)**

Estado: os deploys automáticos **já foram congelados no repositório**. Falta a desconexão da
integração Git no painel do Cloudflare, a escolha entre congelar/apagar, e a revogação das
credenciais — em especial `ANTHROPIC_API_KEY`, que hoje está exposta ao job de smoke.

---

## 5. Como retomar, se e quando fizer sentido

O projeto está pronto para ser retomado sem arqueologia:

| Ativo | Onde |
|-------|------|
| Arquitetura do motor e decisões | `docs/project/analysis-engine-architecture.md` |
| Estratégia de MRR, ICPs, créditos | `docs/project/product-strategy.md` |
| Diagnóstico técnico original | `docs/project/monetization-analysis.md` |
| Pesquisa de mercado com fontes | `docs/research/prompt-tooling-monetization-2026.md` |
| Estado dos testes | `cd frontend && npx vitest run` → 416/416 |
| Recalibrar o dataset (após mudança intencional) | `npx tsx scripts/calibrate-validation-prompts.ts --apply` |

**Antes de retomar, rodar §4.1 e §4.2.** Se falharem, a resposta é "não", e isso é uma resposta útil.

**Se a decisão de reabrir for pelo caminho B** (eval/regressão para donos de prompt não-técnicos, PT-BR primeiro), a Fase 2 do motor já está feita e a Fase 3 (remover os dicionários de idioma) continua disponível em `analysis-engine-architecture.md` §4.

---

## 6. O que NÃO fazer se alguém reabrir isto

- ❌ Não adicionar mais padrões regex por idioma. É dívida que a Fase 3 apaga.
- ❌ Não recalibrar o dataset para fazer testes passarem. Ele já foi recalibrado uma vez legitimamente; de novo só se os scores ficarem **mais corretos**.
- ❌ Não construir pagamentos antes de medir ativação.
- ❌ Não melhorar o motor antes de rodar §4.1. Foi exatamente esse o erro desta sessão.
