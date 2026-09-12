# ADR-0003: Structured output em vez de regex sobre texto livre em `optimizePrompt`

## Status

Accepted — implementado nesta sessão.

## Contexto

`OpenAIClient.optimizePrompt` (`llm/openaiClient.ts`) e `AnthropicClient.optimizePrompt`
(`llm/anthropicClient.ts`) pedem ao modelo um texto livre (`chat.completions.create` /
`messages.create` sem schema) e devolvem `{ optimizedPrompt, suggestionsApplied }`. O campo
`suggestionsApplied[].component` **não vem do modelo** — é adivinhado no client, rodando um regex
(`extractComponent`, duplicado idêntico nos dois arquivos) sobre a própria string de sugestão que o
app já tinha antes de chamar a API:

```ts
private extractComponent(suggestion: string): string {
  const componentMatch = suggestion.match(/\b(role|context|instruction|constraint|example|format|audience|tone)\b/i);
  return componentMatch ? componentMatch[1].toLowerCase() : 'general';
}
```

Isso é frágil (uma sugestão como "Adicione um público-alvo claro" em português nunca bate no regex em
inglês) e redundante (o app manda a lista de `suggestions` para a API só para recuperar o mesmo texto
de volta rotulado). Tanto OpenAI (`response_format: { type: 'json_schema', strict: true }`) quanto
Anthropic (tool use com `input_schema` + `tool_choice` forçado) suportam saída estruturada validada
pelo próprio provedor — não pela adivinhação client-side.

Nota de contexto: `LLMClientFactory`/`optimizePrompt` não está conectado a nenhum botão em `App.tsx`
hoje — só é chamado pelos testes (`llm/__tests__/*`) e pelo próprio factory. `SettingsPanel` (onde as
API keys são configuradas) está montado em `App.tsx:284`, mas o fluxo de otimização em si não tem
gatilho na UI atual. Não adicionei essa UI — não fazia parte dos achados originais e seria escopo novo.

## Decisão

Reescrever os dois clients para pedir saída estruturada diretamente ao provedor:

- **OpenAI:** `response_format: { type: 'json_schema', json_schema: { name: 'optimize_result', strict: true, schema: ... } }`
  no `chat.completions.create`, schema com `optimizedPrompt: string` e
  `suggestionsApplied: { component: enum(...), suggestedImprovement: string }[]`.
- **Anthropic:** `tools: [{ name: 'submit_optimization', input_schema: ... }]` +
  `tool_choice: { type: 'tool', name: 'submit_optimization' }`, mesmo schema.

O modelo agora **decide e declara** qual componente cada melhoria endereça, em vez do client
adivinhar por regex depois. Isso também elimina a duplicação de `extractComponent` entre os dois
arquivos — a extração de componente deixa de existir como código, vira responsabilidade do schema.

## Alternativas consideradas

- **Unificar os dois clients atrás de uma lib como Vercel AI SDK (`generateObject` + zod):** reduziria
  duplicação de forma mais ampla (rate limit, timeout, erro), mas é uma dependência nova e uma
  reescrita maior da camada toda. Registrado como possível ADR futuro; não fiz agora para manter o
  escopo desta mudança no achado verificado (parsing frágil), sem trocar a arquitetura de clients por
  inteiro numa tacada.
- **Manter regex, só traduzir para múltiplos idiomas:** rejeitado — trata o sintoma (idioma), não a
  causa (o client está adivinhando algo que o modelo já sabe).

## Consequências

- `suggestionsApplied[].component` passa a vir validado contra um enum, não mais texto livre
  reinterpretado — corrige o caso multilíngue de quebra e remove `extractComponent` dos dois arquivos.
- Testes em `llm/__tests__/openaiClient.test.ts` e `anthropicClient.test.ts` que mockavam
  `choices[0].message.content` / `content[0].text` como texto livre precisaram ser atualizados para
  mockar a resposta estruturada (tool call / json_schema) — feito nesta sessão.
- Dependente de ADR-0002 (bump das SDKs) para garantir suporte estável às APIs de structured
  output/tool use usadas.
