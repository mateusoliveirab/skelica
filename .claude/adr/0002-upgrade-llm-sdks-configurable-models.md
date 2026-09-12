# ADR-0002: Atualizar SDKs OpenAI/Anthropic e parar de hardcodar model ID

## Status

Accepted — implementado nesta sessão.

## Contexto

`frontend/src/llm/openaiClient.ts:51` chama `model: 'gpt-4o'`. `frontend/src/llm/anthropicClient.ts:43`
chama `model: 'claude-3-5-sonnet-20241022'` — duas gerações atrás do modelo atual da família
(`claude-sonnet-5`, confirmado no ambiente de execução deste agente).

Versões instaladas vs. registry (`npm view <pkg> version`, checado nesta sessão):

| pacote | instalado (`package.json`) | registry atual |
|---|---|---|
| `@anthropic-ai/sdk` | `^0.78.0` | `0.123.0` |
| `openai` | `^6.22.0` | `7.10.0` |

Motivo de terem ficado presas: `@anthropic-ai/sdk` está em major `0` — o caret do npm (`^0.78.0`) só
libera patches dentro de `0.78.x`, nunca cruza para `0.79+`. `openai` está uma major inteira atrás
(`^6.22.0` não cruza para `7.x`). `npm update` sozinho nunca teria corrigido isso; era preciso mudar o
range manualmente.

Nenhum dos dois clients expõe o model ID como configuração — está hardcoded dentro da classe, então
trocar de modelo hoje exige mudar código e fazer novo deploy.

## Decisão

1. Subir `@anthropic-ai/sdk` para `^0.123.0` e `openai` para `^7.10.0`.
2. Extrair o model ID para uma constante exportada por client (`DEFAULT_MODEL`), com o valor atual
   correto (`claude-sonnet-5` para Anthropic; mantém `gpt-4o` como default da OpenAI — não tenho
   como verificar no código ou docs internas qual é o "melhor" modelo GPT atual, então não vou
   adivinhar um ID novo sem fonte; ver seção "Não fiz" abaixo).
3. Permitir override opcional via parâmetro do construtor, sem exigir mudança de contrato para quem
   já usa o default.

## Alternativas consideradas

- **UI de seleção de modelo em `SettingsPanel`:** fora do escopo desta ADR — é uma mudança de produto
  (nova UI, novo campo em `Settings`), não uma correção de dívida técnica. Fica registrada como
  seguimento natural, não implementada agora.
- **Pin exato de versão (sem `^`) nos SDKs:** rejeitado — o projeto usa `^` em todas as outras
  dependências; mudar só essas duas quebraria a convenção do repo sem necessidade (o problema era o
  major preso em `0.x`, não a ausência de pin exato).

## Não fiz (e por quê)

Não troquei o model ID hardcoded da OpenAI (`gpt-4o`) por um "modelo mais novo" porque não tenho uma
forma verificada de confirmar qual é o ID correto do modelo atual da OpenAI a partir deste ambiente —
inventar um ID de modelo viola a regra de não adivinhar nomes externos. Extraí o valor para uma
constante nomeada para que a troca, quando o usuário confirmar o ID certo, seja de uma linha.

## Consequências

- `npm install` muda `package-lock.json` (major bump em duas dependências). `tsc -b` limpo e
  `npx vitest run src/llm/__tests__` com 74/74 testes passando após o bump (inclui os testes
  reescritos pela ADR-0003).
- **`openai@7.10.0` exige Node `>=22`** (`npm warn EBADENGINE`). O CI (`deploy.yml`) já usa
  `node-version: '22'`, então o build de produção não é afetado; mas o ambiente local desta sessão
  está em Node `v20.19.4` — quem rodar `npm run dev`/`npm test` localmente numa versão de Node mais
  antiga vai ver esse warning (não travou o install nem os testes aqui, mas é o tipo de coisa que
  pode quebrar silenciosamente numa versão futura da SDK). Vale alinhar `.nvmrc`/engines do projeto
  para `>=22` explicitamente.
- Model ID configurável só na camada de client (constante + parâmetro de construtor); ainda não há
  UI para o usuário final escolher — ver "Alternativas consideradas".
- **Achado adicional, não corrigido (fora do escopo desta ADR):** `npm audit` mostra 20
  vulnerabilidades (3 críticas: `protobufjs`, `tar`, `vitest`) — mas nenhuma delas está nas
  dependências tocadas por este bump. Confirmado comparando `package-lock.json` antes/depois: `vite`,
  `vitest`, `rollup`, `esbuild`, `postcss`, `browserslist`, `tar`, `protobufjs`, `sharp`, `uuid`,
  `nanoid`, `minimatch`, `picomatch`, `brace-expansion`, `flatted`, `undici`, `@babel/core`,
  `@humanfs/node` — todas na mesma versão antes e depois. É dívida pré-existente na toolchain de
  build/teste (a maioria transitiva de `vite`/`vitest`), não introduzida aqui. Registrado para o
  usuário decidir se abre uma ADR própria para atualizar a toolchain de build.
