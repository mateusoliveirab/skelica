/**
 * Fase 2 — the semantic classifier is the *authority*, not an add-on.
 *
 * The regex pass still runs first because it is instant and free; the semantic pass runs
 * whenever the model is available and is allowed to correct it. These tests pin the exact
 * rules, because "the model can override the regex" is only safe if the boundaries of that
 * power are explicit and tested.
 *
 * Thresholds come from `anatomyParser.ts`:
 *   SEMANTIC_FILL     = 0.90 — confident enough to ADD a component the regex missed
 *   SEMANTIC_OVERRIDE = 0.93 — confident enough to CONTRADICT a regex match
 */

import { describe, it, expect } from 'vitest';
import { getAnatomyParser } from '../anatomyParser';

type ScoreMap = Record<string, Record<string, number>>;

const parser = getAnatomyParser();
const typesFor = (text: string, map?: ScoreMap) =>
  parser.parse(text, map).components.map((c) => c.componentType);

/** Regex finds `instruction` covering the first sentence; the second is untouched. */
const TWO_SENTENCES = 'Write a function. The report was submitted late.';
const SECOND_SENTENCE = 'The report was submitted late.';
const FIRST_SENTENCE = 'Write a function.';

describe('Semantic authority over the regex pass', () => {
  describe('fill — add what the regex missed', () => {
    it('adds a component when nothing overlaps the sentence and confidence clears the floor', () => {
      const types = typesFor(TWO_SENTENCES, { [SECOND_SENTENCE]: { example: 0.95 } });
      expect(types).toContain('instruction');
      expect(types).toContain('example');
    });

    it('ignores a score below the fill floor', () => {
      const types = typesFor(TWO_SENTENCES, { [SECOND_SENTENCE]: { example: 0.85 } });
      expect(types).toEqual(['instruction']);
    });
  });

  describe('override — correct the regex', () => {
    it('replaces a regex claim contained in the sentence when confidence is high', () => {
      const types = typesFor(TWO_SENTENCES, { [FIRST_SENTENCE]: { context: 0.95 } });
      expect(types).toEqual(['context']);
    });

    it('does NOT contradict the regex between the fill and override thresholds', () => {
      const types = typesFor(TWO_SENTENCES, { [FIRST_SENTENCE]: { context: 0.91 } });
      expect(types).toEqual(['instruction']);
    });
  });

  describe('agreement and span safety', () => {
    it('keeps the regex span and does not duplicate when both agree', () => {
      const result = parser.parse(TWO_SENTENCES, { [FIRST_SENTENCE]: { instruction: 0.95 } });
      const instructions = result.components.filter((c) => c.componentType === 'instruction');
      expect(instructions).toHaveLength(1);
      // The regex span is tighter than the sentence, so it is kept.
      expect(result.components[0].start).toBe(0);
      expect(result.components[0].end).toBe(FIRST_SENTENCE.length);
    });

    it('does not overturn a component that reaches beyond the sentence', () => {
      // `expandRoleContent` extends this role across the line break, so a single sentence's
      // classification is not enough evidence to replace it.
      const text = 'You are a developer.\nYou have 10 years of experience.';
      const types = typesFor(text, { 'You have 10 years of experience.': { context: 0.95 } });
      expect(types).toEqual(['role']);
    });
  });

  describe('without a semantic map the regex result is unchanged', () => {
    it('returns the pattern-only components', () => {
      expect(typesFor(TWO_SENTENCES)).toEqual(['instruction']);
    });
  });
});
