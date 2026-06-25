# API Contract – Prompt Prefill Quick Launch (MVP)

- GET /api/v1/prefill/templates?lang={lang}&scope={scope}
- Response: { templates: [{ id, name, description, placeholders, version, max_length }] }
- POST /api/v1/prefill/apply
  - Body: { template_id: string, source_text: string, source_lang: string, target_lang: string, user_context?: object }
  - Response: { filled_prompt: string, template_version: string, metadata }

- Security: JWT/OAuth; RBAC; TLS; no sensitive content echoed in logs
- Notes: MVP focuses on Claude/ChatGPT flow; extendable to other providers later
