import { motion, AnimatePresence } from 'framer-motion';
import React, { useState } from 'react';
import { COMPONENT_COLORS, COMPONENT_LABELS, COMPONENT_DESCRIPTIONS, type PromptComponent } from '../api/types';
import type { AnalysisResult } from '../api/types';

interface ComponentsChecklistProps {
  components: AnalysisResult[];
}

const ALL_COMPONENTS: PromptComponent[] = [
  'role',
  'context', 
  'instruction',
  'example',
  'constraint',
  'negative_constraint',
  'output_format',
  'audience',
  'tone',
];

export const ComponentsChecklist = React.memo(function ComponentsChecklist({ components }: ComponentsChecklistProps) {
  const [hoveredComp, setHoveredComp] = useState<PromptComponent | null>(null);
  const presentComponents = new Set(
    components.filter(c => c.presence.present).map(c => c.component)
  );

  return (
    <motion.div
      data-testid="components-checklist"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col p-6 relative"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-[var(--fg-primary)]">Component Checklist</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-[var(--fg-muted)]">
            {presentComponents.size}/{ALL_COMPONENTS.length}
          </span>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-3 content-start">
        {ALL_COMPONENTS.map((comp, idx) => {
          const isPresent = presentComponents.has(comp);
          const color = COMPONENT_COLORS[comp];
          
          return (
            <div key={comp} className="relative group">
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.03 }}
                onMouseEnter={() => setHoveredComp(comp)}
                onMouseLeave={() => setHoveredComp(null)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl
                  transition-all duration-200 cursor-default
                  ${isPresent
                    ? 'bg-[var(--bg-elevated)] border border-[var(--border-emphasis)] shadow-sm'
                    : 'bg-[var(--bg-base)] border border-dashed border-[var(--border-subtle)] opacity-55'
                  }
                `}
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center transition-transform duration-300
                    ${isPresent ? 'scale-110 shadow-lg' : 'scale-90'}`}
                  style={{
                    backgroundColor: isPresent ? color : 'transparent',
                    border: isPresent ? 'none' : `1px dashed ${color}50`
                  }}
                >
                  {isPresent ? (
                    <motion.svg
                      initial={{ scale: 0, rotate: -45 }}
                      animate={{ scale: 1, rotate: 0 }}
                      className="w-3 h-3 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={4}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </motion.svg>
                  ) : (
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                  )}
                </div>
                <span className="text-sm font-medium text-[var(--fg-primary)]">
                  {COMPONENT_LABELS[comp]}
                </span>
              </motion.div>

              {/* Precise Tooltip */}
              <AnimatePresence>
                {hoveredComp === comp && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 5 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 5 }}
                    className="absolute left-0 right-0 bottom-full mb-2 z-50 p-3 
                             bg-[var(--bg-elevated)] border border-[var(--border-emphasis)] 
                             rounded-lg shadow-2xl pointer-events-none"
                  >
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full w-0 h-0 
                                  border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent 
                                  border-t-[6px] border-t-[var(--border-emphasis)]" />
                    <p className="text-[11px] text-[var(--fg-primary)] leading-relaxed">
                      {COMPONENT_DESCRIPTIONS[comp]}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      <div className="mt-8 pt-4 border-t border-[var(--border-subtle)]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold uppercase tracking-widest text-[var(--fg-muted)]">Anatomy Coverage</span>
          <span className="text-sm font-bold text-[var(--skelica-accent)]">
            {Math.round((presentComponents.size / ALL_COMPONENTS.length) * 100)}%
          </span>
        </div>
        <div className="h-2 w-full bg-[var(--bg-base)] rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(presentComponents.size / ALL_COMPONENTS.length) * 100}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-full rounded-full bg-gradient-to-r from-[var(--skelica-accent)] to-[var(--component-role)]"
          />
        </div>
      </div>
    </motion.div>
  );
});
