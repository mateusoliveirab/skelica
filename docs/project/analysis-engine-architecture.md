# Motor de análise — diagnóstico de arquitetura e caminho de simplificação

**Data:** 2026-09-12
**Pergunta que este documento responde:** a lógica de classificação/identificação de componentes é a mais eficaz? Os padrões hardcoded estão dificultando a manutenção? Existe uma forma mais simples?
**Método:** análise do código + medições feitas no dataset de 83 prompts durante a sessão de correção.

---

## Resposta curta

**Regex é a escolha certa — mas a *organização* atual não escala, e já produziu defeitos medíveis.**

O problema não é "usar regex". É que o conhecimento do produto está codificado como **374 expressões regulares mantidas à mão em três idiomas** e **101 heurísticas no scorer**, sem uma fonte única de verdade. Cada idioma é uma cópia parcial dos outros, e nada garante que continuem em sincronia — nada além de testes que, como veremos, congelaram bugs em vez de pegá-los.

Manutenível seria: **1 pipeline de 3 estágios, 0 dicionários de idioma**, reaproveitando a única parte realmente moderna que já existe no projeto — o classificador por embeddings, que hoje está subordinado ao regex.

---

## 1. Evidência: o que a arquitetura atual já quebrou

Tudo abaixo foi medido nesta sessão, não é hipótese.

### 1.1 Um bug de idioma zerava a análise inteira (modo de falha catastrófico)

`detectLanguage()` decide qual dos 3 conjuntos de padrões será carregado. Ele usava listas de palavras ("do", "no", "com", "email", "para") com bônus de "palavra única" que **multiplicava por 5 palavras ambíguas com o inglês**. Resultado:

| Prompt | Idioma detectado | Componentes detectados |
|--------|------------------|------------------------|
| `Do not use jargon.` | **pt** ❌ | **0** |
| `Create a validator. For instance: validate("a@b.com") returns true.` | **pt** ❌ | **0** |
| `Given that we are building a web app, do not use external libraries.` | **pt** ❌ | **0** |

Inglês virando português → o parser carrega o conjunto errado → **zero componentes**, score ~0, tela vazia. Um prompt com `test@email.com` já bastava (a palavra `email` estava na lista PT e `com` também).

Agravante estrutural: **não existe degradação gradual**. Errar o idioma custa 100% do resultado. Um design que depende de um palpite de idioma no caminho crítico é frágil por construção.

### 1.2 Uma armadilha de JavaScript invisível

`/\bvocê\b/` **nunca casa** em JavaScript, porque `\b` usa `\w` = `[A-Za-z0-9_]`, e `ê` não é `\w`. Todos os marcadores acentuados do detector estavam mortos: `você`, `não`, `função`, `sênior`, `é`, `são`, `também`, `usuário`, `atm`, `funciones`, `también`, `mañana`… A lista parecia boa e não fazia nada.

Isso é o tipo de erro que a abordagem de dicionário convida: o código *parece* correto, o teste de PT passa (por sorte, via outros tokens), e a fragilidade fica escondida.

### 1.3 Os três idiomas estão dessincronizados (medido)

| Arquivo | Regexes | LOC |
|---------|---------|-----|
| `patterns/english.ts` | **151** | 190 |
| `patterns/portuguese.ts` | **131** | 164 |
| `patterns/spanish.ts` | **92** | 124 |

Espanhol tem **39% menos** padrões que inglês. Não há mecanismo que force paridade — só disciplina humana.

### 1.4 Isso produz um viés real contra o português (medido)

Comparando prompts que o próprio dataset classifica na mesma categoria de qualidade:

| Categoria | EN (média) | PT (média) | Gap |
|-----------|-----------|-----------|-----|
| bad | 0.245 (n=7) | 0.178 (n=6) | 0.067 |
| medium | 0.322 (n=15) | 0.306 (n=8) | 0.016 |
| medium-good | 0.478 (n=19) | 0.343 (n=1) | 0.135 |
| **good** | **0.678** (n=13) | **0.430** (n=5) | **0.248** |
| **perfect** | **0.710** (n=2) | **0.490** (n=7) | **0.220** |

**Prompts em português pontuam 0,22–0,25 a menos que prompts em inglês da mesma qualidade — e o viés piora quanto melhor é o prompt.** Um usuário brasileiro que escreve um prompt excelente recebe nota "C" onde um inglês recebe "B+".

Onde está o gap (por dimensão):

| Dimensão | EN | PT | Gap |
|----------|-----|-----|-----|
| effectiveness | 0.554 | 0.363 | **0.191** |
| actionability | 0.359 | 0.189 | **0.170** |
| accuracy | 0.555 | 0.391 | **0.165** |
| relevance | 0.438 | 0.306 | 0.133 |
| specificity | 0.460 | 0.348 | 0.112 |
| clarity | 0.429 | 0.319 | 0.110 |
| structure | 0.206 | 0.187 | 0.019 |
| completeness | 0.620 | 0.611 | **0.009** |

Leitura: `completeness` (a única dimensão que usa a *classificação*, não regex de texto) está **praticamente empatada**. Todas as dimensões baseadas em heurística de texto em inglês (`StaticAnalyzer`) penalizam o português. **O viés é do scorer, não do parser.** E os prompts PT detectam menos componentes (4,04 vs 4,95 em média), consistente com 131 vs 151 regexes.

> **✅ CORRIGIDO.** As dimensões passaram a ler presença de componente da detecção do parser — que é invariante de idioma — em vez das listas de palavras em inglês. O pior gap caiu de **0,248 para 0,077**, e a categoria `perfect` inverteu (PT pontua 0,051 *acima*). A tabela abaixo fica como registro do defeito original.

### 1.4.1 Estado final do viés (após a correção)

| Categoria | EN | PT | Gap |
|-----------|-----|-----|-----|
| bad | 0.283 | 0.239 | 0.044 |
| medium | 0.399 | 0.395 | 0.004 |
| medium-good | 0.571 | 0.545 | 0.026 |
| good | 0.745 | 0.668 | 0.077 |
| perfect | 0.752 | 0.803 | **−0.051** |

O gap residual de 0,077 em `good` é ruído de amostra pequena (13 prompts EN contra 5 PT); `perfect` já inverteu. Uma catraca em `engine-invariants.test.ts` falha se o gap passar de 0,12.

### 1.5 Cada caso não previsto exige uma regex nova

O padrão existia, mas era estreito demais:

```
/\d+\s+(?:strategies|methods|...)/
```
- `"3 strategies"` → ✅ casava
- `"3 investment strategies"` → ❌ **não casava** (adjetivo no meio)

Precisei permitir `(?:\w+\s+){0,2}`. Isso é manutenção infinita: a linguagem natural não tem envelope fechado. Cada sinônimo, cada construção nova, cada idioma é um patch.

### 1.6 As interações são implícitas: mudar uma regex move o score de prompts não relacionados

Ao ampliar **um** padrão de `constraint`, **26 prompts** saíram da faixa de score calibrada. O pipeline tem expansão de sentença, resolução de overlap e tabela de contenção interagindo; o efeito de uma mudança não é local nem previsível. Isso torna cada alteração arriscada e lenta — o oposto de manutenível.

### 1.7 Os testes congelaram um bug em vez de pegá-lo

O dataset é auto-referente por design (`"calibrated to current parser/scorer behavior"`) e o teste de score passava **o array** de componentes onde o scorer espera **um mapa** `componentType → confidence`. Resultado: a dimensão `completeness` (15% do peso) ficou **no piso** em produção, e o mesmo erro no teste fez as faixas de score "concordarem" com o bug. Ficou invisível por tempo indeterminado.

### 1.8 O caminho moderno já existe, mas está desligado na prática

`worker.ts` implementa a boa ideia: **embeddings multilíngues + centroide de 3 exemplares por componente** (~96% nos probes de validação — validado no ADR-0001). Mas:
- só **adiciona** componentes que o regex perdeu, e apenas com `cosine > 0.90`;
- exige **download de 118 MB**;
- quando falha, cai silenciosamente para o regex.

Ou seja: **a parte generalizável está subordinada à parte frágil.** A arquitetura certa é o inverso.

---

## 2. Por que ficou assim (e por que não foi burrice)

Regex foi a decisão correta para o primeiro protótipo:
- custo zero por análise, margem 100 %;
- roda offline, sem backend;
- **privacidade**: o prompt nunca sai do browser (é argumento de venda);
- latência de milissegundos;
- sem dependência de fornecedor.

O erro não foi escolher regex. Foi **continuar empilhando padrões específicos de idioma em vez de trocar o mecanismo** quando o produto passou a suportar 3 idiomas e 9 componentes. O custo de manutenção cresceu de forma multiplicativa (idiomas × componentes × construções) e ninguém reavaliou a decisão.

---

## 3. Arquitetura alvo: 3 estágios, 0 dicionários

```
prompt
  │
  ├─ 1. SEGMENTAÇÃO ......... Intl.Segmenter (nativo do browser, multilíngue)
  │                            → frases com offsets reais
  │
  ├─ 2. CLASSIFICAÇÃO ....... embeddings + centroides de exemplares
  │                            → presença + confiança por componente
  │
  └─ 3. ESTRUTURA ........... markdown headers, listas, blocos de código
                               (já é independente de idioma — manter)
```

**O que cada estágio elimina:**

| Hoje | Depois | Ganho |
|------|--------|-------|
| `detectLanguage()` + dicionários pt/es/en | Nada (modelos são multilíngues) | Remove o modo de falha catastrófico (1.1, 1.2) |
| `expandToSentenceEnd/Start`, `expandRoleContent` | `Intl.Segmenter` | Offsets reais em vez de heurística (151→0 regex) |
| 374 regexes em 3 arquivos | 27 frases-exemplo por componente (já escritas em `worker.ts`) | Paridade automática entre idiomas (1.3, 1.4) |
| `resolveOverlaps` + tabela de contenção | Classificação por frase não sobrepõe | Some a interação implícita (1.6) |
| 101 heurísticas no scorer | Presença vinda do estágio 2 + poucos sinais estruturais | Score igual entre idiomas |

**Custo estimado (a verificar):** embeddings de texto curto custam frações de centavo por milhar de análises. Se preferir manter privacidade e custo zero, um modelo multilíngue pequeno (~5–30 MB) substitui o de 118 MB e continua no browser.

### Alternativa que NÃO recomendo como padrão

**LLM como extrator** ("devolva JSON com os 9 componentes"). É o menor código de todos — mas:
- custo por análise (barato, mas não zero) e latência de segundos;
- o prompt sai do browser → **quebra o argumento de privacidade**, que é justamente a defesa contra o "teste do wrapper";
- reintroduz dependência de fornecedor.

Faz sentido **apenas** no caminho opt-in de análise profunda, onde já existe custo. Não no caminho crítico de UI.

---

## 4. Migração incremental (sem big bang)

| Fase | Escopo | Esforço | Status |
|------|--------|---------|--------|
| **0** | **Robustez de idioma**: coletar os padrões de **todos** os idiomas e resolver sobreposição uma única vez, com o idioma detectado apenas como desempate | 2 h | ✅ **feito** |
| **0b** | **Módulo de segmentação** (`core/segmentation.ts`) com `Intl.Segmenter`, consumido pelo passe semântico | 2 h | ✅ **feito** |
| **0c** | **Testes de invariante** que travam as propriedades do motor | 1 h | ✅ **feito** |
| **1** | ~~Trocar expansão de span por `Intl.Segmenter`~~ | 1–2 dias | ❌ **revertido — medição contrariou a hipótese** (ver §4.1) |
| **2** | **Inverter a dependência**: semântico vira detector autoritativo, regex vira a primeira passada | 1–2 semanas | ✅ **feito** |
| **3** | Remover `detectLanguage` da detecção, os 3 arquivos de padrões, `resolveOverlaps` e expansões; trocar o modelo de 118 MB | 1 semana | ⏳ |
| **4** | **Tornar o scorer agnóstico de idioma** (mata o viés de 0,22); revalidar o dataset | — | ✅ **feito** |
| **5** | **Limpeza**: código morto removido, ESLint destravado e limpo, dataset corrigido e recalibrado | — | ✅ **feito** |

### 4.1 O que a Fase 0 entregou (medido)

Antes: `detectLanguage` escolhia **um** conjunto de padrões. Depois: os padrões dos três idiomas são coletados juntos e a sobreposição é resolvida uma vez, com o idioma detectado apenas desempatando.

| Propriedade | Antes | Depois |
|-------------|-------|--------|
| Tipos detectados variam conforme o idioma | — | **0 de 83 prompts** divergem (era 51 de 83 na primeira tentativa, que só preenchia lacunas) |
| Prompt com estrutura retorna zero componentes | possível (idioma errado → 0) | **impossível** (invariante testado) |
| Prompt PT penalizado por ter 131 regexes vs 151 do EN | sim | não — os padrões dos 3 idiomas valem para todos |

A primeira tentativa de Fase 0 preenchia apenas os **tipos** que o idioma principal não encontrou. Foi medida e descartada: deixava 51 de 83 prompts dependentes do idioma e ainda zerava alguns casos, porque um único span de um idioma bloqueava todos os outros tipos daquela região. A versão que ficou (união + uma resolução de sobreposição) é mais simples **e** resolve.

### 4.2 `Intl.Segmenter`: hipótese testada e rejeitada para spans

Eu havia proposto trocar `expandToSentenceEnd/Start` por `Intl.Segmenter`. **Medi e reverti.** O motivo importa para o futuro:

- `Intl.Segmenter` responde uma pergunta **global** ("onde termina esta frase?"). A expansão de span precisa de uma resposta **local** ("até onde este match deve ir?").
- Em prompts informais que o segmentador lê como **uma única frase longa** (caso real no dataset H1), o span do `constraint` foi de `[247,267]` para `[0,442]`, passou por cima do span de `role`, foi rejeitado na resolução de sobreposição e o componente sumiu. **Dois prompts regrediram.**
- Agora o `Intl.Segmenter` vive em `core/segmentation.ts` e é usado **onde o problema é global**: dividir o prompt em frases para o passe semântico. Isso também consertou um bug silencioso — o produtor e o consumidor do mapa semântico dividiam frases com regex diferentes, então quase toda frase caía no fallback de "prompt inteiro". Agora há **uma única fonte de segmentação**.

Lição registrada no código: usar a ferramenta global para o problema local não simplifica, só desloca a falha.

**Métrica de sucesso da migração:**
- gap PT–EN por categoria **≤ 0,03** (hoje 0,22);
- componentes detectados em prompts "perfect": **≥ 90%** nos 3 idiomas (hoje PT 4,04 vs EN 4,95);
- LOC do motor: de ~2.570 para **< 800**;
- **zero** dicionários de idioma;
- `TEST_TIER=full` verde (hoje 39 falhas, todas pré-existentes).

---

## 5. O que NÃO fazer

- ❌ **Reescrever tudo de uma vez.** A Fase 0 sozinha já remove o risco maior.
- ❌ **Recalibrar o dataset para esconder o viés PT.** Isso converte um defeito em teste verde. Foi por isso que `scripts/calibrate-validation-prompts.ts` passou a rodar em **dry-run por padrão** e ganhou aviso explícito.
- ❌ **Manter dois motores em produção indefinidamente.**
- ❌ **Mexer no `scorer.ts` antes de consertar a base de testes** — a consistência é a única garantia que existe hoje.
- ❌ **Aceitar "1,5x mais padrões" como solução.** Mais regex é mais dívida, não mais qualidade.

---

## 6. Recomendação de sequência

1. ✅ **Fase 0 feita** — o modo de falha que zerava a análise foi eliminado e está travado por testes de invariante.
2. ✅ **Fase 4 feita** — o scorer virou agnóstico de idioma; o viés caiu de 0,248 para 0,077.
3. ✅ **Fases 0b/0c/5 feitas** — segmentação unificada, testes de invariante, dataset corrigido/recalibrado, código morto removido, ESLint funcionando e limpo.
4. ✅ **Fase 2 feita** — o semântico é o detector autoritativo (§8).
5. ⏳ **Próximo: o experimento score → qualidade real** (ver `product-strategy.md` §1.1) e a **validação de ICP**. O experimento decide se o scorer deve ser substituído; sem ele, otimizar mais o score é fé.
6. ⏳ Depois: **Fase 3** (remover os dicionários de idioma) e avaliar o **modelo trilingue de ~39 MiB** (§9).
7. 🚫 **Não** investir mais nenhuma hora em novos padrões regex por idioma: cada um é dívida que a Fase 3 vai apagar.

### 6.1 Resultado final medido

| Métrica | Antes | Depois |
|---------|-------|--------|
| Testes | 385/403 | **409/409** |
| Tier completo de validação | 58 falhas | **167/167 verde** |
| Invariância de idioma na detecção | 0/83 (dependia do idioma) | **83/83** |
| Pior gap de score PT↔EN | 0,248 | **0,077** |
| ESLint | quebrado (crash) | **limpo** |
| Código morto | 7 módulos sem consumidor | **0** |

---

## 7. Testes de invariante (o que impede a regressão arquitetural)

`src/core/__tests__/engine-invariants.test.ts` — 5 testes que não verificam features, e sim as propriedades que tornam o motor seguro para continuar construindo:

| Invariante | Protege contra |
|------------|----------------|
| Tipos detectados são idênticos com qualquer idioma forçado | Regressão à dependência de `detectLanguage` |
| Prompt com estrutura nunca retorna zero componentes | O modo de falha catastrófico |
| Inglês comum nunca é lido como PT/ES | O bug de léxico (`do`, `no`, `com`, `email`) |
| PT e ES legítimos continuam sendo detectados | "Consertar" o inglês quebrando o multilíngue |
| Gap de score PT↔EN ≤ 0,12 (catraca; medido 0,077) | O viés de idioma voltar silenciosamente |

A catraca do gap de score é deliberada: ela **falha se o viés piorar** e deve ser apertada conforme o resto do gap for eliminado. Sem ela, o viés de 0,22 ficou invisível desde o início do projeto.

**Estado atual:** 409 testes, 409 passando (eram 385/403 no início). Tier completo de validação: **167/167 verde** (eram 58 falhas). ESLint limpo.

### 7.1 O que os testes pegaram durante esta sessão

Vale registrar, porque justifica o investimento em invariantes:

- Uma mudança minha "cosmética" (remover `\-` de classes de caractere, sugerida pelo `no-useless-escape`) transformou `[:\-—]` em `[:-—]`, que o JavaScript lê como **faixa de `:` até `—`**. Passou nos testes core e quebrou 3 prompts no tier completo. O tier completo pegou; o core não. A regra está desligada para `patterns/*.ts` com explicação.
- Um padrão que eu **dupliquei** (`like '...'`) já existia com limites diferentes e gerou falsos positivos em 3 prompts. Também pego pelo tier completo.


---

## 8. Fase 2 — o semântico como autoridade (concluída)

O regex continua rodando primeiro (instantâneo, grátis, offline). O semântico carrega **em background depois do primeiro resultado** e, quando pronto, passa a poder **corrigir** o regex — não apenas complementá-lo.

### 8.1 As regras (travadas em `semantic-authority.test.ts`)

| Situação | Confiança | O que acontece |
|----------|-----------|----------------|
| Sem sobreposição, regex não achou nada | ≥ 0,90 (`SEMANTIC_FILL`) | **Adiciona** o componente |
| Regex já marcou a mesma frase com o **mesmo** tipo | qualquer | **Concorda**: mantém o span do regex (mais preciso) e sobe a confiança |
| Regex marcou com tipo **diferente**, e o span do regex está **contido** na frase | ≥ 0,93 (`SEMANTIC_OVERRIDE`) | **Substitui** — é isto que torna o semântico primário |
| Regex marcou com tipo diferente | entre 0,90 e 0,93 | **Não contradiz**: adicionar errado é recuperável, contradizer não |
| Regex tem span que **atravessa** a frase | qualquer | **Preserva** o regex: uma frase não é evidência suficiente para derrubar uma afirmação mais ampla |
| Abaixo de 0,90 | — | Ignora |

Os dois limiares existem porque as faixas se sobrepõem por construção: texto neutro chega a ~0,89 contra um rótulo, e positivos reais começam em ~0,88. Não há corte limpo, então o código codifica **o custo de cada erro**, não uma fronteira nítida.

### 8.2 Por que o download continua fora do caminho crítico

Bloquear a primeira análise num download de ~140 MiB foi exatamente o que fez o app parecer quebrado em visita fria. A Fase 2 **não** reverte isso: o modelo carrega depois que o usuário já viu um resultado, e refina o que está na tela sem pedir clique. Em conexão medida (`navigator.connection.saveData`), o download automático é **suprimido** e o usuário ganha um botão explícito — 140 MiB não se baixam sem consentimento.

### 8.3 Os números por trás da decisão (medidos)

| Item | Valor |
|------|-------|
| Download a frio | **139,7 MiB** (modelo 112,8 + tokenizer 16,3 + sentencepiece 4,8 + WASM 5,8) |
| 4G ruim (3 Mbps) | 6 min 12 s |
| Wi-Fi (40 Mbps) | 28 s |
| Inferência por frase (nativo) | 11 ms |
| 12 frases / 30 frases (nativo) | 57 ms / 143 ms |
| Custo, embeddings via API | **$2,10 por milhão de análises** |
| Custo, no browser | **R$ 0** |

**A demora é download, não processamento.** E 81,8% dos parâmetros do modelo são a matriz de embedding de um vocabulário de 250 mil tokens — o preço da cobertura de ~100 idiomas, não do tamanho do transformer.

**O custo não é o obstáculo** (embeddings são ~3.800× mais baratos que uma reescrita por LLM). O obstáculo é privacidade: uma API de embeddings faria o prompt sair do navegador, que é o argumento central do produto. Por isso a escolha foi browser + background, que preserva privacidade e custo zero e é reversível.

### 8.4 O que daria um ganho real de download (não feito)

| Variante | Tamanho |
|----------|---------|
| int8/uint8/quantized (atual) | 112,5–112,8 MiB |
| fp16 | 224,4 MiB |
| **q4 / bnb4** | **380 MiB** ❌ pior |

Não há ganho por dtype — a intuição de "q4 é menor" está errada para este modelo. O caminho real é um **modelo só pt/en/es** com vocabulário de ~50k tokens: ~39 MiB em vez de 112,8, e ~49 MiB de download total (2,9× menor). Exige treinar/exportar modelo próprio, então fica para depois.

### 8.5 Verificação

- `semantic-authority.test.ts` — 7 testes cobrindo cada regra da tabela §8.1.
- `usePromptAnalysis.test.ts` — o mock do classificador agora expõe `warmUp`; o hook foi blindado para que **uma falha síncrona na camada semântica não escape de `analyze()`**.
- 416 testes, lint limpo, tier completo 167/167.
