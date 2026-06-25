# Information Architecture (IA) for Quick Launch

Context: Two provider actions (Claude and ChatGPT) accessible from the editing surface. Each action triggers a prefilled Prompt V2 and opens the provider in a new tab or falls back to an in-app panel if popups are blocked.

Core elements:
- Quick Launch Bar: two provider pills (Claude, ChatGPT) with icons and locale-aware labels.
- Prompt Preview: small inline card showing the Prompt V2 for the selected prompt.
- Fallback Panel: in-app panel that mirrors the prompt and results when popups are blocked.
- Localization layer: provider copy per locale, accessible via locale keys.

User flows:
- Flow A: User opens editor, clicks Claude → prefilled prompt opens in Claude tab; returns with results inline or user continues editing.
- Flow B: User opens ChatGPT similarly; if popup blocked, fallback panel becomes active with copy-to-editor guidance.

Taxonomy:
- Providers: Claude, ChatGPT
- States: idle, hover, focus, active, loading, success, error, blocked
- Presentation: icons, labels, and accessible aria-labels per button

Notes:
- Ensure focus trap is considered when fallback panel is shown.
- All text labels must be locale-ready.
