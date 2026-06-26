import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Loader2, Copy, Check, Sparkles, Keyboard } from 'lucide-react';
import { t } from '../i18n';

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  onAnalyze: () => void;
  loading?: boolean;
}

export function PromptInput({ value, onChange, onAnalyze, loading }: PromptInputProps) {
  const [copied, setCopied] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const hasContent = value.trim().length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative"
    >
      {/* Main Input Container */}
      <div 
        className={`
          relative bg-[var(--bg-surface)] border rounded-2xl overflow-hidden
          transition-all duration-300
          ${isFocused 
            ? 'border-[var(--skelica-accent)] shadow-[0_0_0_3px_var(--skelica-accent-soft)]' 
            : 'border-[var(--border-default)] hover:border-[var(--border-emphasis)]'
          }
        `}
      >
        {/* Textarea */}
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          data-testid="prompt-input"
          placeholder={t('prompt_placeholder')}
          className="w-full h-48 md:h-56 bg-transparent p-6 text-[var(--fg-primary)]
                   placeholder-[var(--fg-muted)] resize-none focus:outline-none
                   font-mono text-sm leading-relaxed"
          style={{
            minHeight: '12rem'
          }}
        />

        {/* Character count */}
        <div className="absolute bottom-4 right-4 text-xs text-[var(--fg-muted)]">
          {value.length.toLocaleString()} {t('characters')}
        </div>

        {/* Glow effect on focus */}
        <AnimatePresence>
          {isFocused && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'radial-gradient(ellipse at center, var(--skelica-accent-soft) 0%, transparent 70%)',
                opacity: 0.3
              }}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Action Buttons */}
      <motion.div 
        className="flex flex-wrap items-center justify-between gap-4 mt-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        {/* Left side - Secondary actions */}
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleCopy}
            disabled={!hasContent}
            className="flex items-center gap-2 px-4 py-2 rounded-lg 
                     bg-[var(--bg-elevated)] text-[var(--fg-secondary)] 
                     border border-[var(--border-default)]
                     hover:border-[var(--border-emphasis)] hover:text-[var(--fg-primary)]
                     disabled:opacity-40 disabled:cursor-not-allowed
                     transition-all duration-200 text-sm"
          >
            <AnimatePresence mode="wait">
              {copied ? (
                <motion.span
                  key="check"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="flex items-center gap-2 text-[var(--color-success)]"
                >
                  <Check className="w-4 h-4" />
                  {t('copied')}
                </motion.span>
              ) : (
                <motion.span
                  key="copy"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="flex items-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  {t('copy')}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>

        {/* Right side - Primary action */}
        <motion.button
          data-testid="analyze-button"
          whileHover={{ scale: 1.02, boxShadow: '0 0 30px var(--skelica-glow)' }}
          whileTap={{ scale: 0.98 }}
          onClick={onAnalyze}
          disabled={!hasContent || loading}
          className="flex items-center gap-2 px-8 py-3 rounded-xl 
                   bg-gradient-to-r from-[var(--skelica-accent)] to-[var(--component-role)]
                   text-white font-semibold text-base
                   disabled:opacity-40 disabled:cursor-not-allowed
                   transition-all duration-200 shadow-lg"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              {t('analyzing')}
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              {t('analyze')}
            </>
          )}
        </motion.button>
      </motion.div>

      {/* Keyboard hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: hasContent ? 0.6 : 0 }}
        className="flex items-center justify-center gap-2 mt-3 text-xs text-[var(--fg-muted)]"
      >
        <Keyboard className="w-3 h-3" />
        <span>{t('press_enter_to_analyze')}</span>
      </motion.div>
    </motion.div>
  );
}
