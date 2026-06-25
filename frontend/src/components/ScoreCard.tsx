import { motion } from 'framer-motion';
import React from 'react';
import type { ScoreResponse } from '../api/types';
import { t } from '../i18n';

interface ScoreCardProps {
  score: ScoreResponse;
  compact?: boolean;
}

export const ScoreCard = React.memo(function ScoreCard({ score }: ScoreCardProps) {
  const getGradeColor = (grade: string) => {
    if (['A+', 'A', 'A-'].includes(grade)) return 'var(--score-excellent)';
    if (['B+', 'B', 'B-'].includes(grade)) return 'var(--score-good)';
    if (['C+', 'C', 'C-'].includes(grade)) return 'var(--score-fair)';
    if (['D+', 'D', 'D-'].includes(grade)) return 'var(--score-poor)';
    return 'var(--score-bad)';
  };

  const getScoreLabel = (s: number) => {
    if (s >= 80) return t('score_excellent');
    if (s >= 60) return t('score_good');
    if (s >= 40) return t('score_fair');
    return t('score_poor');
  };

  const gradeColor = getGradeColor(score.grade);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col p-6 relative overflow-hidden"
    >
      {/* Background glow behind grade */}
      <div
        className="absolute top-0 left-0 w-[40%] h-full pointer-events-none z-0"
        style={{
          background: `radial-gradient(ellipse at 50% 50%, ${gradeColor}12 0%, transparent 70%)`,
        }}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-4 relative z-10">
        <h2 className="text-lg font-semibold text-[var(--fg-primary)]">
          {t('quality_score')}
        </h2>
      </div>

      {/* Main Content - Horizontal 30/70 split */}
      <div className="flex-1 flex gap-5 relative z-10 min-h-0">

        {/* LEFT ~30% — Grade */}
        <div className="w-[30%] flex flex-col items-center justify-center relative shrink-0">
          <div
            className="absolute inset-0 pointer-events-none z-0"
            style={{
              background: `radial-gradient(circle at center, ${gradeColor} 0%, transparent 70%)`,
              opacity: 0.18,
              filter: 'blur(24px)',
            }}
          />
          <motion.span
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.3 }}
            className="relative z-10 text-7xl font-black tracking-tighter leading-none"
            style={{ color: gradeColor, textShadow: `0 0 28px ${gradeColor}50` }}
          >
            {score.grade}
          </motion.span>
          <div className="mt-3 text-center relative z-10">
            <span className="text-sm font-bold tracking-tight block" style={{ color: gradeColor }}>
              {getScoreLabel(score.overall_score)}
            </span>
            <p className="text-[10px] text-[var(--fg-muted)] font-medium uppercase tracking-widest mt-1">
              {score.component_scores?.length || 0} dim.
            </p>
          </div>
        </div>

        {/* Vertical divider */}
        <div
          className="w-px self-stretch shrink-0"
          style={{ background: `linear-gradient(180deg, transparent, ${gradeColor}50, transparent)` }}
        />

        {/* RIGHT ~70% — Recommendation */}
        {score.recommendations && (
          <div className="flex-1 flex flex-col justify-center min-w-0">
            <p className="text-sm text-[var(--fg-primary)] leading-relaxed mb-3">
              {score.recommendations}
            </p>
            <span className="block text-[11px] font-bold uppercase tracking-widest text-[var(--skelica-accent)]">
              Top Recommendation
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
});
