/**
 * Shared contract for structured optimize-prompt output (ADR-0003).
 * The provider classifies each suggestion into a component itself —
 * clients no longer guess it from suggestion text via regex.
 */

export const COMPONENT_TYPES = [
  'role',
  'context',
  'instruction',
  'constraint',
  'negative_constraint',
  'example',
  'format',
  'audience',
  'tone',
  'general',
] as const;

export type ComponentType = (typeof COMPONENT_TYPES)[number];

export interface StructuredOptimizeResponse {
  optimizedPrompt: string;
  componentsForSuggestions: string[];
}

export function buildSystemPrompt(suggestions: string[], persona: string): string {
  return `You are ${persona}.
Improve the following prompt by addressing these issues: ${suggestions.join(', ')}

For each issue, in the exact order given, classify which prompt component it addresses
(one of: ${COMPONENT_TYPES.join(', ')}). Provide only the improved prompt and that
per-issue classification — no explanations or additional commentary.`;
}

export function toSuggestionsApplied(
  parsed: StructuredOptimizeResponse | undefined,
  suggestions: string[]
): Array<{ component: string; suggestedImprovement: string }> {
  return suggestions.map((suggestedImprovement, i) => ({
    component: parsed?.componentsForSuggestions?.[i] ?? 'general',
    suggestedImprovement,
  }));
}
