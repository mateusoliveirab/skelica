/**
 * Regression tests for prompt analysis using the golden validation dataset.
 *
 * These tests ensure that changes to the anatomy parser, scorer, or patterns
 * do not break expected behavior. Run after any update to:
 * - anatomyParser.ts
 * - scorer.ts
 * - patterns (anatomyPatterns)
 *
 * Tiered suites:
 * - core (default): npm run test:prompts — ~11 prompts, ~100ms
 * - full: TEST_TIER=full npm run test:prompts — all ~26 prompts, ~300ms
 */

import { describe, it, expect } from 'vitest';
import { getAnatomyParser } from '../core/anatomyParser';
import { Scorer } from '../core/scorer';

import validationData from '../data/validation-prompts.json';
import semanticMocks from '../data/semantic-mocks.json';

type PresenceExpectation = 'present' | 'partial' | 'absent';
type _ComponentKey =
  | 'role'
  | 'context'
  | 'instruction'
  | 'example'
  | 'constraint'
  | 'format'
  | 'audience'
  | 'tone';

interface ValidationPrompt {
  id: string;
  section?: string;
  tier?: 'core' | 'full';
  category: string;
  label: string;
  text: string;
  expected: Record<string, PresenceExpectation>;
  scoreRange: { min: number; max: number };
}

const allPrompts = validationData.prompts as ValidationPrompt[];
const tier = (typeof process !== 'undefined' && process.env?.TEST_TIER) || 'core';
const prompts = allPrompts.filter(
  (p) => tier === 'full' || p.tier === 'core' || !p.tier
);

const COMPONENT_MAP: Record<string, string> = {
  role: 'role',
  context: 'context',
  instruction: 'instruction',
  example: 'example',
  constraint: 'constraint',
  format: 'format',
  audience: 'audience',
  tone: 'tone',
};

function isComponentDetected(componentType: string, detectedTypes: string[]): boolean {
  return detectedTypes.includes(componentType);
}

describe(`Validation Prompts — Regression Suite (tier: ${tier})`, () => {
  const parser = getAnatomyParser();
  const scorer = new Scorer();

  describe('Component Detection', () => {
    for (const prompt of prompts) {
      it(`${prompt.id} (${prompt.category}): ${prompt.label}`, () => {
        const anatomyResult = parser.parse(prompt.text);
        const detectedTypes = anatomyResult.components.map((c) => c.componentType);
        const mismatches: string[] = [];

        for (const [key, expected] of Object.entries(prompt.expected)) {
          const anatomyType = COMPONENT_MAP[key];
          if (!anatomyType) continue;
          const detected = isComponentDetected(anatomyType, detectedTypes);

          if (expected === 'present' && !detected) {
            mismatches.push(`${key}: expected present, got absent`);
          } else if (expected === 'absent' && detected) {
            mismatches.push(`${key}: expected absent, got present`);
          }
        }

        expect(
          mismatches,
          `Prompt ${prompt.id} component mismatches:\n${mismatches.join('\n')}`
        ).toHaveLength(0);
      });
    }
  });

  describe('Score Range', () => {
    for (const prompt of prompts) {
      it(`${prompt.id} (${prompt.category}): score within ${prompt.scoreRange.min}-${prompt.scoreRange.max}`, () => {
        const anatomyResult = parser.parse(prompt.text);
        const scoreResult = scorer.score(prompt.text, anatomyResult.components);
        const score = scoreResult.overall.score;
        const { min, max } = prompt.scoreRange;

        expect(
          score,
          `Prompt ${prompt.id}: expected score in [${min}, ${max}], got ${score.toFixed(3)} (grade: ${scoreResult.overall.grade})`
        ).toBeGreaterThanOrEqual(min);
        expect(score).toBeLessThanOrEqual(max);
      });
    }
  });

  describe('Ordering (bad < medium < good)', () => {
    it('bad prompts score lower than good prompts', () => {
      const badPrompts = prompts.filter((p) => p.category === 'bad');
      const goodPrompts = prompts.filter(
        (p) => p.category === 'good' || p.category === 'perfect'
      );

      if (badPrompts.length === 0 || goodPrompts.length === 0) return;

      const badScores = badPrompts.map((p) => {
        const anatomyResult = parser.parse(p.text);
        return scorer.score(p.text, anatomyResult.components).overall.score;
      });
      const goodScores = goodPrompts.map((p) => {
        const anatomyResult = parser.parse(p.text);
        return scorer.score(p.text, anatomyResult.components).overall.score;
      });

      const avgBad = badScores.reduce((a, b) => a + b, 0) / badScores.length;
      const avgGood = goodScores.reduce((a, b) => a + b, 0) / goodScores.length;

      expect(avgGood).toBeGreaterThan(avgBad);
    });
  });
});
