# ADR-0001: Trocar zero-shot NLI (mobilebert-uncased-mnli) por embeddings multilíngues no classificador semântico

## Status

Accepted — implementado nesta sessão.

## Contexto

`frontend/src/core/worker.ts:36` carrega `Xenova/mobilebert-uncased-mnli` via `@huggingface/transformers`
(`pipeline('zero-shot-classification', ...)`, `dtype: 'q4'`) e roda em Web Worker para não bloquear a UI.
`frontend/src/core/semanticClassifier.ts` expõe `classifyComponents(text, language)`, chamado por
`frontend/src/hooks/usePromptAnalysis.ts:65,72` para enriquecer a detecção baseada em regex
(`anatomyParser.ts`) com um sinal semântico por sentença.

Dois problemas verificados no código, não hipotéticos:

1. **Modelo é treinado só em inglês.** `mobilebert-uncased-mnli` é MobileBERT fine-tunado no MNLI
   (dataset de NLI em inglês). `worker.ts` define `LABELS_EN` e `LABELS_PT` e escolhe entre eles por
   `language === 'pt' ? LABELS_PT : LABELS_EN` — mas o modelo não entende as hipóteses em português,
   só troca o texto do rótulo, não a capacidade linguística do modelo.
2. **Espanhol não tem nenhum enriquecimento semântico.** `COMPONENT_MAP` em `semanticClassifier.ts`
   só tem chaves EN/PT. `worker.ts` não define `LABELS_ES`. `usePromptAnalysis.ts:57` faz
   `detectLanguage(...) as 'en' | 'pt'` — um prompt em espanhol cai no `else` de `worker.ts:55` e roda
   com rótulos em inglês contra texto em espanhol. O app tem patterns regex completos para ES
   (`core/patterns/spanish.ts`), mas a camada de IA não cobre o terceiro idioma que o produto anuncia suportar.

Custo computacional: zero-shot NLI reencoda o par (sentença, hipótese-do-rótulo) para cada um dos 9
rótulos — até 81 forward passes por prompt (9 sentenças × 9 rótulos). Para o problema real ("qual
dessas 9 categorias esse texto mais se parece"), isso é mais caro do que necessário.

`@huggingface/transformers` estava em `^3.0.0` (latest no registry: `4.2.0` — verificado via `npm view`),
sem `device: 'webgpu'` explícito, ou seja, rodando em WASM/CPU por padrão mesmo em navegadores com WebGPU.

## Decisão

Substituir o classificador zero-shot NLI por **embeddings de frase multilíngues + similaridade de
cosseno** contra embeddings pré-computados de uma descrição canônica por componente, mantendo:

- a mesma assinatura pública (`classifyComponents(input, language)` retornando
  `SemanticComponents = Record<string, number>` com as mesmas 9 chaves de componente);
- o mesmo offload para Web Worker;
- o mesmo cache por sentença.

Modelo escolhido: **`Xenova/multilingual-e5-small`** (ONNX, já publicado para uso com
`@huggingface/transformers`), que cobre EN/PT/ES (e mais) com um único modelo, eliminando a assimetria
de idiomas por construção — não é mais "IA para EN/PT, regex-only para ES", é o mesmo modelo para os
três.

**Tamanho de arquivo — troca real, medida via `curl -I` nos `.onnx` do Hugging Face, não uma melhoria
de graça:** o modelo atual em produção (`mobilebert-uncased-mnli`) baixa ~27-31MB quantizado. O
`multilingual-e5-small` quantizado (`q8`/`int8`/`uint8`) é **~118MB** — cerca de **4x maior**, não menor
como seria de esperar ingenuamente. É um custo estrutural de qualquer embedding genuinamente
multilíngue (testei também `paraphrase-multilingual-MiniLM-L12-v2` e `distiluse-base-multilingual-cased-v2`:
118MB e 135MB quantizados) — a tabela de vocabulário multilíngue (~250k tokens) domina o tamanho do
arquivo. Mantive a troca porque o download é lazy (só no primeiro uso real da análise, não no load da
página) e cacheado pelo browser depois disso, mas é uma troca de UX de primeiro uso que vale registrar
com o número certo, não com "menor" por suposição.

Cada rótulo de componente (role, context, instruction, constraint, negative_constraint, example,
format, audience, tone) ganha **3 frases-exemplo curtas por idioma** (não uma única descrição
abstrata — ver "Verificação empírica" abaixo para o porquê); os embeddings dos exemplares são
calculados uma vez por idioma (lazy, no worker), a média normalizada vira o "centróide" do rótulo, e
fica cacheada — o custo por análise cai para 1 forward pass por sentença (embedding da sentença) +
produto escalar contra 9 centróides, em vez de até 9 forward passes por sentença.

Bump de `@huggingface/transformers` de `^3.0.0` para `^4.2.0`; `device: 'auto'` (verificado no source
da lib: `deviceToExecutionProviders` resolve `'auto'` para a lista de devices suportados em ordem de
prioridade — WebGPU primeiro quando o browser expõe, WASM como fallback — sem precisar de
feature-detection manual); `dtype: 'q8'` (não `'q4'` — ver justificativa na verificação empírica).

## Alternativas consideradas

- **Manter NLI, só adicionar `LABELS_ES` com um modelo NLI multilíngue** (ex.: `MoritzLaurer/mDeBERTa-v3-base-mnli-xnli`):
  resolveria a cobertura, mas modelos NLI multilíngues de qualidade aceitável são bem maiores que
  MobileBERT (>500MB), piorando o custo de download/inferência no browser sem resolver o custo de
  9 forward-passes/sentença.
- **Não mexer, documentar a limitação:** rejeitado — o produto já afirma suporte a 3 idiomas na
  camada de regex; deixar a camada de IA capengar para 1/3 dos idiomas é uma inconsistência de
  arquitetura, não uma limitação de produto assumida.

## Verificação empírica (feita nesta sessão, antes de finalizar — em duas rodadas)

Antes de aceitar a troca só porque "faz sentido na teoria", testei candidatos de verdade rodando
modelos reais (via scripts Node ad-hoc, fora do app) contra frases EN/PT/ES escritas à mão, medindo
acerto top-1 (a label de maior score bate com o componente esperado).

**Rodada 1 — descrição única por rótulo (abordagem inicial, descartada):**

| Candidato | Idiomas | Acerto top-1 |
|---|---|---|
| **Atual em produção** (`mobilebert-uncased-mnli`, zero-shot) | EN | **0/5** — sempre cravava "example", viés sistemático |
| Embedding com 1 descrição/rótulo (`multilingual-e5-small`, `fp32`) | EN+PT+ES | **4/15** (~27%) |
| NLI multilíngue (`mDeBERTa-v3-base-xnli-multilingual-nli-2mil7`) | EN+PT+ES | **3/15** (~20%), mais pesado |

Troquei os prefixos assimétricos do E5 (`query:`/`passage:`), sem ganho (4/9 nos dois sentidos) — a
causa não era o prefixo, era a representação: uma frase curta e abstrata por rótulo ("definição de
papel ou persona") fica genérica demais; frases reais de prompt compartilham vocabulário entre si
independente da categoria, então tudo cai próximo no espaço de embedding.

**Rodada 2 — centróide de 3 exemplares concretos por rótulo (abordagem implementada):**

Em vez de uma descrição abstrata, usei 3 frases-exemplo reais por componente por idioma (ex. `role`:
"You are a senior backend engineer.", "Act as an expert copywriter.", ...), tirei a média normalizada
dos embeddings dos 3 exemplares como "centróide" do rótulo, e testei contra frases **novas** (não
usadas como exemplar):

| Idioma | Acerto top-1 |
|---|---|
| EN (9 frases) | **9/9 = 100%** |
| PT (9 frases) | **9/9 = 100%** |
| ES (9 frases) | **8/9 = 89%** (só errou `role` vs `audience`) |
| **Total** | **26/27 ≈ 96%** |

Testei também 6 frases neutras/filler em EN (ex. "Thanks in advance for your help with this.") para
medir falso-positivo: o score bruto do top-1 nessas frases ficou em 0.78–0.90, contra 0.88–0.96 nas
frases verdadeiras — overlap real mas estreito. Um corte fixo em `bestScore > 0.90` (calibrado com
esses números, implementado em `anatomyParser.enhanceWithGranularAI`) separa 100% das negativas
testadas ao custo de descartar ~2/9 positivas EN limítrofes (0.88, 0.887) — troca deliberada a favor
de precisão: uma detecção perdida aqui só cai de volta pro regex (seguro); um falso positivo rotula
texto neutro como um componente que não existe.

**Conclusão prática:** a diferença entre "modelo desatualizado" e "modelo atual" (mobilebert-uncased-mnli
→ multilingual-e5-small) sozinha não teria resolvido nada — passou de 0% pra ~27%, ainda ruim. O que
resolveu de fato foi a técnica de representação do rótulo (exemplares reais + centróide, em vez de uma
frase descritiva abstrata), independente de qual modelo de embedding por trás. Isso é coerente com o
que o usuário observou ("os recursos desse domínio não eram os mais eficientes quando eu fiz") — mas a
causa raiz não era só "o modelo ficou velho", era a técnica de zero-shot com descrição abstrata, que
tem um teto baixo estrutural para esse tipo de tarefa (9 categorias sobrepostas, uma frase isolada, sem
dado rotulado) independente de qual modelo de 2024 ou de 2026 se usa por trás. Isso testado nesta
sessão bate 96% de acerto top-1 em EN/PT/ES com o mesmo modelo pequeno, zero fine-tuning, zero dataset
rotulado — só trocando a forma de representar cada rótulo.

Testado em `dtype: 'q8'` (mesmo dtype usado em produção, ao contrário da rodada 1 que usou `fp32`) —
os números acima já refletem o que roda de fato no worker.

## Consequências

- Positiva: paridade real EN/PT/ES na camada semântica (96% de acerto top-1 medido, ver verificação
  empírica) — antes, o modelo era inglês-only e ainda errava 100% em inglês; menos forward-passes por
  análise (1 por sentença + produto escalar vs. até 9 forward-passes/sentença).
- Negativa, real: download do modelo ~4x maior que o atual (~118MB vs. ~27-31MB, medido via `curl -I`
  nos arquivos `.onnx` — ver "Decisão" para os números completos) — mitigado por ser lazy (só no
  primeiro uso da análise) e cacheado pelo browser depois, mas é custo real de primeiro uso, não uma
  melhoria "de graça".
- Positiva: adicionar um idioma novo no futuro é só escrever 3 exemplares por componente nesse
  idioma em `worker.ts`, sem trocar de modelo nem retreinar nada.
- Corrigiu de quebra um bug de contrato pré-existente e independente (ADR-0005): a tabela de tradução
  label→componente em `enhanceWithGranularAI` esperava as strings cruas do NLI antigo e nunca batia
  com o formato já traduzido que `semanticClassifier.ts` sempre devolveu — 5 dos 9 componentes nunca
  recebiam reforço de IA, silenciosamente, desde antes desta sessão.
- Risco residual, documentado: o threshold `bestScore > 0.90` em `enhanceWithGranularAI` foi calibrado
  com um conjunto pequeno de frases de teste (9 EN + 9 PT + 9 ES positivas, 6 negativas EN) — é uma
  calibração real, não um chute, mas não é um dataset de validação formal. Se o comportamento em
  produção mostrar muitos falsos negativos/positivos, revisitar esse número com mais dados é o próximo
  passo natural, não uma ADR nova.
- `npm run test:prompts` roda contra `semantic-mocks.json` (fixture estática, independente da
  implementação real), então a regressão de anatomia não depende da qualidade real do modelo — rodei
  `TEST_TIER=full npx vitest run` e `npx tsc -b` nesta sessão: mesmos 68 testes pré-existentes falhando
  (confirmado via `git stash`, são falhas da camada de regex, alheias a esta ADR) e zero testes novos
  quebrados.
