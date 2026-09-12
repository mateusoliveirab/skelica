import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Loader2, Copy, Check, Sparkles, Keyboard, Brain } from 'lucide-react';
import { t } from '../i18n';
import type { SemanticStatus } from '../hooks/usePromptAnalysis';

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  onAnalyze: () => void;
  loading?: boolean;
  semanticStatus?: SemanticStatus;
  downloadProgress?: number;
  onEnableSemantic?: () => void;
  refining?: boolean;
}

export function PromptInput({
  value,
  onChange,
  onAnalyze,
  loading,
  semanticStatus = 'idle',
  downloadProgress = 0,
  onEnableSemantic,
  refining = false,
}: PromptInputProps) {
  const [copied, setCopied] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const hasContent = value.trim().length > 0;

  const semanticNotice = semanticStatus === 'failed' ? t('semantic_failed') : null;

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
        <div className="flex flex-wrap items-center gap-2">
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

          {/* Semantic analysis loads on its own after the first result. The only case that
              needs a button is a connection that asked us not to download in the background. */}
          {semanticStatus === 'idle' && (
            <button
              type="button"
              data-testid="enable-semantic"
              title={t('semantic_enable_hint')}
              onClick={onEnableSemantic}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm border
                       bg-[var(--bg-elevated)] text-[var(--fg-muted)] border-[var(--border-default)]
                       hover:text-[var(--fg-secondary)] hover:border-[var(--border-emphasis)]
                       transition-all duration-200"
            >
              <Brain className="w-4 h-4" />
              {t('semantic_enable')}
            </button>
          )}

          {semanticStatus === 'loading' && (
            <span
              data-testid="semantic-loading"
              title={t('semantic_enable_hint')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm border
                       bg-[var(--bg-elevated)] text-[var(--fg-secondary)] border-[var(--border-default)]"
            >
              <Brain className="w-4 h-4 text-[var(--skelica-accent)] animate-pulse" />
              {Math.round(downloadProgress)}%
            </span>
          )}

          {semanticStatus === 'ready' && (
            <span
              data-testid="semantic-active"
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm border
                       bg-[var(--bg-elevated)] text-[var(--skelica-accent)] border-[var(--border-default)]"
            >
              <Brain className="w-4 h-4" />
              {t('semantic_active')}
            </span>
          )}
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

      {/* Semantic status — the pattern result is already on screen at this point */}
      <AnimatePresence>
        {(refining || semanticNotice || semanticStatus === 'loading') && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            data-testid="semantic-status"
            className="flex items-center justify-center gap-3 mt-3 text-xs text-[var(--fg-muted)]"
          >
            {refining || semanticStatus === 'loading' ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin text-[var(--skelica-accent)]" />
                <span>
                  {semanticStatus === 'loading' ? t('semantic_loading') : t('semantic_refining')}
                </span>
                {semanticStatus === 'loading' && downloadProgress > 0 && (
                  <span className="tabular-nums">{Math.round(downloadProgress)}%</span>
                )}
              </>
            ) : (
              <span>{semanticNotice}</span>
            )}
          </motion.div>
        )}
      </AnimatePresence>

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
