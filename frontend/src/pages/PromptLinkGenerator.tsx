import { useState } from 'react';

// Simple prompt-to-link generator for popular LLMs
// Note: This is a client-side helper to share prefilled prompts via URL
// Some platforms may not support URL-based prefill; use this as a convenience tool

export function PromptLinkGenerator() {
  const [prompt, setPrompt] = useState('');
  const [links, setLinks] = useState<Array<{ provider: string; url: string }>>([]);

  const generate = () => {
    const p = prompt.trim();
    if (!p) return;
    const enc = encodeURIComponent(p);
    // Pre-fill URL formats observed in the wild. These are subject to platform changes.
    const generated = [
      { provider: 'Claude (new)', url: `https://claude.ai/new?q=${enc}` },
      { provider: 'Gemini (prompt)', url: `https://gemini.google.com/app?prompt=${enc}` },
      { provider: 'Gemini (q)', url: `https://gemini.google.com/app?q=${enc}` },
      { provider: 'Grok', url: `https://grok.com/?q=${enc}` },
    ];
    setLinks(generated);
  };

  const copyAll = async () => {
    const text = links.map(l => `${l.provider}: ${l.url}`).join('\n');
    await navigator.clipboard.writeText(text);
  };

  return (
    <section className="px-4 py-8 max-w-3xl mx-auto">
      <h2 className="text-2xl font-semibold text-[var(--fg-primary)] mb-4">Pré-preenchimento via URL</h2>
      <p className="text-sm text-[var(--fg-secondary)] mb-4">Gera links com prompts pré-inseridos para alguns chats LLM. Nem todos suportam isso nativamente, e os comportamentos podem mudar conforme a plataforma.</p>

      <div className="flex flex-col lg:flex-row gap-4 mb-4">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Digite o prompt que você quer pré-preencher..."
          rows={4}
          className="flex-1 p-3 rounded border bg-[var(--bg-surface)] border-[var(--border-default)] text-[var(--fg-primary)]"
        />
        <button
          onClick={generate}
          className="px-4 py-3 rounded-xl bg-[var(--skelica-accent)] text-white font-semibold shadow hover:brightness-110"
        >
          Gerar links
        </button>
      </div>

      {links.length > 0 && (
        <div className="border border-[var(--border-subtle)] rounded-xl p-4 bg-[var(--bg-surface)]">
          <div className="flex items-center justify-between mb-2">
            <strong>Links gerados</strong>
            <button onClick={copyAll} className="text-sm text-[var(--fg-secondary)]">Copiar tudo</button>
          </div>
          <ul className="space-y-2">
            {links.map((l) => (
              <li key={l.provider}>
                <a href={l.url} target="_blank" rel="noreferrer" className="text-sm text-[var(--fg-primary)] hover:underline">
                  {l.provider} — <span className="text-[var(--fg-muted)]">{l.url}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
