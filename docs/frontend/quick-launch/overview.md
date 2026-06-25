# Quick Launch: Claude & ChatGPT (Prompt V2)

Purpose: Provide two one-click buttons to open Claude or ChatGPT with a prefilled Prompt V2, aligning with Skelica's UX and design system. Include inline fallbacks if popups are blocked.

Audience: Translators, editors, content teams using Skelica.

Goals:
- One-click launch to Claude or ChatGPT with a ready-to-use prompt.
- Safe fallback path (inline panel) when popup is blocked.
- Clear, locale-aware copy and accessibility compliance.
- Handoff-ready specs for designs and engineering.

Deliverables:
- Button components and interaction specs.
- Prompt V2 generator logic (in TS/JS) and localization hooks.
- IA, wireframes, visual spec, and test plan (per this doc).

Success metrics:
- >90% of users can initiate a prompt with one click without errors.
- Popup-block fallback engaged <5% of attempts in production.
- Accessibility conformance (keyboard nav, aria-labels) at 100% no blockers.
