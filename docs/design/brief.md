# skelica — Design Brief

> "Design is not just what it looks like. Design is how it works."

---

## 1. Usuário-Alvo

**Quem são:**
Desenvolvedores, prompt engineers e profissionais de IA que passam horas iterando prompts. Já conhecem a dor de um prompt vago que retorna lixo.

**O que sentem:**
- Frustração com resultados inconsistentes
- Insegurança sobre o que falta no prompt
- Cansaço mental de tentar-erro-repetir
- Vontade de aprender, mas sem paciência para teoria

**O que querem:**
Resposta imediata. Visual. Sem tutoriais. Colar prompt → ver problema → corrigir.

---

## 2. Jornada Crítica

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   1. COLAR        →    2. VER         →    3. CORRIGIR        │
│   Texto bruto          Anatomia           Aplicar sugestão     │
│   no input             colorida           com 1 clique         │
│                                                                 │
│        ↓                      ↓                      ↓         │
│   [ textarea ]          [ highlights ]         [ optimize ]    │
│                          + score                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**3 passos. Não 5. Não 7. Três.**

1. **Input** — Textarea grande, sem distrações. Foco total.
2. **Análise** — Prompt decomposto com highlights coloridos. Score como âncora visual.
3. **Ação** — Um botão. "Optimize". O resto é implementação.

**Jornada alternativa (usuário avançado):**
- Escolher template → preencher slots → copiar

---

## 3. Princípios do Projeto

### I. Clarity Over Cleverness
O usuário não deve descobrir como usar. Interface óbvia. Labels claros. Sem ícones misteriosos.

### II. One Thing at a Time
Cada tela tem um propósito único. Análise é análise. Templates são templates. Não misturar.

### III. Visual Hierarchy Through Color
Cores comunicam significado. Role é azul. Instruction é laranja. Não é decorativo — é funcional.

### IV. Respect the Flow
Análise demora. Loading state elegante. Progresso visível. Não deixar usuário no vácuo.

### V. Delight in Details
Animações sutis. Transições fluidas. O nome skelica piscando em glitch. Coisas que fazem sorrir.

---

## 4. Componentes da UI

### Essenciais (MVP)

| Componente | Propósito |
|------------|-----------|
| **PromptInput** | Textarea com contador de chars/words. Botão "Analyze" proeminente. |
| **AnatomyViewer** | Prompt renderizado com highlights. Hover mostra tooltip do componente. |
| **ScoreDisplay** | Número grande (0-100). Cor muda por faixa. Grade letter (A-F). |
| **DimensionRadar** | Gráfico radar/spider das 13 dimensões. Visual imediato do que está fraco. |
| **SuggestionsList** | Lista de melhorias. Clicável. Aplica com 1 toque. |
| **ComponentLegend** | Chips coloridos. Mostra o que cada cor significa. |

### Secundários (v2)

| Componente | Propósito |
|------------|-----------|
| **TemplateGallery** | Grid de templates profissionais. Filtro por categoria. |
| **HistoryDrawer** | Prompts anteriores. Comparação lado a lado. |
| **ExportPanel** | Copiar JSON, Markdown, texto puro. |

### Estrutura da Tela

```
┌────────────────────────────────────────────────────────────────┐
│  HEADER: skelica (logo glitch)                    [templates]    │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌─────────────────────────┐  ┌─────────────────────────────┐  │
│  │                         │  │                             │  │
│  │     PROMPT INPUT        │  │      ANATOMY VIEWER         │  │
│  │     (textarea)          │  │      (highlighted)          │  │
│  │                         │  │                             │  │
│  │     [Analyze]           │  │                             │  │
│  │                         │  │                             │  │
│  └─────────────────────────┘  └─────────────────────────────┘  │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  SCORE: 72  │  RADAR CHART  │  SUGGESTIONS (clickable)   │  │
│  │  Grade: B   │               │  • Add role definition     │  │
│  │             │               │  • Specify output format   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                │
│  [==== LEGEND: Role Context Instruction Constraint ====]       │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## 5. O Que Cortar

**Não ter:**

- ❌ Dashboard com métricas agregadas — não é produto de analytics
- ❌ Sistema de login/autenticação — atrito desnecessário no MVP
- ❌ Modo claro — quebra a identidade "hacker"
- ❌ Notificações push — não é app de messaging
- ❌ Social features — não é rede social
- ❌ Configurações de tema — dark é o tema
- ❌ Walkthrough/tutorial — se precisa, falhou
- ❌ Preview em tempo real enquanto digita — desperdício de tokens

**Questionar se aparecer:**

- ⚠️ Histórico local — só se for invisível (localStorage)
- ⚠️ Export de PDF — ninguém pede isso de verdade
- ⚠️ Comparação de prompts — feature de power user

---

## 6. O Que Proteger

**Não negociável:**

1. **Velocidade** — Análise deve ser percebida como instantânea. Loading states devem ser progresso visível.

2. **Precisão visual** — Highlights devem estar pixel-perfect. Se a cor do role está azul, o texto destacado é exatamente a role. Não aproximado.

3. **Score confiável** — O número é a âncora de confiança. Se 72 aparece, o usuário acredita que 72 é real. Algoritmo deve ser consistente.

4. **Dark theme impecável** — Fundo #0a0a0f. Não preto puro (#000). Texto #e4e4e7. Não branco puro. Contraste calculado, não chute.

5. **Identidade skelica** — O glitch no nome. O visual de "classified document". A sensação de ferramenta secreta. É o que diferencia.

---

## 7. Especificação Técnica

### Cores

```
Backgrounds:
  --bg-primary:    #0a0a0f    /* Main background */
  --bg-secondary:  #12121a    /* Cards, panels */
  --bg-tertiary:   #1a1a24    /* Elevated elements */
  --bg-hover:      #22222e    /* Interactive states */

Foreground:
  --fg-primary:    #e4e4e7    /* Main text */
  --fg-secondary:  #a1a1aa    /* Muted text */
  --fg-tertiary:   #71717a    /* Placeholder, disabled */

Borders:
  --border-subtle: #27272a    /* Divider lines */
  --border-focus:  #3f3f46    /* Focus rings */

Component Colors:
  --role:        #3B82F6      /* Blue-500 */
  --context:     #8B5CF6      /* Violet-500 */
  --instruction: #F97316      /* Orange-500 */
  --constraint:  #EF4444      /* Red-500 */
  --example:     #22C55E      /* Green-500 */
  --format:      #06B6D4      /* Cyan-500 */
  --audience:    #EC4899      /* Pink-500 */
  --tone:        #F59E0B      /* Amber-500 */

Score Colors:
  --score-excellent:  #22C55E   /* 90-100: Green */
  --score-good:       #84CC16   /* 80-89: Lime */
  --score-fair:       #EAB308   /* 70-79: Yellow */
  --score-poor:       #F97316   /* 60-69: Orange */
  --score-bad:        #EF4444   /* 0-59: Red */
```

### Tipografia

```
Font Stack:
  Primary:   'Inter', system-ui, -apple-system, sans-serif
  Mono:      'JetBrains Mono', 'Fira Code', monospace

Scale (rem):
  --text-xs:    0.75rem    /* 12px */
  --text-sm:    0.875rem   /* 14px */
  --text-base:  1rem       /* 16px */
  --text-lg:    1.125rem   /* 18px */
  --text-xl:    1.25rem    /* 20px */
  --text-2xl:   1.5rem     /* 24px */
  --text-3xl:   1.875rem   /* 30px */
  --text-4xl:   2.25rem    /* 36px */
  --text-5xl:   3rem       /* 48px — Score number */

Weights:
  Normal:    400
  Medium:    500
  Semibold:  600
  Bold:      700
```

### Espaçamento

```
Scale (px):
  --space-1:   4px
  --space-2:   8px
  --space-3:   12px
  --space-4:   16px
  --space-5:   20px
  --space-6:   24px
  --space-8:   32px
  --space-10:  40px
  --space-12:  48px
  --space-16:  64px

Layout:
  Container max-width: 1280px
  Sidebar width: 320px
  Input height: 48px (buttons, inputs)
  Border radius: 8px (default), 4px (small), 12px (cards)
```

### Animações

```
Duration:
  Fast:     150ms    (hover, press)
  Normal:   250ms    (transitions)
  Slow:     400ms    (page transitions)

Easing:
  Default:  cubic-bezier(0.4, 0, 0.2, 1)
  In:       cubic-bezier(0.4, 0, 1, 1)
  Out:      cubic-bezier(0, 0, 0.2, 1)

Key Animations:
  - Glitch text effect on skelica logo (CSS only)
  - Fade-in on analysis results (staggered)
  - Pulse on score when updated
  - Slide-in for suggestions
```

### Component Tokens

```css
/* Button */
--btn-bg: var(--bg-tertiary);
--btn-hover: var(--bg-hover);
--btn-active: var(--bg-primary);
--btn-padding: 12px 24px;
--btn-radius: 8px;

/* Input */
--input-bg: var(--bg-secondary);
--input-border: var(--border-subtle);
--input-focus: var(--role);
--input-padding: 16px;

/* Card */
--card-bg: var(--bg-secondary);
--card-border: var(--border-subtle);
--card-padding: 24px;
--card-radius: 12px;

/* Tooltip */
--tooltip-bg: var(--bg-tertiary);
--tooltip-border: var(--border-subtle);
--tooltip-padding: 8px 12px;
```

---

## 8. Estados da Interface

### Empty State
```
┌────────────────────────────────────────┐
│                                        │
│     ╭──────────────────────────────╮   │
│     │                              │   │
│     │   Paste your prompt here...  │   │
│     │                              │   │
│     │                              │   │
│     ╰──────────────────────────────╯   │
│                                        │
│            [ Analyze ]                 │
│                                        │
│     Drop a prompt or start typing      │
│                                        │
└────────────────────────────────────────┘
```

### Loading State
```
┌────────────────────────────────────────┐
│                                        │
│     Analyzing prompt anatomy...        │
│     ████████████░░░░░░░░  65%          │
│                                        │
│     • Detecting components...          │
│     • Calculating scores...            │
│     ⏳ Generating suggestions...       │
│                                        │
└────────────────────────────────────────┘
```

### Result State
```
┌────────────────────────────────────────┐
│                                        │
│  Score: 72                    Grade: B │
│  ───────────────────────────────────── │
│                                        │
│  "You are a [senior engineer]..."      │
│   ↑Role    ↑Context                    │
│                                        │
│  ┌────────────────────────────────┐    │
│  │ ⚠ Add output format            │    │
│  │ ⚠ Include examples             │    │
│  │ ✓ Role defined                 │    │
│  └────────────────────────────────┘    │
│                                        │
│         [ Optimize Prompt ]            │
│                                        │
└────────────────────────────────────────┘
```

---

## 9. Responsividade

```
Desktop (1280px+):    Full layout, side-by-side panels
Tablet (768-1279px):  Stacked layout, full-width cards
Mobile (<768px):      Single column, simplified view

Mobile-specific:
- Hide radar chart (use list instead)
- Collapse legend to dots
- Bottom sheet for suggestions
```

---

## 10. Acessibilidade

- Contraste mínimo 4.5:1 para texto
- Focus states visíveis (não remover outline)
- Labels em todos os inputs
- aria-labels em elementos interativos
- Suporte a navegação por teclado
- Não depender só de cor para comunicar estado

---

*"Simplicity is the ultimate sophistication."* — Da Vinci

*Este documento vive. Atualize quando aprender.*
