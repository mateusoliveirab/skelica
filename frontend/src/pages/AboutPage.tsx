import { motion, AnimatePresence } from 'framer-motion';
import { t } from '../i18n';
import { useState } from 'react';
import { ChevronDown, Target, Zap, Eye, GitBranch, ArrowRight, Sparkles } from 'lucide-react';

const benefits = [
  { icon: Target, title: t('benefit_precision_title'), description: t('benefit_precision_desc') },
  { icon: Zap,     title: t('benefit_token_title'),     description: t('benefit_token_desc') },
  { icon: Eye,     title: t('benefit_clarity_title'),   description: t('benefit_clarity_desc') },
  { icon: GitBranch, title: t('benefit_results_title'),  description: t('benefit_results_desc') }
];

const faqs = [
  { question: t('faq_question_0'), answer: t('faq_answer_0') },
  { question: t('faq_question_1'), answer: t('faq_answer_1') },
  { question: t('faq_question_2'), answer: t('faq_answer_2') },
  { question: t('faq_question_3'), answer: t('faq_answer_3') },
  { question: t('faq_question_4'), answer: t('faq_answer_4') },
  { question: t('faq_question_5'), answer: t('faq_answer_5') },
  { question: t('faq_question_6'), answer: t('faq_answer_6') },
  { question: t('faq_question_7'), answer: t('faq_answer_7') }
];

function FAQItem({ question, answer, isOpen, onClick }: { 
  question: string; 
  answer: string; 
  isOpen: boolean; 
  onClick: () => void;
}) {
  return (
    <div className="border-b border-[var(--border-subtle)]">
      <button
        onClick={onClick}
        className="w-full flex items-center justify-between py-6 text-left group"
      >
        <span className={`text-lg font-medium transition-colors duration-200 ${
          isOpen ? 'text-[var(--skelica-accent)]' : 'text-[var(--fg-primary)] group-hover:text-[var(--skelica-accent)]'
        }`}>
          {question}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex-shrink-0 ml-4"
        >
          <ChevronDown className={`w-5 h-5 transition-colors duration-200 ${
            isOpen ? 'text-[var(--skelica-accent)]' : 'text-[var(--fg-muted)]'
          }`} />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <p className="pb-6 text-[var(--fg-secondary)] leading-relaxed max-w-[90%]">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function AboutPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="min-h-screen bg-[var(--bg-base)] overflow-x-hidden">
      {/* Background effects - adjusted for header */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 left-1/4 w-80 h-80 bg-[var(--skelica-accent-soft)] rounded-full blur-[100px] opacity-20" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[var(--component-role-bg)] rounded-full blur-[100px] opacity-15" />
      </div>

      <div className="relative">
        {/* Hero - compact, centered */}
        <section className="min-h-[70vh] flex items-center justify-center px-4 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl mx-auto text-center"
          >
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-xs uppercase tracking-[0.2em] text-[var(--skelica-accent)] mb-4"
            >
              About
            </motion.p>

              <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-[var(--fg-primary)] mb-6 leading-tight">
                {t('about_headline')}
              </h1>

            <p className="text-base md:text-lg text-[var(--fg-secondary)] max-w-lg mx-auto mb-8">
              O skelica disseca seus prompts como um cirurgiao mestre — revelando o que funciona, 
              o que nao funciona e como transformar o bom em extraordinario.
            </p>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => window.location.href = '/'}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--skelica-accent)] text-[var(--bg-base)] 
                       rounded-xl font-semibold text-sm hover:brightness-110 transition-all duration-200"
            >
              <Sparkles className="w-4 h-4" />
              {t('try_now')}
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </motion.div>
        </section>

        {/* What is skelica */}
        <section className="px-4 py-16">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="grid md:grid-cols-2 gap-8 items-start"
            >
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-[var(--fg-primary)] mb-4">
                  {t('about_headline')}
                </h2>
            <p className="text-base text-[var(--fg-secondary)] leading-relaxed mb-4">
              {t('hero_subtitle')}
            </p>
            <p className="text-base text-[var(--fg-secondary)] leading-relaxed">
              {t('hero_subtitle')}
            </p>
              </div>
              {/* Benefits grid - compact */}
              <div className="grid grid-cols-2 gap-3">
                {benefits.map((benefit, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * idx, duration: 0.4 }}
                    className="p-4 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl hover:border-[var(--border-emphasis)] transition-all"
                  >
                    <div className="w-10 h-10 rounded-lg bg-[var(--skelica-accent-soft)] flex items-center justify-center mb-3">
                      <benefit.icon className="w-5 h-5 text-[var(--skelica-accent)]" />
                    </div>
                    <h3 className="text-sm font-semibold text-[var(--fg-primary)] mb-1">
                      {benefit.title}
                    </h3>
                    <p className="text-xs text-[var(--fg-secondary)] leading-relaxed">
                      {benefit.description}
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* FAQ */}
        <section className="px-4 py-16 bg-[var(--bg-surface)]">
          <div className="max-w-2xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center mb-10"
            >
              <h2 className="text-2xl md:text-3xl font-bold text-[var(--fg-primary)] mb-2">
                {t('faq_title')}
              </h2>
              <p className="text-sm text-[var(--fg-secondary)]">
                {t('faq_title')}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {faqs.map((faq, idx) => (
                <FAQItem
                  key={idx}
                  question={faq.question}
                  answer={faq.answer}
                  isOpen={openFaq === idx}
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                />
              ))}
            </motion.div>
          </div>
        </section>

        {/* CTA */}
        <section className="px-4 py-12">
          <div className="max-w-xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="p-8 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-2xl"
            >
              <h2 className="text-xl md:text-2xl font-bold text-[var(--fg-primary)] mb-3">
                {t('get_started')}
              </h2>
              <p className="text-sm text-[var(--fg-secondary)] mb-6">
                {t('hero_subtitle')}
              </p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => window.location.href = '/'}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--skelica-accent)] text-[var(--bg-base)] 
                         rounded-xl font-semibold text-sm"
              >
                <Sparkles className="w-4 h-4" />
                {t('get_started')}
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </motion.div>
          </div>
        </section>

        <footer className="px-4 py-6 text-center text-xs text-[var(--fg-muted)]">
          <p>© 2026 skelica</p>
        </footer>
      </div>
    </div>
  );
}
