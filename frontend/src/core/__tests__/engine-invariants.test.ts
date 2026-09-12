/**
 * Architecture invariants for the analysis engine.
 *
 * These are not feature tests. They lock in the properties that make the engine safe to keep
 * building on, and they exist because every one of them was silently violated at some point:
 *
 *  - A language misdetection used to zero the entire analysis, because `detectLanguage` chose
 *    which single pattern set to load.
 *  - The three pattern sets had drifted apart (en 151 regexes, pt 131, es 92), so the same
 *    prompt scored differently depending on the language it happened to be read as.
 *  - Nothing measured the score gap between languages, which is how Portuguese prompts came to
 *    score ~0.22 lower than English ones in the same quality category.
 */

import { describe, it, expect } from 'vitest';
import { AnatomyParser, getAnatomyParser } from '../anatomyParser';
import { Scorer } from '../scorer';
import validationData from '../../data/validation-prompts.json';

interface ValidationPrompt {
  id: string;
  category: string;
  text: string;
  expected: Record<string, string>;
}

const prompts = validationData.prompts as ValidationPrompt[];
const ALL_LANGUAGES = ['en', 'pt', 'es'] as const;

/**
 * The union pass is private because it is an internal step, not a supported entry point.
 * Testing it directly is the point here: the invariant is about that step.
 */
type EngineInternals = {
  extractWithLanguageFallback(text: string, primaryLang: string): Array<{ componentType: string }>;
};
const internals = (parser: AnatomyParser) => parser as unknown as EngineInternals;

const detectedTypes = (parser: AnatomyParser, text: string, lang: string) =>
  new Set(internals(parser).extractWithLanguageFallback(text, lang).map((c) => c.componentType));

describe('Engine invariants', () => {
  const parser = getAnatomyParser();

  describe('language misdetection is survivable', () => {
    it('detects the same component types no matter which language is guessed', () => {
      const divergent: string[] = [];

      for (const prompt of prompts) {
        const [first, ...rest] = ALL_LANGUAGES.map((lang) => detectedTypes(parser, prompt.text, lang));
        for (const other of rest) {
          const equal =
            first.size === other.size && [...first].every((type) => other.has(type));
          if (!equal) {
            divergent.push(
              `${prompt.id}: ${[...first].sort().join(',')} vs ${[...other].sort().join(',')}`
            );
            break;
          }
        }
      }

      expect(
        divergent,
        `These prompts analyze differently depending on the detected language:\n${divergent.join('\n')}`
      ).toEqual([]);
    });

    it('never returns zero components for a prompt the dataset expects to have components', () => {
      // The dataset deliberately contains prompts with no structure at all, where an empty
      // result is correct. Only the rest must never come back empty.
      const shouldDetect = prompts.filter((prompt) =>
        Object.values(prompt.expected).some((presence) => presence === 'present')
      );

      const empty = shouldDetect
        .filter((prompt) => detectedTypes(parser, prompt.text, 'en').size === 0)
        .map((prompt) => prompt.id);

      expect(
        empty,
        `Prompts expected to have components but detected none: ${empty.join(', ')}`
      ).toEqual([]);
    });
  });

  describe('language detection', () => {
    it('does not mistake ordinary English for Portuguese or Spanish', () => {
      // Every one of these was misread as Portuguese before the lexicon required unique
      // evidence — "do", "no", "com", "email" and "para" are not Portuguese evidence.
      const englishPrompts = [
        'Do not use jargon.',
        'Do not use external libraries.',
        'Create a validator. For instance: validate("test@email.com") returns true.',
        'Given that we are building a web app, do not use external libraries.',
        'Write a résumé summary.',
        'No more than 100 words.',
        'You are a developer. Write a function with émojis 🚀 and ñ characters.',
      ];

      for (const text of englishPrompts) {
        expect(parser.detectLanguage(text), `misdetected: ${text}`).toBe('en');
      }
    });

    it('still detects genuine Portuguese and Spanish', () => {
      expect(parser.detectLanguage('Você é um desenvolvedor sênior. Escreva uma função que ordena números.')).toBe('pt');
      expect(parser.detectLanguage('Escreva uma função. Não use métodos nativos.')).toBe('pt');
      expect(parser.detectLanguage('Me explica DRE.')).toBe('pt');
      expect(parser.detectLanguage('Usted es un desarrollador senior. Escriba una función que ordena números.')).toBe('es');
      expect(parser.detectLanguage('Eres un desarrollador. Escribe una función para hacer algo muy importante.')).toBe('es');
    });
  });

  describe('language score parity (ratchet)', () => {
    /**
     * The scorer used to infer component presence from English keyword lists, so Portuguese
     * prompts scored ~0.248 lower than English prompts the dataset rates in the same category.
     * The dimensions now read presence from the parser's language-independent detection
     * (see `_presence` in scorer.ts), which brought the worst gap down to 0.077.
     *
     * This ceiling only ever goes DOWN. It fails if the bias returns, and tightening it is the
     * point. Remaining gap is small-sample noise ("good" has 13 English vs 5 Portuguese
     * prompts); the "perfect" category already has Portuguese scoring *higher*.
     */
    const MAX_ACCEPTED_GAP = 0.12;

    it('does not let the Portuguese/English score gap grow', () => {
      const scorer = new Scorer();

      const byCategory: Record<string, { en: number[]; pt: number[] }> = {};
      for (const prompt of prompts) {
        const language = prompt.id.startsWith('PT') ? 'pt' : 'en';
        const anatomy = parser.parse(prompt.text);
        const detected = Object.fromEntries(
          anatomy.components.map((c) => [c.componentType, c.confidence])
        );
        const { score } = scorer.score(prompt.text, detected).overall;

        byCategory[prompt.category] ??= { en: [], pt: [] };
        byCategory[prompt.category][language].push(score);
      }

      const average = (values: number[]) =>
        values.reduce((sum, value) => sum + value, 0) / values.length;

      const gaps: Record<string, number> = {};
      for (const [category, { en, pt }] of Object.entries(byCategory)) {
        if (en.length === 0 || pt.length === 0) continue;
        gaps[category] = average(en) - average(pt);
      }

      const worst = Math.max(...Object.values(gaps));
      expect(
        worst,
        `Worst Portuguese/English score gap by category: ${JSON.stringify(gaps)}. ` +
          `Ceiling is ${MAX_ACCEPTED_GAP}; tighten it as the scorer becomes language-agnostic.`
      ).toBeLessThanOrEqual(MAX_ACCEPTED_GAP);
    });
  });
});
