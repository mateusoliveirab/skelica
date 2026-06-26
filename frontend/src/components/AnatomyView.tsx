import { motion, AnimatePresence } from 'framer-motion';
import React, { useState, useMemo } from 'react';
import { COMPONENT_COLORS, COMPONENT_LABELS, COMPONENT_DESCRIPTIONS, type PromptComponent } from '../api/types';
import type { AnalysisResult } from '../api/types';
import { t } from '../i18n';

interface AnatomyViewProps {
  prompt: string;
  components: AnalysisResult[];
  detectedCount?: number;
}

function highlightText(
  text: string, 
  components: AnalysisResult[]
): Array<{ text: string; component: PromptComponent | null; key: number }> {
  const presentComponents = components.filter(c => c.presence.present && c.start !== undefined && c.end !== undefined);
  
  if (!presentComponents.length) {
    return [{ text, component: null, key: 0 }];
  }

  const matches: Array<{ start: number; end: number; component: PromptComponent }> = presentComponents.map(c => ({
    start: c.start!,
    end: c.end!,
    component: c.component,
  }));

  matches.sort((a, b) => a.start - b.start);

  const filtered: typeof matches = [];
  for (const m of matches) {
    const overlaps = filtered.some(f => m.start < f.end && m.end > f.start);
    if (!overlaps) {
      filtered.push(m);
    }
  }

  const result: Array<{ text: string; component: PromptComponent | null; key: number }> = [];
  let lastEnd = 0;
  let key = 0;

  for (const m of filtered) {
    if (m.start > lastEnd) {
      result.push({ text: text.slice(lastEnd, m.start), component: null, key: key++ });
    }
    result.push({ text: text.slice(m.start, m.end), component: m.component, key: key++ });
    lastEnd = m.end;
  }

  if (lastEnd < text.length) {
    result.push({ text: text.slice(lastEnd), component: null, key: key++ });
  }

  return result;
}

export const AnatomyView = React.memo(function AnatomyView({ prompt, components, detectedCount }: AnatomyViewProps) {
  const [hoveredComponent, setHoveredComponent] = useState<PromptComponent | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = React.useRef<HTMLDivElement>(null);
  const highlighted = useMemo(() => highlightText(prompt, components), [prompt, components]);

  if (!prompt.trim()) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl p-6 backdrop-blur-sm"
      >
        <h2 className="text-lg font-semibold text-[var(--fg-primary)] mb-4">{t('anatomy_section_title')}</h2>
        <p className="text-[var(--fg-muted)] text-sm">{t('enter_prompt_notice')}</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      data-testid="anatomy-view"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl p-6 backdrop-blur-sm shadow-xl"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-[var(--fg-primary)]">{t('anatomy_section_title')}</h2>
          {detectedCount !== undefined && (
            <span className="text-xs font-mono text-[var(--skelica-accent)] bg-[var(--skelica-accent-soft)] px-2 py-0.5 rounded-full">
              {detectedCount} detected
            </span>
          )}
        </div>
        <AnimatePresence>
          {hoveredComponent && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="flex items-center gap-2"
            >
              <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider"
                style={{
                  backgroundColor: `${COMPONENT_COLORS[hoveredComponent]}20`,
                  color: COMPONENT_COLORS[hoveredComponent],
                  border: `1px solid ${COMPONENT_COLORS[hoveredComponent]}40`
                }}
              >
                {COMPONENT_LABELS[hoveredComponent]}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div
        className="relative"
        ref={containerRef}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
        }}
      >
        <div className="bg-[var(--bg-base)] rounded-lg p-6 font-mono text-sm leading-relaxed min-h-[120px] whitespace-pre-wrap">
          {highlighted.map((segment) => (
            segment.component ? (
              <motion.span
                key={segment.key}
                initial={{ backgroundColor: 'transparent' }}
                animate={{
                  backgroundColor: `${COMPONENT_COLORS[segment.component]}25`,
                }}
                whileHover={{
                  backgroundColor: `${COMPONENT_COLORS[segment.component]}45`,
                }}
                className="cursor-default rounded px-0.5 transition-all duration-200"
                style={{
                  borderBottom: `2px solid ${COMPONENT_COLORS[segment.component]}`,
                }}
                onMouseEnter={() => setHoveredComponent(segment.component)}
                onMouseLeave={() => setHoveredComponent(null)}
              >
                {segment.text}
              </motion.span>
            ) : (
              <span key={segment.key} className="text-[var(--fg-muted)] opacity-70">
                {segment.text}
              </span>
            )
          ))}
        </div>

        {/* Tooltip — follows mouse cursor */}
        <AnimatePresence>
          {hoveredComponent && (() => {
            const containerW = containerRef.current?.offsetWidth ?? 600;
            const tooltipW = 280;
            const offsetX = 14;
            const offsetY = 14;
            const left = mousePos.x + offsetX + tooltipW > containerW
              ? mousePos.x - tooltipW - offsetX
              : mousePos.x + offsetX;
            const top = mousePos.y + offsetY;
            return (
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.1 }}
                className="absolute p-3 bg-[var(--bg-elevated)] border border-[var(--border-emphasis)] rounded-lg shadow-lg pointer-events-none z-20"
                style={{ left, top, width: tooltipW }}
              >
                <p className="text-xs text-[var(--fg-primary)] leading-relaxed">
                  <span className="font-bold" style={{ color: COMPONENT_COLORS[hoveredComponent] }}>
                    {COMPONENT_LABELS[hoveredComponent]}:
                  </span>{' '}
                  {COMPONENT_DESCRIPTIONS[hoveredComponent]}
                </p>
              </motion.div>
            );
          })()}
        </AnimatePresence>
      </div>

      <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-[var(--border-subtle)]">
        {Object.entries(COMPONENT_COLORS).map(([comp, color]) => {
          const hasComponent = components.some(c => c.component === comp && c.presence.present);
          return (
            <div
              key={comp}
              className={`flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-tight transition-opacity duration-300
                ${hasComponent ? 'opacity-100' : 'opacity-30'}`}
            >
              <div 
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: color }}
              />
              {COMPONENT_LABELS[comp as PromptComponent]}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
});
