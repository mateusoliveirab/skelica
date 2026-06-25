import type { PromptComponent } from '../api/types';

/**
 * Visual styling constants for prompt components
 */

export const COMPONENT_COLORS: Record<PromptComponent, string> = {
  role: '#3B82F6',
  context: '#8B5CF6',
  instruction: '#F97316',
  example: '#22C55E',
  constraint: '#EF4444',
  negative_constraint: '#B91C1C',
  output_format: '#06B6D4',
  audience: '#EC4899',
  tone: '#F59E0B',
};

export const COMPONENT_LABELS: Record<PromptComponent, string> = {
  role: 'Role Definition',
  context: 'Context',
  instruction: 'Instruction',
  example: 'Examples',
  constraint: 'Constraints',
  negative_constraint: 'Negative Constraints',
  output_format: 'Output Format',
  audience: 'Target Audience',
  tone: 'Tone/Style',
};
