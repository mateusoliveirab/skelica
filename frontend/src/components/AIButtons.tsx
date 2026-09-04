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

interface Provider {
  id: string;
  labelKey: 'open_claude' | 'open_chatgpt';
  iconSrc: string;
  iconAlt: string;
  // Chat URL that accepts a `?q=` prefill param, without the trailing query string.
  baseUrl: string;
}

const PROVIDERS: Provider[] = [
  { id: 'claude', labelKey: 'open_claude', iconSrc: '/icons/claude.svg', iconAlt: 'Claude', baseUrl: 'https://claude.ai/new' },
  // chatgpt.com is the canonical domain; chat.openai.com 308-redirects here, so linking directly
  // skips that extra hop.
  { id: 'chatgpt', labelKey: 'open_chatgpt', iconSrc: '/icons/openai.svg', iconAlt: 'ChatGPT', baseUrl: 'https://chatgpt.com/' },
];

// Past this length, prefilling the URL risks silent truncation by an intermediate proxy, CDN, or
// the destination's own router — well under real browser limits, but common infra caps sit lower.
// Above it we copy the prompt and open a blank chat instead of gambling on a broken deep link.
const SAFE_URL_PROMPT_LENGTH = 6000;

export function AIButtons({ prompt, analysis }: AIButtonsProps) {
  const [copied, setCopied] = useState(false);
  const [handoffCopiedFor, setHandoffCopiedFor] = useState<string | null>(null);

  const enhancedPrompt = generateEnhancedPrompt(prompt, analysis);
  const promptToUse = analysis ? enhancedPrompt : prompt;
  const isTooLongForUrl = promptToUse.length > SAFE_URL_PROMPT_LENGTH;

  const openProvider = async (provider: Provider) => {
    if (isTooLongForUrl) {
      try {
        await navigator.clipboard.writeText(promptToUse);
        setHandoffCopiedFor(provider.id);
        setTimeout(() => setHandoffCopiedFor(null), 2500);
      } catch {
        // Clipboard denied — still open the provider so the user isn't stuck with a dead button.
      }
      window.open(provider.baseUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    window.open(`${provider.baseUrl}?q=${encodeURIComponent(promptToUse)}`, '_blank', 'noopener,noreferrer');
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

  return (
    <div className="flex items-center gap-2">
      {PROVIDERS.map((provider) => {
        const justCopiedForHandoff = handoffCopiedFor === provider.id;
        const label = justCopiedForHandoff ? t('prompt_copied_paste_notice') : t(provider.labelKey);
        return (
          <motion.button
            key={provider.id}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => openProvider(provider)}
            className="
              w-10 h-10 rounded-lg
              bg-[var(--bg-elevated)] border border-[var(--border-default)]
              flex items-center justify-center
              hover:border-[var(--border-emphasis)]
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-[var(--skelica-accent)] focus:ring-offset-2 focus:ring-offset-[var(--bg-base)]
            "
            aria-label={label}
            title={label}
          >
            {justCopiedForHandoff ? (
              <Check className="w-4 h-4 text-[var(--color-success)]" />
            ) : (
              <img src={provider.iconSrc} alt={provider.iconAlt} className="w-5 h-5" />
            )}
          </motion.button>
        );
      })}

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
