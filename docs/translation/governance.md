# Translation Governance (Phase 3)

Purpose
- Establish lightweight governance for English translations to prevent drift and ensure consistency across UI, docs, and metadata.

Roles
- Glossary Owner: approves new terms and maintains the glossary.
- Translation Lead: oversees translation quality, consistency, and alignment with the glossary.
- PM: prioritizes translation work, coordinates with UX and Tech leads.

Cadence
- Weekly 30-minute alignment meeting to review glossary, new terms, and upcoming translations.
- Monthly glossary refresh to capture new terminology and refine definitions.

Processes
- Glossary: any new term must be added to glossary/en_glossary.json before translation.
- PRs: translation work must reference the glossary entry; PR descriptions should cite glossary changes.
- CI: integrate i18n_ci_checks.sh to catch missing keys or drift.
- QA: ensure UI strings align with glossary terms, verify length constraints, and confirm tone.

Milestones
- M1: Glossary baseline established; governance doc published.
- M2: i18n CI integrated; initial translation PRs pass QA checks.
- M3: Governance cadence in place; ongoing maintenance planned.

Notes
- This governance is lightweight by design and is intended to scale as localization expands.
