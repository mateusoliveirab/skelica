# 📋 Skelica — Roadmap & Status do Projeto

Este documento consolida o status atual do projeto baseado na visão dos especialistas e define as próximas tarefas de implementação.

---

##  Status Consolidado (Steve Jobs)
O Skelica atingiu seu núcleo funcional. A interface foi limpa para dar foco total ao prompt. O motor híbrido (Regex + IA) é a fundação que nos separa de ferramentas simplistas. Agora, precisamos de **precisão obsessiva**.

---

## 🛠 Tech Brief (Bill Atkinson)
**Problema central:** Aumentar a granularidade da detecção semântica.
- **Recomendação:** Classificação bilíngue (EN/PT) para o MobileBERT para eliminar vieses de idioma.
- **Status:** Implementado cache por sentença e labels localizados.

## 🎨 Design Brief (Jony Ive)
**Foco:** Experiência de Deleite.
- **Melhoria:** UI unificada em Inglês, cursores padrão e tooltips estáveis. Score Card redesenhado para impacto visual e clareza.
- **Estrutura:** Exibição direta da anatomia e checklist sem expansões manuais.

## 🐧 Code Review (Linus Torvalds)
**Qualidade do Código:**
- Tipagem robusta no core.
- Uso de `batch processing` na IA para performance.
- Cache inteligente e Error Boundaries funcionais com i18n.

---

## 🚀 Roadmap de Implementação

### Fase 1: Precisão Granular (CONCLUÍDO)
- [x] **Task 1.1:** Refatorar `AnatomyParser` e `SemanticClassifier` para suportar análise por sentença.
- [x] **Task 1.2:** Implementar lógica de "Voto Majoritário" ou "Fusão de Confiança" entre Regex e IA para cada frase.
- [x] **Task 1.3:** Corrigir os 3 casos residuais de falha no dataset português (PT15, PT23, PT25).

### Fase 2: UX & Performance (CONCLUÍDO)
- [x] **Task 2.1:** Adicionar barra de progresso real para o download do modelo Transformers.js.
- [x] **Task 2.2:** Simplificar UI: remover expansão manual e adicionar tooltips de contexto.
- [x] **Task 2.3:** Otimizar o cache do `AnatomyParser` para evitar re-análise de sentenças idênticas em prompts modificados.
- [x] **Task 2.4:** Unificação total em Inglês e redesenho do Score Card.

### Fase 3: Refinamento de Diagnóstico
- [ ] **Task 3.1:** Implementar sistema de "Sugestões Dinâmicas" baseadas em componentes ausentes.
- [ ] **Task 3.2:** Adicionar visualização de "Força do Componente" (quão bem escrito está cada parte).

---

## 📝 Notas de Versão
- **v1.4.2:** Redesenho do Score Card (Hero Grade) e unificação total de labels.
- **v1.4.1:** Fix: Unificação em Inglês, Correção de cursores e Error Boundary.
- **v1.4.0:** Pente Fino: i18n completa, IA Bilíngue e UI Educativa.
- **v1.3.0:** Cache Granular por Sentença (AI Performance) e UI Contextual.
- **v1.2.0:** Fusão Semântica Granular (frase por frase) e Barra de Carregamento de IA Real.
