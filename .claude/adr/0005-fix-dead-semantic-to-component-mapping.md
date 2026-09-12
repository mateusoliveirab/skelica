# ADR-0005: Corrigir mapeamento morto entre score semântico e componente em `enhanceWithGranularAI`

## Status

Accepted — corrigido nesta sessão. **Achado novo, descoberto ao executar a ADR-0001** (não fazia parte
da análise original) — registrado como ADR própria por ser um bug de contrato de dados independente
da escolha de modelo.

## Contexto

Ao implementar a ADR-0001 e rastrear onde o retorno de `classifyComponents` é consumido, encontrei um
segundo lugar em `anatomyParser.ts` (`enhanceWithGranularAI`, por volta da linha 700) que fazia sua
própria tradução de "label semântico" para "tipo de componente":

```ts
const semanticToComponentMap: Record<string, PromptComponentType> = {
  'instruction': 'instruction',
  'context': 'context',
  'role': 'role',
  'constraint or rule': 'constraint',       // <- nunca bate
  'negative constraint': 'negative_constraint', // <- nunca bate
  'example': 'example',
  'output_format': 'format',                // <- nunca bate
  'target audience': 'audience',            // <- nunca bate
  'tone or style': 'tone'                   // <- nunca bate
};
```

O problema: essa tabela espera as strings de label **cruas do modelo NLI** (`'constraint or rule'`,
`'output_format'`, etc.) — mas o valor que ela realmente recebe (`sentenceMap[sentence]`) já vem
**traduzido para os ids de componente** por `core/semanticClassifier.ts` (que faz exatamente essa
tradução via `COMPONENT_MAP` antes de devolver o resultado — inclusive `data/semantic-mocks.json`,
usado pelos testes, já é escrito nesse formato: `{"role": 0.05, "context": 0.85, ...}`).

Ou seja: esse mapeamento **já estava morto antes de qualquer mudança desta sessão**. Ele só "funciona"
por coincidência para os componentes cujo id já é igual à antiga label em inglês (`instruction`,
`context`, `role`, `example` — 4 de 9). Para os outros 5 (`constraint`, `negative_constraint`,
`format`, `audience`, `tone`), a busca `semanticToComponentMap[semLabel]` sempre retornava
`undefined`, e o reforço de IA para esses componentes nunca era aplicado — silenciosamente, sem erro,
sem teste pegando (os testes de regressão usam os mocks, que já batiam por acidente com os 4
componentes que funcionavam, e o teste não cobre os outros 5 especificamente por esse ângulo).

Isso não tem relação com qual modelo de IA está por trás — é um bug de contrato entre dois arquivos
que evoluíram de formas diferentes ao longo do tempo. Só apareceu para mim porque a ADR-0001 me fez
seguir o dado da ponta a ponta (worker → classifier → parser).

## Decisão

Remover a tabela de tradução redundante e usar as chaves de `scores` diretamente como tipo de
componente — que é exatamente o que elas já são:

```ts
for (const [compType, score] of Object.entries(scores)) {
  if (score > bestScore) {
    bestScore = score;
    bestType = compType as PromptComponentType;
  }
}
```

## Consequências

- O reforço semântico de `constraint`, `negative_constraint`, `format`, `audience` e `tone` passa a
  ser aplicado de fato pela primeira vez — antes, só `instruction`/`context`/`role`/`example` recebiam
  esse reforço, por acidente de nomenclatura, não por design.
- Isso muda o comportamento observável mesmo sem trocar o modelo (a ADR-0001 e esta ADR são
  independentes: mesmo mantendo o `mobilebert-uncased-mnli` antigo, essa correção já teria feito
  diferença). Rodei `npm run test:prompts` (tier full) depois da correção — ver notas de verificação
  no fechamento da sessão; nenhuma regressão nos testes existentes.
- Risco: como o reforço agora alcança mais componentes, prompts que antes nunca ganhavam um boost de
  IA em `constraint`/`format`/`audience`/`tone` podem ver esses componentes aparecerem com confiança
  diferente. **Nota de atualização:** o corte deixou de ser `bestScore > 0.60` — esse valor era
  calibrado para a escala de probabilidade do NLI antigo e não fazia sentido para os scores de
  similaridade de cosseno do classificador da ADR-0001 (cujo piso, mesmo em texto neutro, já fica em
  ~0.78). Recalibrado para `bestScore > 0.90` com base em teste real com frases neutras — ver ADR-0001,
  seção "Calibração do limiar", para os números e o porquê.
