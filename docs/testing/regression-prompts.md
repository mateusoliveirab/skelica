# Testes de Regressão de Prompts

## Objetivo

Garantir que alterações no parser, scorer ou padrões não quebrem o comportamento esperado. Toda vez que você atualizar algo no projeto, rode os testes de prompts para validar que elementos continuam funcionando visualmente e logicamente.

## Arquitetura

1. **Dataset golden** (`frontend/src/data/validation-prompts.json`) — Prompts organizados por seção e tier:
   - **Componentes**: role, context, instruction, example, constraint, format, audience, tone (opcionais)
   - **Score**: faixa min–max esperada (0–1)
   - **Tier**: `core` (crítico, ~11 prompts) ou `full` (completo, ~26 prompts)
   - **Section**: 1=Structured, 2=Perfect, 3=Human-style, 4=Special

2. **Teste de regressão** (`frontend/src/__tests__/validation-prompts.test.ts`) — Executa prompts no analyzer + scorer e compara com o esperado

3. **Script de calibração** (`scripts/calibrate-validation-prompts.ts`) — Gera valores atuais para atualizar o dataset após mudanças intencionais

## Uso

### Rodar testes de prompts

**Core (padrão)** — ~11 prompts, ~100 ms. Use em pre-commit ou iterações rápidas:

```bash
cd skelica/frontend
npm run test:prompts
```

**Full** — todos os prompts (~26), ~300 ms. Use em CI ou validação completa:

```bash
TEST_TIER=full npm run test:prompts
```

Ou como parte da suíte completa:

```bash
npm test
```

### Fluxo de trabalho

1. **Antes de alterar** — `npm run test:prompts` deve estar verde
2. **Após alterar** parser, scorer ou patterns:
   - Se os testes falharem e a mudança for **intencional** (melhoria), rode a calibração e atualize o JSON
   - Se falharem por regressão, corrija o código

### Calibrar o dataset após mudanças intencionais

Quando você melhora o parser ou scorer e os testes começam a falhar porque o comportamento mudou **de forma desejada**:

```bash
cd skelica
npx tsx scripts/calibrate-validation-prompts.ts
```

O script imprime uma tabela com detecção atual e um bloco JSON. Use para atualizar `frontend/src/data/validation-prompts.json`.

## Adicionar novos prompts

1. Edite `frontend/src/data/validation-prompts.json`
2. Adicione um item em `prompts` com: `id`, `section`, `tier`, `category`, `label`, `text`, `expected`, `scoreRange`
3. Rode `npx tsx scripts/calibrate-validation-prompts.ts` para obter valores iniciais
4. Ajuste `expected` e `scoreRange` conforme o output
5. Rode `npm run test:prompts` (ou `TEST_TIER=full npm run test:prompts` se tier full) para garantir que passa

## Tiered Suites

| Tier | Prompts | Uso |
|------|---------|-----|
| core | ~11 (S1–S11) | Pre-commit, iterações rápidas |
| full | ~26 (todos) | CI, validação completa antes de release |

O filtro é único e leve: `tier === 'core' || TEST_TIER === 'full'`. Sem lógica extra.

## Relação com validation-dataset.md

`validation-dataset.md` é o documento de referência humano com princípios e expectativas de qualidade. O dataset em JSON está **calibrado ao comportamento atual** do parser/scorer. À medida que melhorias forem feitas para aproximar do validation-dataset.md, o dataset pode ser atualizado via calibração.
