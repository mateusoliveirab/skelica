import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Save, Trash2, Key, CheckCircle2 } from 'lucide-react';
import { SettingsStore } from '../config/settings';

interface SettingsPanelProps {
  onClose?: () => void;
}

export function SettingsPanel({ onClose }: SettingsPanelProps) {
  const [openaiKey, setOpenaiKey] = useState('');
  const [anthropicKey, setAnthropicKey] = useState('');
  const [showOpenaiKey, setShowOpenaiKey] = useState(false);
  const [showAnthropicKey, setShowAnthropicKey] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Load existing keys on mount
  useEffect(() => {
    const settings = SettingsStore.load();
    setOpenaiKey(settings.openaiApiKey || '');
    setAnthropicKey(settings.anthropicApiKey || '');
  }, []);

  const handleSave = () => {
    setSaveStatus('saving');
    
    try {
      if (openaiKey.trim()) {
        SettingsStore.setApiKey('openai', openaiKey.trim());
      }
      if (anthropicKey.trim()) {
        SettingsStore.setApiKey('anthropic', anthropicKey.trim());
      }
      
      setSaveStatus('saved');
      setTimeout(() => {
        setSaveStatus('idle');
        if (onClose) onClose();
      }, 1500);
    } catch (error) {
      if (import.meta.env.DEV) console.error('Failed to save settings:', error);
      setSaveStatus('idle');
    }
  };

  const handleClearOpenai = () => {
    setOpenaiKey('');
    SettingsStore.clearApiKey('openai');
  };

  const handleClearAnthropic = () => {
    setAnthropicKey('');
    SettingsStore.clearApiKey('anthropic');
  };

  const hasOpenaiKey = SettingsStore.hasApiKey('openai');
  const hasAnthropicKey = SettingsStore.hasApiKey('anthropic');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="w-full max-w-2xl mx-auto p-6"
    >
      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--skelica-accent)] to-[var(--component-role)] flex items-center justify-center">
              <Key className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--fg-primary)]">
                API Configuration
              </h2>
              <p className="text-sm text-[var(--fg-muted)] mt-0.5">
                Configure your LLM provider API keys
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* OpenAI Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-[var(--fg-primary)]">
                  OpenAI API Key
                </label>
                {hasOpenaiKey && (
                  <span className="flex items-center gap-1 text-xs text-[var(--color-success)] bg-[var(--color-success-bg)] px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3 h-3" />
                    Configured
                  </span>
                )}
              </div>
              {openaiKey && (
                <button
                  onClick={handleClearOpenai}
                  className="text-xs text-[var(--fg-muted)] hover:text-[var(--color-error)] transition-colors flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  Clear
                </button>
              )}
            </div>
            
            <div className="relative">
              <input
                type={showOpenaiKey ? 'text' : 'password'}
                value={openaiKey}
                onChange={(e) => setOpenaiKey(e.target.value)}
                placeholder="sk-..."
                className="w-full px-4 py-3 pr-12 bg-[var(--bg-elevated)] border border-[var(--border-default)] 
                         rounded-lg text-sm text-[var(--fg-primary)] placeholder:text-[var(--fg-muted)]
                         focus:outline-none focus:border-[var(--border-focus)] focus:ring-2 focus:ring-[var(--skelica-accent-soft)]
                         transition-all duration-200"
              />
              <button
                onClick={() => setShowOpenaiKey(!showOpenaiKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--fg-muted)] hover:text-[var(--fg-secondary)] transition-colors"
              >
                {showOpenaiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            
            <p className="text-xs text-[var(--fg-muted)]">
              Get your API key from{' '}
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--skelica-accent)] hover:underline"
              >
                platform.openai.com
              </a>
            </p>
          </div>

          {/* Anthropic Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-[var(--fg-primary)]">
                  Anthropic API Key
                </label>
                {hasAnthropicKey && (
                  <span className="flex items-center gap-1 text-xs text-[var(--color-success)] bg-[var(--color-success-bg)] px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3 h-3" />
                    Configured
                  </span>
                )}
              </div>
              {anthropicKey && (
                <button
                  onClick={handleClearAnthropic}
                  className="text-xs text-[var(--fg-muted)] hover:text-[var(--color-error)] transition-colors flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  Clear
                </button>
              )}
            </div>
            
            <div className="relative">
              <input
                type={showAnthropicKey ? 'text' : 'password'}
                value={anthropicKey}
                onChange={(e) => setAnthropicKey(e.target.value)}
                placeholder="sk-ant-..."
                className="w-full px-4 py-3 pr-12 bg-[var(--bg-elevated)] border border-[var(--border-default)] 
                         rounded-lg text-sm text-[var(--fg-primary)] placeholder:text-[var(--fg-muted)]
                         focus:outline-none focus:border-[var(--border-focus)] focus:ring-2 focus:ring-[var(--skelica-accent-soft)]
                         transition-all duration-200"
              />
              <button
                onClick={() => setShowAnthropicKey(!showAnthropicKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--fg-muted)] hover:text-[var(--fg-secondary)] transition-colors"
              >
                {showAnthropicKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            
            <p className="text-xs text-[var(--fg-muted)]">
              Get your API key from{' '}
              <a
                href="https://console.anthropic.com/settings/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--skelica-accent)] hover:underline"
              >
                console.anthropic.com
              </a>
            </p>
          </div>

          {/* Security Notice */}
          <div className="p-4 bg-[var(--color-info-bg)] border border-[var(--color-info)]/30 rounded-lg">
            <p className="text-xs text-[var(--fg-secondary)] leading-relaxed">
              🔒 Your API keys are stored locally in your browser and never sent to our servers. 
              They are only used to communicate directly with OpenAI and Anthropic APIs.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[var(--border-subtle)] flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-[var(--fg-secondary)] hover:text-[var(--fg-primary)] transition-colors"
          >
            Cancel
          </button>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSave}
            disabled={saveStatus === 'saving' || saveStatus === 'saved'}
            className="px-6 py-2 bg-[var(--skelica-accent)] text-[var(--fg-inverse)] rounded-lg
                     text-sm font-medium hover:opacity-90 transition-all duration-200
                     disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saveStatus === 'saving' && (
              <div className="w-4 h-4 border-2 border-[var(--fg-inverse)]/30 border-t-[var(--fg-inverse)] rounded-full animate-spin" />
            )}
            {saveStatus === 'saved' && <CheckCircle2 className="w-4 h-4" />}
            {saveStatus === 'idle' && <Save className="w-4 h-4" />}
            {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved!' : 'Save Settings'}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
