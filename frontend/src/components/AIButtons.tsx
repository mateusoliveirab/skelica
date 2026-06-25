import { motion } from 'framer-motion';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { t } from '../i18n';

interface ComponentAnalysis {
  component: string;
  presence: { present: boolean };
  description?: string;
}

interface AIButtonsProps {
  prompt: string;
  analysis?: ComponentAnalysis[] | null;
}

export function generateEnhancedPrompt(
  basePrompt: string,
  analysis: ComponentAnalysis[] | null | undefined
): string {
  if (!analysis || analysis.length === 0) {
    return basePrompt;
  }

  const missingComponents = analysis
    .filter((c) => !c.presence.present)
    .map((c) => ({
      component: c.component,
      label: c.component.charAt(0).toUpperCase() + c.component.slice(1).replace(/_/g, ' '),
      description: c.description || '',
    }));

  if (missingComponents.length === 0) {
    return basePrompt;
  }

  const missingList = missingComponents
    .map((c) => `- ${c.label}: ${c.description}`)
    .join('\n');

  const recommendations = missingComponents
    .map((c) => `Add ${c.label}.`)
    .join(' ');

  return `${t('missing_components_intro')}

${missingList}

Please improve this prompt by adding: ${recommendations}

---

Prompt original:
${basePrompt}`;
}

export function AIButtons({ prompt, analysis }: AIButtonsProps) {
  const [copied, setCopied] = useState(false);

  const enhancedPrompt = generateEnhancedPrompt(prompt, analysis);
  const promptToUse = analysis ? enhancedPrompt : prompt;

  const openProvider = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleCopy = async () => {
    if (!prompt.trim()) return;
    try {
      await navigator.clipboard.writeText(promptToUse);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  if (!prompt.trim()) return null;

  const encodedPrompt = encodeURIComponent(promptToUse);

  return (
    <div className="flex items-center gap-2">
      <motion.button
        whileHover={{ scale: 1.05, y: -2 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => openProvider(`https://claude.ai/new?q=${encodedPrompt}`)}
        className="
          w-10 h-10 rounded-lg
          bg-[var(--bg-elevated)] border border-[var(--border-default)]
          flex items-center justify-center
          hover:border-[var(--border-emphasis)]
          transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-[var(--skelica-accent)] focus:ring-offset-2 focus:ring-offset-[var(--bg-base)]
        "
        aria-label={t('open_claude')}
        title={t('open_claude')}
      >
        <img 
          src="/icons/claude.svg" 
          alt="Claude" 
          className="w-5 h-5"
        />
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.05, y: -2 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => openProvider(`https://chat.openai.com/?q=${encodedPrompt}`)}
        className="
          w-10 h-10 rounded-lg
          bg-[var(--bg-elevated)] border border-[var(--border-default)]
          flex items-center justify-center
          hover:border-[var(--border-emphasis)]
          transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-[var(--skelica-accent)] focus:ring-offset-2 focus:ring-offset-[var(--bg-base)]
        "
        aria-label={t('open_chatgpt')}
        title={t('open_chatgpt')}
      >
        <img 
          src="/icons/openai.svg" 
          alt="ChatGPT" 
          className="w-5 h-5"
        />
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.05, y: -2 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleCopy}
        disabled={!prompt.trim()}
        className="
          w-10 h-10 rounded-lg
          bg-[var(--bg-surface)] border border-[var(--border-default)]
          text-[var(--fg-muted)]
          hover:border-[var(--border-emphasis)] hover:text-[var(--fg-secondary)]
          disabled:opacity-40 disabled:cursor-not-allowed
          transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-[var(--skelica-accent)] focus:ring-offset-2 focus:ring-offset-[var(--bg-base)]
        "
        aria-label={t('copy_prompt')}
        title={t('copy')}
      >
        {copied ? (
          <Check className="w-4 h-4 text-[var(--color-success)] mx-auto" />
        ) : (
          <Copy className="w-4 h-4 mx-auto" />
        )}
      </motion.button>
    </div>
  );
}
