# Skelica Translation Style Guide (English baseline)

Purpose
- Provide a concise, reusable standard for translating Skelica content into English and future locales.

Scope
- Applies to UI strings, design docs, README, and marketing copy that are user-facing.

Glossary & Terminology
- Maintain a centralized glossary (glossary/en_glossary.json) and reuse terms.
- Preferred terms: Skelica, Prompt Anatomy, Get Started, Back, About, Dashboard, Workspace, Documentation, Help, Title, Description, Keywords.

Tone & Style
- Direct, confident, business-friendly.
- Avoid jargon unless defined in glossary; prefer clarity over cleverness.
- Use consistent capitalization and tense across all content.

UI Copy Rules
- Short, action-oriented labels; avoid ambiguity.
- Keep button labels to 1-3 words where possible.
- Ensure text length fits UI constraints; flag longer strings early.

Capitalization & Punctuation
- Title Case for headings; sentence case for body text.
- Use consistent punctuation and avoid overly long sentences.

Localization Workflow
- Any new term goes into glossary; translations follow glossary terms.
- Review cadence: weekly glossary updates; monthly content reviews.
- CI hooks: validate new keys exist in glossary; fail builds on missing keys.

Ownership
- Glossary Owner: responsible for approving new terms and updating definitions.
- Translation Lead: ensures consistency across updates and PRs.
