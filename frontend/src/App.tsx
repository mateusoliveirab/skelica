import { motion, AnimatePresence } from 'framer-motion';
import { t } from './i18n';
import { useState, useEffect, useCallback } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Info, Settings, Wand2 } from 'lucide-react';
import { PromptInput } from './components/PromptInput';
import { ScoreCard } from './components/ScoreCard';
import { AnatomyView } from './components/AnatomyView';
import { ComponentsChecklist } from './components/ComponentsChecklist';
import { usePromptAnalysis } from './hooks/usePromptAnalysis';
import { Logo } from './components/Logo';
import { AboutPage } from './pages/AboutPage';
import { SettingsPanel } from './components/SettingsPanel';
import { ErrorBoundary } from './components/ErrorBoundary';

const queryClient = new QueryClient();

function MainApp() {
  const [prompt, setPrompt] = useState(
    `You are an expert UX researcher and product strategist with 10 years of experience in fintech onboarding.\n\n## Context\nWe are redesigning the onboarding flow for a fintech app. The current drop-off rate is 68% at step 3 of 5. Users are millennials and Gen Z — tech-savvy but cautious about sharing financial data.\n\n## Task\nAnalyze the onboarding screen designs and identify the top 3 friction points causing user drop-off. For each one, propose a specific and testable solution grounded in UX principles.\n\nFor example: if a screen has a long form, suggest progressive disclosure and explain how it reduces cognitive load by breaking information into smaller steps.\n\n## Constraints\n- Each solution must be implementable in under 2 weeks by a team of 2 developers.\n- Do not include third-party integrations or any changes that require backend work.\n\n## Output Format\nStructure each friction point as follows:\n1. Issue + severity (1–5)\n2. Root cause\n3. Proposed fix\n4. Success metric\n\n## Audience\nTarget audience: product designers and frontend engineers reviewing this report together.\n\nTone: professional but accessible — avoid jargon without explanation.`
  );
  const [showResults, setShowResults] = useState(false);
  const { analysis, score, loading, error, modelReady, downloadProgress, analyze } = usePromptAnalysis();

  const handleAnalyze = useCallback(() => {
    analyze(prompt);
    setShowResults(true);
  }, [analyze, prompt]);

  useEffect(() => {
    if (!prompt.trim()) {
      setShowResults(false);
    }
  }, [prompt]);

  // Hide results while loading a new one to ensure fresh state
  useEffect(() => {
    if (loading) {
      setShowResults(false);
    } else if (analysis) {
      setShowResults(true);
    }
  }, [loading, analysis]);

  return (
    <div className="min-h-screen bg-[var(--bg-base)] overflow-x-hidden flex flex-col">
      {/* Model Loading Progress */}
      <AnimatePresence>
        {!modelReady && downloadProgress > 0 && downloadProgress < 100 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4"
          >
            <div className="bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-2xl p-4 shadow-2xl backdrop-blur-md">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-[var(--fg-secondary)] flex items-center gap-2">
                  <Wand2 className="w-3 h-3 text-[var(--skelica-accent)] animate-pulse" />
                  {t('loading_model')}
                </span>
                <span className="text-xs font-bold text-[var(--skelica-accent)]">
                  {Math.round(downloadProgress)}%
                </span>
              </div>
              <div className="h-1.5 w-full bg-[var(--bg-surface)] rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-gradient-to-r from-[var(--skelica-accent)] to-[var(--component-role)]"
                  initial={{ width: 0 }}
                  animate={{ width: `${downloadProgress}%` }}
                  transition={{ type: 'spring', damping: 20, stiffness: 100 }}
                />
              </div>
              <p className="text-[10px] text-[var(--fg-muted)] mt-2 text-center italic">
                {t('first_load_notice')}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content - centered vertically */}
      <div className="flex-1 flex flex-col items-center px-4 pt-[15vh] pb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="w-full max-w-3xl"
        >
          {/* Logo and title - smaller, more compact */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8"
          >
            <Logo />
              <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-[var(--fg-secondary)] text-base mt-3 tracking-wide"
              >
              {t('hero_subtitle')}
            </motion.p>
          </motion.div>

          {/* Prompt Input - the hero element */}
          <PromptInput
            value={prompt}
            onChange={setPrompt}
            onAnalyze={handleAnalyze}
            loading={loading}
          />
        </motion.div>

        {/* Results section - staggered narrative reveal */}
        <AnimatePresence mode="wait">
          {showResults && analysis && (
            <motion.div
              variants={{ visible: { transition: { staggerChildren: 0.18 } } }}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, y: 20, transition: { duration: 0.3 } }}
              className="w-full max-w-5xl mt-16"
            >
              {/* Step 1: Anatomy — observation */}
              <motion.div
                variants={{
                  hidden: { opacity: 0, y: 24 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }
                }}
              >
                <AnatomyView
                  prompt={analysis.prompt}
                  components={analysis.components}
                  detectedCount={analysis.components.filter(c => c.presence.present).length}
                />
              </motion.div>

              {/* Step 2: Score + Checklist — verdict + audit in one unified block */}
              <motion.div
                variants={{
                  hidden: { opacity: 0, y: 24 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }
                }}
                className="mt-5 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl overflow-hidden backdrop-blur-sm shadow-xl"
              >
                {score && <ScoreCard score={score} compact />}
                <div className="border-t border-[var(--border-subtle)]" />
                <ComponentsChecklist components={analysis.components} />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Toast notifications */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 right-6 bg-[var(--bg-elevated)] border border-[var(--border-default)]
                     rounded-xl px-5 py-3 shadow-xl flex items-center gap-3"
          >
            <div className="w-5 h-5 border-2 border-[var(--border-default)] border-t-[var(--skelica-accent)] rounded-full animate-spin" />
            <span className="text-sm text-[var(--fg-secondary)]">{t('analyzing')}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="fixed bottom-6 right-6 bg-[var(--color-error-bg)] border border-[var(--color-error)] 
                     rounded-xl px-5 py-3 shadow-xl max-w-sm"
          >
            <span className="text-sm text-[var(--color-error)]">{error}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AppContent() {
  const [currentPage, setCurrentPage] = useState<'home' | 'about'>('home');
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      {/* Fixed Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 px-4 flex items-center bg-[var(--bg-base)]/80 backdrop-blur-md border-b border-[var(--border-subtle)]">
        <div className="w-full max-w-6xl mx-auto flex items-center justify-between">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setCurrentPage('home')}
            className="text-xl font-bold text-[var(--fg-primary)] hover:text-[var(--skelica-accent)] transition-colors"
          >
            skelica
          </motion.button>

          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowSettings(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-[var(--fg-secondary)]
                       hover:text-[var(--fg-primary)] transition-colors"
            >
              <Settings className="w-4 h-4" />
              {t('settings')}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCurrentPage(currentPage === 'about' ? 'home' : 'about')}
              className="flex items-center gap-2 px-4 py-2 text-sm text-[var(--fg-secondary)]
                       hover:text-[var(--fg-primary)] transition-colors"
            >
              <Info className="w-4 h-4" />
              {currentPage === 'about' ? t('home') : t('about')}
            </motion.button>
          </div>
        </div>
      </nav>

      {/* Page content with offset for fixed header */}
      <div className="pt-16">
        <AnimatePresence mode="wait">
          {currentPage === 'home' ? (
            <motion.div
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="w-full"
            >
              <MainApp />
            </motion.div>
          ) : (
            <motion.div
              key="about"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <AboutPage />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSettings(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999]"
            />

            {/* Modal */}
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="w-full max-w-2xl"
              >
                <SettingsPanel onClose={() => setShowSettings(false)} />
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AppContent />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
