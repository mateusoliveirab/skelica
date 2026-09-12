# Skelica — Tarefas

**Status:** PARQUE — nenhuma tarefa ativa.
**Decisão:** [`docs/project/decision-parked.md`](./docs/project/decision-parked.md)

Este arquivo substitui o antigo roadmap por fases. O trabalho de engenharia que ele listava
(motor híbrido, cache semântico, UI unificada, precisão granular) **está concluído** — e não era
o gargalo. Ver `decision-parked.md` §3.

---

## Nada aqui deve ser iniciado

Nenhuma tarefa de produto, marketing ou engenharia deve começar enquanto as condições de
reabertura (`decision-parked.md` §4) não se cumprirem. Todas as quatro são **testes de demanda**,
nenhuma exige construir nada:

| # | Teste | Custo |
|---|-------|-------|
| 1 | Experimento score → qualidade real (correlação ρ > 0,6) | ~1 dia, ~US$ 5 |
| 2 | 20 conversas com o ICP B; ≥5 descrevem a dor espontaneamente | ~1 semana |
| 3 | Landing page de teste: ≥3% de clique no preço com ≥200 visitantes | ~2 dias |
| 4 | Alguém pede para pagar sem ser provocado | — |

Se qualquer uma falhar, a resposta é "não" — e isso é uma resposta útil.

---

## Concluído (registro histórico)

Tudo abaixo foi entregue e verificado. Mantido apenas como referência.

### Arquitetura do motor

- [x] Detecção invariante de idioma — união dos 3 conjuntos de padrões, idioma só desempata (83/83 prompts)
- [x] `core/segmentation.ts` — fonte única de segmentação (`Intl.Segmenter`)
- [x] Expansão de span limitada por vizinhos (spans não invadem texto já reivindicado)
- [x] Scorer agnóstico de idioma — viés PT↔EN de 0,248 → 0,077
- [x] Fase 2: semântico como detector autoritativo, com limiares de preenchimento vs sobreposição
- [x] Carregamento do modelo em background, fora do caminho crítico, respeitando conexão medida

### Produto e funil

- [x] Resultado instantâneo (regex) antes de qualquer download
- [x] Handoff do prompt anotado para ChatGPT/Claude (`AIButtons.tsx`) ligado à UI
- [x] SEO/social: `meta description`, Open Graph, imagem OG, `robots.txt`, `sitemap.xml` reais
- [x] Instrumentação de funil (`src/analytics/`, no-op sem provedor configurado)

### Qualidade

- [x] 416 testes passando (eram 385/403); tier completo de validação 167/167 (eram 58 falhas)
- [x] Dataset dourado: 5 rótulos errados corrigidos, 2 marcados `partial`, faixas recalibradas
- [x] `scripts/calibrate-validation-prompts.ts` consertado e agora em dry-run por padrão
- [x] Testes de invariante (`engine-invariants.test.ts`) e de autoridade semântica (`semantic-authority.test.ts`)
- [x] ESLint destravado (upgrade de plugins) e limpo
- [x] 7 módulos de código morto removidos

---

## Notas das versões anteriores (histórico do arquivo)

- **v1.4.2:** Redesenho do Score Card (Hero Grade) e unificação de labels.
- **v1.4.1:** Correção de cursores e Error Boundary.
- **v1.4.0:** i18n completa, IA bilíngue e UI educativa.
- **v1.3.0:** Cache granular por sentença e UI contextual.
- **v1.2.0:** Fusão semântica granular e barra de carregamento real.
