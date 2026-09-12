# Skelica — Estratégia para MRR: do diagnóstico ao produto que se paga

**Data:** 2026-09-12
**Premissa deste documento:** ceticismo. O objetivo não é justificar o que já existe, é descobrir o que precisa ser verdade para alguém pagar todo mês — e testar isso pelo caminho mais barato possível.
**Documento irmão:** `docs/project/monetization-analysis.md` (diagnóstico técnico do que existe, com evidência em código).

---

## 0. A conclusão desconfortável

Você pediu créditos mensais, time de produto e marketing, e recorrência de assinaturas. Vou ser direto:

> **Empacotamento não conserta produto que ninguém precisa.** Créditos mudam *como* você cobra. Eles não mudam *se* alguém quer pagar. Time de produto e marketing sem PMF não é time, é queima de caixa.

E existe um problema mais fundo que ainda não foi enfrentado:

> **Nunca foi provado que um score alto no Skelica produz uma resposta melhor da IA.**

Toda a proposta de valor — o número, a nota, o checklist, o "3x better responses" que está no `i18n.ts` — depende dessa premissa. Ela nunca foi testada. É o item nº 1 deste plano, e custa menos de um dia de trabalho para testar.

---

## 1. Temos um produto ou um demo?

### 1.1 A premissa não testada (o experimento mais importante do projeto)

O app afirma: prompts com score alto geram resultados melhores. Vamos checar o que sustenta essa afirmação.

O "dataset dourado" (`frontend/src/data/validation-prompts.json`, 83 prompts) descreve a si mesmo assim:

> *"Golden dataset for prompt analysis **regression tests**. **Calibrated to current parser/scorer behavior.**"*

Ou seja: ele foi **calibrado contra a própria saída da ferramenta**. Cada item tem `expected: {role: present/absent, ...}` e um `scoreRange`. Isso prova **consistência** — que o parser não regrediu. **Não prova correção.** Ninguém nunca mediu se a resposta do modelo melhora.

Traduzindo: o ativo mais defensável do projeto é, hoje, um teste de que a ferramenta concorda consigo mesma.

**Experimento (1 dia, custo ~US$ 5):**

1. Escolher 10 tarefas reais (ex.: resumir contrato, classificar ticket, gerar SQL, escrever e-mail de cobrança).
2. Para cada tarefa, escrever 4 variantes de prompt que o Skelica pontue em faixas distintas (F, C, B, A+).
3. Rodar as 40 combinações no mesmo modelo, 3 vezes cada (para medir variância).
4. Pedir avaliação cega a 2–3 juízes (humanos ou LLM com rubrica) **sem saber o score**.
5. Calcular a correlação score → qualidade percebida.

**Critérios de decisão honestos:**

| Resultado | Leitura | Ação |
|-----------|---------|------|
| Correlação forte (ρ > 0,6) | O score tem significado preditivo | ✅ A premissa se sustenta — siga para a Seção 3 |
| Correlação fraca (ρ < 0,3) | O número é decorativo | ⚠️ O score vira *explicador*, não *produto*. Reposicionar |
| Variância alta entre repetições | O modelo é mais determinante que o prompt | ⚠️ "Melhorar prompt" rende pouco — mude o problema |

Sem rodar isso, tudo que vem depois é fé. E fé não levanta assinatura.

### 1.2 O teste do wrapper

Pergunta brutal que qualquer investidor ou cliente fará:

> **Se a OpenAI lançar amanhã um botão "melhorar prompt" dentro do ChatGPT, alguém ainda usa o Skelica?**

Hoje, a resposta é **não**. O produto atual faz algo que o modelo/provider pode absorver como checkbox. A literatura sobre o assunto é explícita: wrappers morrem quando (a) a plataforma avança para o seu terreno, (b) o custo de troca é imaginário, (c) a margem é decisão de preço de terceiro.

Isso não significa que o projeto morre. Significa que **a defesa não pode ser "analisar prompt"**. Precisa ser uma das três coisas que sobrevivem:
1. **Dados proprietários** — o histórico de prompts + resultados reais do cliente (data gravity).
2. **Última milha** — integração com o fluxo de trabalho real (extensão, CI, Slack, aprovação), não um site separado.
3. **Efeito de rede / colaboração** — o workspace do time fica melhor quanto mais gente usa.

Marque isso: tudo que for construído daqui pra frente deve cair em uma dessas três. Se não cair, é feature com prazo de validade.

### 1.3 O que ainda não sabemos (e deveríamos)

- **Zero analytics** → não sabemos se alguém usa o app, nem por quanto tempo. Toda persona aqui é hipótese.
- **Sem contas** → não sabemos quem volta.
- **Sem base de comparação** → nunca medimos se o usuário considera o resultado bom.

O passo mais rigoroso hoje não é construir. É **instrumentar e conversar**. Antes de escrever uma linha de cobrança.

---

## 2. Qual problema real, de quem, em 2026

### 2.1 A dor mudou de lugar

| Época | Dor dominante | Já foi resolvida por |
|-------|---------------|----------------------|
| 2023–24 | "A IA não me entende" / preciso de role, contexto, formato | Modelos melhores + anatomia de prompt (o que o Skelica já faz) |
| **2026** | **"Meu prompt funciona no meu teste e quebra nos inputs reais"** | ❌ ninguém resolveu bem |
| **2026** | **"Mudei o prompt e não sei se melhorou ou piorou"** | ❌ |
| **2026** | **"Temos 40 prompts espalhados em docs e ChatGPT, ninguém sabe qual é o atual"** | ❌ |
| **2026** | **"Não consigo mexer no prompt sem medo de quebrar produção"** | Parcialmente (ferramentas de dev) |

**Conclusão:** a dor que paga aluguel migrou de *anatomia* (o que temos) para *confiabilidade, mensurabilidade e governança* (o que não temos). O Skelica está resolvendo a dor de 2024.

Isso não é motivo para jogar o código fora — é motivo para **mudar o produto que ele vende**. O motor de análise vira o *lint* gratuito; o valor pago passa a ser a prova de qualidade.

### 2.2 ICPs candidatos, com veredito

| ICP | Dor | Paga? | Ferramentas hoje | Veredito |
|-----|-----|-------|------------------|----------|
| **A. Times de engenharia de IA** | Avaliação, regressão, observabilidade | Sim, ticket alto | Promptfoo, Braintrust, LangSmith, Langfuse — todos maduros e financiados | ❌ **Não atacar de frente.** Seríamos feature |
| **B. Não-técnicos que são donos de prompts críticos** (líder de suporte, ops, marketing, revops) — usam ChatGPT Team/Claude todos os dias, prompts viram processo da empresa | "Não sei se meu prompt está bom"; "quebrou e eu não percebi"; "não consigo provar pro meu chefe que melhorou" | Sim — **já pagam** por ChatGPT Team/Claude, têm cartão corporativo, não têm ferramenta nenhuma | Planilha, copy-paste, nada | ✅ **Melhor aposta de MRR.** Ninguém serve esse público |
| **C. Agências/freelancers que entregam IA para clientes** | Precisam provar qualidade ao cliente; entregam prompts como parte do trabalho | Sim, por projeto | Nada específico | ✅ **Melhor aposta de caixa e cases rápidos** |
| **D. Prosumer/creator individual** | Curiosidade, hobby | Raramente | Ferramentas grátis | ⚠️ Volume, churn alto, CAC só via orgânico |

**Recomendação:** validar **B** e **C** com 20 conversas antes de construir. **C** gera caixa e depoimentos em 30 dias; **B** é onde está a recorrência.

**Ceticismo obrigatório sobre B:** esse público pode *não saber* que tem o problema. Você não vende "score de prompt" para ele — vende **"prove que seu atendimento não piorou"**. A dor precisa ser nomeada na linguagem dele, não na nossa.

### 2.3 O que a pesquisa de mercado mudou neste plano

Pesquisa completa com fontes em `docs/research/prompt-tooling-monetization-2026.md`. Quatro achados que **alteram** o plano — inclusive uma recomendação minha que estava errada:

**1. A metade de baixo do mercado está morrendo, não só comoditizada.**
- **PromptPerfect** (Jina), o produto mais conhecido de "otimize meu prompt", **encerra em 1º/set/2026** após a aquisição da Jina pela Elastic.
- **Vellum pivotou para fora da categoria** (virou assistente pessoal).
- **Anthropic absorveu o time da Humanloop** (ago/2025).
- Enquanto isso, capital foi para **eval/observabilidade**: Braintrust levantou US$ 80M @ ~US$ 800M (fev/2026).

> Isso não é um mercado que encolheu — é um mercado que **se separou**. O topo (lifecycle: versionamento, eval, CI, RBAC) captura o dinheiro; a base (reescrever prompt) virou feature grátis. **O Skelica está exatamente na base.**

**2. É feature grátis dos três provedores.** OpenAI tem Prompt Optimizer grátis no dashboard desde o GPT-5 (ago/2025); Anthropic tem "prompt improver" no console; Google tem escrita de prompt com IA no Gemini Enterprise. O teste do wrapper (§1.2) não é hipótese — **já aconteceu.**

**3. CORREÇÃO: eu estava errado sobre a extensão de navegador.** Eu a classifiquei como "melhor aposta de escala". Os dados dizem o contrário:
- 86,3% das ~112 mil extensões da Chrome Web Store têm **menos de 1.000 usuários**; a mediana é **~17 instalações**.
- **ExtensionPay**, o principal trilho de pagamento para extensões, processou **US$ 500 mil acumulados entre TODOS os desenvolvedores** — não por mês, no total.
- Lançamento documentado no Product Hunt: 512 visitantes → 63 cadastros → **4 pagantes**.

Extensão continua útil como **canal de aquisição e retenção** (onde o ICP B já vive), mas **não é a aposta de escala** que eu disse. Rebaixo de "melhor aposta" para "teste de canal a validar".

**4. A aritmética da distribuição, sem ilusão.** A US$ 9/mês, **US$ 1k de MRR exige ~11.000 visitantes/mês a 1% de conversão** — e 1% é otimista para uma ferramenta sem cadastro (as taxas de 2–5% do mercado são *signup→paid*, e nós nem temos signup). US$ 5k de MRR ≈ 56 mil visitantes/mês, todo mês.

### 2.4 O achado que pode invalidar o `scorer.ts` (leia antes de codar)

Este é o item mais sério da pesquisa, e ele não estava no meu primeiro diagnóstico:

> **O mercado está indo na direção oposta ao que o Skelica pontua.**
> - OpenAI (jul/2026) agora recomenda **encurtar** system prompts — testes internos mostraram **−41% a −66% de tokens** após encurtar, **revertendo** a própria orientação de scaffolding de ago/2025.
> - Anthropic removeu **>80% do system prompt do Claude Code** para as gerações novas.

O `scorer.ts` dá **15% do peso para "Completeness"** — que mede *quantos dos 9 componentes estão presentes*. Ou seja: o score tende a **subir quando o prompt fica maior e mais "completo"**. Para modelos da geração atual, isso pode ser **anti-correlacionado com a qualidade real**.

Some isso à premissa não testada (§1.1) e temos **duas** razões independentes para rodar o experimento antes de construir qualquer coisa paga. Se o experimento mostrar correlação fraca *e* viés para prompts longos, o `scorer.ts` não é um produto — é um passivo.

**Ação:** o experimento §1.1 deve incluir explicitamente prompts **curtos e densos** na faixa "A", não só prompts longos e estruturados. Caso contrário, o teste confirma o próprio viés.

---

## 3. O entregável — o que exatamente o cliente recebe

Isto é o coração do seu pedido. "Valor entregue" precisa ser um **artefato concreto**, não uma sensação.

### 3.1 A escada de valor

| Nível | O que o cliente recebe | Formato tangível | Pago? |
|-------|------------------------|------------------|-------|
| **L0 — Diagnóstico** | Score, anatomia, checklist | Tela | ❌ Grátis (isca) |
| **L1 — Correção** | Prompt reescrito **+ diff do que mudou e por quê** | Texto + diff | ✅ Créditos |
| **L2 — Prova** | Prompt rodado contra **os casos reais dele**, com antes/depois, pass/fail, custo e latência | **Relatório compartilhável (link)** | ✅ Créditos |
| **L3 — Guarda** | Versões do prompt, re-execução automática ao mudar, alerta de regressão | Histórico + alerta (Slack/e-mail/CI) | ✅ **Assinatura** |
| **L4 — Biblioteca** | Prompts do time como ativos governados: dono, versão, uso, custo, status | Workspace multiusuário | ✅ **Assinatura por assento** |

**A assinatura vive em L3/L4.** Créditos vivem em L1/L2. Vender L1 sozinho é vender uma tarefa — ninguém assina uma tarefa.

### 3.2 O artefato central: o Relatório de Prompt

Um link que o usuário manda para o chefe ou para o cliente. Conteúdo:

```
Prompt: "Triagem de tickets — v4"          Status: ⚠️ REGRESSÃO
─────────────────────────────────────────────────────────────
Antes (v3)  →  82% de acerto em 24 casos   custo médio US$ 0,004
Depois (v4) →  71% de acerto em 24 casos   custo médio US$ 0,004
Diferença   →  ▼ 11 pts  •  3 casos que passavam agora falham
Casos que quebraram:  #7 (reembolso), #12 (cancelamento), #19 (SLA)
─────────────────────────────────────────────────────────────
Prompt reescrito + diff   •   Evidência por caso   •   Histórico
```

Por que isso é o artefato certo:
- **É a prova** que o não-técnico precisa para justificar o gasto.
- **É compartilhável** → cada relatório é um canal de aquisição embutido no produto (product-led growth real, não "viralidade" de marketing).
- **É acumulativo** → vira histórico, que é o custo de troca.
- **Só existe com trabalho recorrente** → é a base do mês 2.

### 3.3 Como o código atual se encaixa (evolução, não reescrita)

| Ativo atual | Papel no novo produto | Status |
|-------------|----------------------|--------|
| `anatomyParser` + `scorer` (regex) | **Lint instantâneo grátis** — roda sem LLM, sem download, sem custo | ✅ Reusar, tirar do caminho crítico |
| `semanticClassifier` (e5-small, 118 MB) | Refinamento opcional | ⚠️ Fora do caminho crítico; hoje é o maior assassino de conversão |
| `llm/openaiClient` + `anthropicClient` + `schema` | **Motor do L1** (reescrita) e do **juiz** do L2 | ✅ Já existe, só está desligado |
| `AIButtons.tsx` | L1 grátis via ChatGPT/Claude (isca, custo zero) | ✅ Pronto, não montado |
| `data/templates.ts` | Semente da biblioteca (L4) | ✅ Existe, não renderiza |
| `validation-prompts.json` (83) | Semente do formato de *suite*, **não** da avaliação de qualidade | ⚠️ Ver §1.1 — é auto-referente |
| `llm/rateLimiter.ts` | — | ❌ Inútil (client-side). Refazer no servidor |

O que **falta construir**: contas, persistência, execução de casos, juiz, diff, versionamento, metering no servidor. É aí que está o produto — e é por isso que o app atual, apesar de 11.700 LOC, ainda não é um produto.

---

## 4. Créditos vs. chave própria — a decisão de empacotamento

Você levantou as duas opções. Elas não são alternativas; são **camadas diferentes**.

### 4.1 Comparação honesta

| | Chave própria (BYO) | Créditos gerenciados |
|---|---|---|
| Margem | 100% | 70–85% |
| Receita | **R$ 0** (nunca) | ✅ sim |
| Atrito | Alto: obter chave, cadastrar cartão no provedor, colar | Baixo: entra e usa |
| % do público que completa | Pequena (devs) | Todos |
| Controla a experiência | ❌ não (o usuário traz modelo pior/melhor, vê erro cru) | ✅ sim |
| Risco de abuso | ❌ nenhum | ⚠️ real (free tier) |
| Serve para | Power user, dev, "ilimitado" percebido | **O negócio** |

**Veredito:** BYO é **feature de retenção para dev**, não modelo de negócio. Quem defender BYO como estratégia está escolhendo R$ 0 de receita com 100% de margem. Créditos são o produto.

### 4.2 Arquitetura de 3 modos (o desenho certo)

| Modo | Quem | O que ganha | Custo nosso |
|------|------|-------------|-------------|
| **Grátis** | Todo visitante com login | 5 créditos/mês + lint ilimitado (regex, sem LLM) | ~US$ 0,05/usuário/mês |
| **Assinatura** | ICP B e C | Créditos mensais inclusos + histórico + relatórios + alertas | ~20% da receita |
| **Chave própria** | Dev / usuário avançado | "Ilimitado" dentro do produto, usando a chave dele | R$ 0 |

Por que os três juntos: o grátis cria o hábito, a assinatura monetiza, e o BYO remove a objeção "vou gastar demais" sem custar nada — e ainda aumenta o valor percebido do plano pago.

### 4.3 Definição honesta de crédito

Não invente "pontos" vagos. Amarre em custo:

- **1 crédito = 1 reescrita de prompt de até 2.000 caracteres** com o modelo padrão.
- Prompt maior = 2–3 créditos (proporcional).
- **1 execução de suite = nº de casos × 0,5 crédito** (gera + julga), sujeito a mínimo.
- Créditos **não acumulam além de 1 mês** (cadência de uso). Top-up avulso disponível.

### 4.4 Números (modelo padrão: Claude Haiku 4.5 — US$ 1/M entrada, US$ 5/M saída)

Custo por reescrita (teto de 2.000 tokens de saída, conforme `llm/openaiClient.ts`): **≈ US$ 0,005–0,011**.

| Plano | Preço | Inclui | Custo nosso | Margem bruta |
|-------|-------|--------|-------------|--------------|
| Free | R$ 0 | 5 créditos/mês | ~US$ 0,05 | — (aquisição) |
| Pro | **R$ 39/mês** (~US$ 7) | 100 créditos + histórico + relatórios + BYO | ~US$ 1,10 | **~84%** |
| Top-up | R$ 19 | 50 créditos | ~US$ 0,55 | ~85% |
| Team | **US$ 29/assento/mês** | Espaço compartilhado, suites ilimitadas (fair use), SSO básico | ~US$ 3–6/assento | ~80% |

**A margem não é o problema.** O problema é o risco do free tier:

> 10.000 usuários grátis ativos = 50.000 reescritas/mês = **~US$ 400/mês** de custo puro. Com abuso (scripts, contas descartáveis) pode ser 10×.

**Mitigações obrigatórias antes de ligar o free tier:**
1. Login obrigatório (e-mail magic link) — sem login, sem crédito.
2. Limite por conta **e** por IP/dispositivo.
3. Modelo barato + `max_tokens` reduzido no free (o teto de 2.000 tokens de saída do código atual é generoso demais para o plano grátis).
4. Fila e timeout; nunca permitir concorrência ilimitada por conta.
5. Metering e corte **no servidor**. O `llm/rateLimiter.ts` atual roda em memória do cliente — qualquer usuário o remove no DevTools. Isso é um vazamento de dinheiro esperando acontecer.

### 4.5 Infra mínima para créditos

Cloudflare Workers + D1 + Stripe (e Pix/Mercado Pago para o ICP brasileiro). O gauge de uso por token já é suportado nativamente por provedores de billing modernos, o que reduz o trabalho de metering a um contador server-side por operação. Você já está no Cloudflare Pages — o caminho é curto.

---

## 5. O que faz alguém assinar no mês 2

Recorrência não vem do preço. Vem de **trabalho recorrente + ativo acumulado**.

| Mecânica | Por que renova | Como construir |
|----------|----------------|----------------|
| **Créditos que resetam** | "Já paguei, melhor usar" | Cadência mensal, rollover limitado |
| **Biblioteca de prompts** | O valor mora lá dentro; sair custa caro | Versionamento + dono + tags por time |
| **Suites que rodam sozinhas** | O trabalho acontece sem ele lembrar | Alerta ao mudar prompt; integração Slack/CI |
| **Relatórios arquivados** | Prova histórica para auditoria/chefia | Retenção de 12 meses no plano pago |
| **Assentos e compartilhamento** | Coordenação de time = custo de troca | Workspace + permissões |

> **Regra:** se o produto não tem um trabalho que se repete todo mês, ele não tem assinatura — tem venda única disfarçada. Hoje o Skelica é 100% uso único: você cola, vê um número, sai. **Não há nenhum motivo estrutural para voltar.** Esse é o problema de produto a resolver, mais do que qualquer feature.

---

## 6. Time sério de produto e marketing

Seja cético com "montar time": **headcount sem PMF é queima de caixa**. O que se monta agora são **funções com dono e artefato semanal**. Contratação só depois de evidência.

### 6.1 Estágios

**Estágio 0 — agora, pré-receita (fundador + agentes de IA, custo ~R$ 0)**
O fundador ocupa as 3 funções; agentes executam pesquisa, conteúdo e código.

| Função | Responsabilidade | Artefato semanal obrigatório |
|--------|------------------|------------------------------|
| **PM / Discovery** | Falar com usuários, matar hipóteses, priorizar | 5 conversas com ICP + 1 decisão de roadmap |
| **Produto/Eng** | Entregar a escada de valor L1→L3 | 1 incremento deployado + métrica de ativação |
| **Growth/Marketing** | Distribuição, mensagem, funil | 1 teste de mensagem/canal + leitura do funil |

**Estágio 1 — após ativação provada (primeiros ~200 usuários ativos)**
Contratar **1 pessoa de conteúdo/SEO** (o único canal que compõe para ferramenta grátis). Custo: R$ 3–6k/mês. Continua sem designer dedicado (o design system já existe).

**Estágio 2 — após ~20 assinantes pagos**
+1 **PM/suporte** (o ICP B exige mão na mão), +1 testador de canal pago **ou** parcerias (comunidades, agências).

### 6.2 O que marketing precisa que o produto entregue

Marketing não conserta produto sem distribuição embutida. Exigências de produto:

1. **Relatório compartilhável** (§3.2) — cada usuário gera links que trazem outros.
2. **Páginas indexáveis por intenção de busca** — "testar prompt de atendimento", "comparar versões de prompt", "prompt de extração de nota fiscal". Hoje não existe nenhuma página indexável: sem `meta description`, sem OG, e `/robots.txt` e `/sitemap.xml` devolvem o HTML do próprio SPA.
3. **Extensão de navegador** — onde o ICP B já vive (dentro do ChatGPT/Claude). Útil como canal de aquisição e retenção, mas **com expectativa calibrada**: 86,3% das extensões têm <1.000 usuários (§2.3). Testar, não apostar a empresa.
4. **Analytics de funil** — sem isso marketing atira no escuro.

### 6.3 KPIs por função (um por função, sem painel de vaidade)

| Função | KPI único |
|--------|-----------|
| PM | % de entrevistados do ICP que descrevem a dor sem serem induzidos |
| Produto | **Ativação**: % de cadastros que geram 1 relatório na 1ª semana |
| Marketing | **CAC orgânico** e taxa de conversão free→pago |
| Negócio | **Retenção no mês 2** (o único número que importa para MRR) |

---

## 7. Plano de 30/60/90 com critérios de morte

Rigor exige saber **quando parar**. Sem critério de morte, todo plano vira fé.

| Fase | Semanas | Objetivo | Custo | Critério de MORTE |
|------|---------|----------|-------|-------------------|
| **1. Provar a premissa** | 1 | Rodar o experimento de §1.1 (score → qualidade real) | ~US$ 5 | Se ρ < 0,3, o score não é o produto. **Reposicionar antes de construir** |
| **2. Provar a dor** | 1–3 | 20 entrevistas com ICP B/C + landing page "fake door" com preço | ~R$ 0 | Se < 5 de 20 descreverem a dor espontaneamente **ou** < 3% clicarem no preço → ICP errado |
| **3. Destravar funil** | 2–4 | Lint instantâneo, tirar 118 MB do caminho crítico, ligar L1, SEO, analytics | ~R$ 0 | Se ativação (ver score) < 30% → problema é o produto, não o tráfego |
| **4. Construir L2** | 5–8 | Suites + juiz + relatório compartilhável | ~R$ 0 | Se quem gera relatório não volta em 7 dias → produto não recorre |
| **5. Cobrar** | 9–12 | Auth, D1, metering, Stripe/Pix, planos de §4.4 | ~R$ 0 | Se conversão free→pago < 1% com 500+ ativos → preço/proposta errados |

**Nada de pagamento antes da fase 5.** Cobrar antes de ter ativação mede a coisa errada e queima a única lista de usuários que você tem.

---

## 8. O que eu faria primeiro

**Nos próximos 3 dias, nesta ordem:**

1. **Rodar o experimento §1.1.** É o único item que pode invalidar todo o resto. Barato, rápido, decisivo.
2. **Instalar analytics de funil.** Você está discutindo ICP sem saber se alguém usa o app.
3. **Falar com 5 pessoas do ICP B** (líderes de suporte/ops que já usam ChatGPT pago). Perguntar o que as impede de dormir — não mencionar o produto.
4. **Tirar o modelo de 118 MB do caminho crítico** e ligar `AIButtons` (1 linha). Isso é independente da estratégia e melhora qualquer cenário.

**O que eu NÃO faria agora:**
- ❌ Integrar pagamento / créditos antes de validar a premissa e a dor.
- ❌ Contratar ninguém.
- ❌ Investir em "avaliação de prompt" genérica (Promptfoo/Braintrust/LangSmith já venceram essa briga).
- ❌ Manter 118 MB no caminho crítico mais uma semana.
- ❌ Mexer no `scorer.ts` antes de consertar os 18 testes vermelhos — você perderia a única garantia de consistência que existe.

---

## Anexo — Base factual

- **Pesquisa de mercado (fontes por afirmação):** `docs/research/prompt-tooling-monetization-2026.md` — 11 concorrentes com preço, consolidação (PromptPerfect encerrando, Vellum fora, Humanloop absorvida), comoditização pelos provedores, aritmética de distribuição e sinais de demanda. Ressalvas registradas: volume de busca não verificado e todos os exemplos de MRR solo são auto-reportados.
- **Código:** auditoria completa em `docs/project/monetization-analysis.md` (LOC, testes, bundle, código morto, evidência por arquivo).
- **Dataset auto-referente:** `validation-prompts.json` v1.1, 83 prompts, `description` = *"regression tests … calibrated to current parser/scorer behavior"*; campos `expected` (presença de componente) e `scoreRange` (faixa do próprio score).
- **Preços de LLM:** Claude Haiku 4.5 = US$ 1/M entrada, US$ 5/M saída; Sonnet 5 = US$ 2/M, US$ 10/M — [BenchLM, set/2026](https://benchlm.ai/anthropic/api-pricing).
- **Risco de wrapper / defesa:** análise de forças que matam wrappers (plataforma avança, custo de troca imaginário, margem comprimida) — [DEV, mar/2026](https://dev.to/agentq/your-ai-wrapper-startup-is-already-dead-3ld7).
- **Metering de uso de IA em billing:** suporte nativo a medição de tokens/chamadas de modelo — [PYMNTS, 2026](https://www.pymnts.com/dashboard-post/news/artificial-intelligence/2026/stripe-introduces-billing-tools-to-meter-and-charge-ai-usage/).
- **Teto de saída do otimizador:** `max_tokens: 2000` em `frontend/src/llm/openaiClient.ts` e `anthropicClient.ts`.
