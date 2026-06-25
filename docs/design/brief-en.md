# skelica — Design Brief (English Baseline)

"Design is not just what it looks like. Design is how it works." — Steve Jobs

This document provides an English baseline for Skelica's design brief to align terminology and UX language for future translations.

## 1) Target User

Who they are: Developers, prompt engineers, and AI professionals who iterate prompts. They know the pain of a vague prompt that yields poor results.

What they feel: Frustration with inconsistent results; uncertainty about what’s missing; mental fatigue from trial-and-error; eagerness to learn but not about theory.

What they want: Immediate, visual feedback. Paste a prompt → see problem → fix.

---

## 2) Critical Journey

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   1. PASTE        →    2. VIEW          →    3. FIX         │
│   Raw prompt        Anatomy highlights  Apply fix with one click │
│                                                                 │
│        ↓                      ↓                     ↓         │
│   [ textarea ]          [ highlights ]         [ fix ]       │
│                          + score                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

3 steps. Not 5. Not 7. Three.

1. Input — Large textarea, distraction-free. Full focus.
2. Analysis — Prompt decomposed with colored highlights. Score as visual anchor.
3. Action — A single button. Label: "Optimize". The rest is implementation.

Alternative path (power user):
- Choose a template → fill slots → copy

---

## 3) Design Principles

I. Clarity Over Cleverness
The user should not need to figure out how to use it. Clear labels. No mysterious icons.

II. One Thing at a Time
Each screen has a single purpose. Analysis is analysis. Templates are templates. Do not mix.

III. Visual Hierarchy Through Color
Colors communicate meaning. Role is blue. Instruction is orange. It’s functional, not decorative.

IV. Respect the Flow
Analysis takes time. Elegant loading states. Visible progress. Do not leave the user hanging.

V. Delight in Details
Subtle animations. Smooth transitions. The Skelica name glitch as identity. Small touches that spark delight.

---

## 4) UI Components

Essentials (MVP)

- PromptInput — Textarea with char/word counter. Proeminent Analyze button.
- AnatomyViewer — Prompt rendered with highlights. Hover shows component tooltip.
- ScoreDisplay — Large number (0-100). Color by band. Grade letter (A-F).
- DimensionRadar — Radar/spider chart of 13 dimensions. Quick visual at a glance.
- SuggestionsList — List of improvements. Clickable. Applied with one tap.
- ComponentLegend — Colored chips. Shows what each color means.

Secondary (v2)

- TemplateGallery — Grid of professional templates. Filter by category.
- HistoryDrawer — Previous prompts. Side-by-side comparison.
- ExportPanel — Copy JSON, Markdown, or plain text.

---

## 5) Screen Structure (ASCII baseline)
```
<ASCII diagram omitted for brevity in this patch>
```

---
## 6) What to Cut
- Omit dashboards with aggregated analytics (not part of the MVP)
- Omit login/auth flows (add later if needed)
- Omit light mode (identity as "hacker")
- Omit push notifications (not a messaging app)
- Omit social features (not a social network)
- Omit theme customization (dark theme assumed)
- Omit walkthrough/tutorial (if necessary, it’s a sign of failure)
- Omit real-time preview while typing (wasteful tokens)

---
## 7) What to Protect
- Speed: analysis must feel instant; loading indicators should show progress
- Visual precision: highlights must be pixel-perfect; color-coded meanings must be exact
- Reliable score: the number is the trust anchor; ensure consistency
- Dark theme fidelity: dark background, not pure black; maintain contrast
- Skelica identity: glitch motif, document-like aesthetic; this differentiates the tool

---
## 8) Technical Specifications
Cores: Colors, typography, spacing, animations, and tokens defined for consistent visuals and accessibility.

- Colors, typography, spacing, and animation guidance included here as a baseline for translation.

---
## 9) UI States
- Empty State, Loading State, Result State; accessibility considerations and keyboard navigation.

---
## 10) Accessibility
- Contrast and keyboard navigability; aria-labels where appropriate.

---
## 11) Next Steps
- Finalize English translation, align with glossary, add i18n hooks, and prepare Phase 2 PRs.
