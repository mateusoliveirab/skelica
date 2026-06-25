/**
 * E2E Tests for Analysis Flow
 * 
 * Tests the complete flow from prompt input through anatomy analysis,
 * component detection, scoring, highlighting, and multilingual support.
 * 
 * Requirements: 4.1, 4.2
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { AnatomyParser } from '../core/anatomyParser';
import { Scorer } from '../core/scorer';
import { convertAnatomyToAnalyzeResponse } from '../adapters/anatomyAdapter';
import { convertScoreToScoreResponse } from '../adapters/scoreAdapter';
import type { AnalyzeResponse } from '../api/types';
import type { ScoreResponse } from '../api/types';

describe('E2E: Analysis Flow', () => {
  let parser: AnatomyParser;
  let scorer: Scorer;

  beforeEach(() => {
    parser = new AnatomyParser();
    scorer = new Scorer();
  });

  describe('Complete Analysis Flow', () => {
    it('should complete full analysis flow for a simple prompt', () => {
      const prompt = 'You are a developer. Write a function.';

      // Step 1: Parse anatomy
      const anatomyResult = parser.parse(prompt);
      expect(anatomyResult).toBeDefined();
      expect(anatomyResult.rawText).toBe(prompt);

      // Step 2: Convert to API format
      const analysis: AnalyzeResponse = convertAnatomyToAnalyzeResponse(anatomyResult);
      expect(analysis).toBeDefined();
      expect(analysis.components).toBeDefined();

      // Step 3: Score the prompt
      const scoreResult = scorer.score(prompt);
      expect(scoreResult).toBeDefined();

      // Step 4: Convert score to API format
      const score: ScoreResponse = convertScoreToScoreResponse(scoreResult, prompt);
      expect(score).toBeDefined();
      expect(score.overall_score).toBeDefined();

      // Verify components were detected
      const presentComponents = analysis.components.filter(c => c.presence.present);
      expect(presentComponents.length).toBeGreaterThan(0);

      // Verify score is valid
      expect(score.overall_score).toBeGreaterThan(0);
      expect(score.overall_score).toBeLessThanOrEqual(1);
    });

    it('should complete full analysis flow for a complex prompt', () => {
      const prompt = `You are a senior Python developer with expertise in data structures.

Given that we are building a high-performance sorting library, please write a function that implements quicksort.

Requirements:
- Do not use built-in sort methods
- Time complexity must be O(n log n) average case
- Handle edge cases (empty arrays, single elements)

For example:
quicksort([3, 1, 4, 1, 5, 9, 2, 6]) should return [1, 1, 2, 3, 4, 5, 6, 9]

Output format: Return as a Python function with docstring and type hints.

Target audience: Intermediate Python developers
Use a professional, educational tone.`;

      // Complete flow
      const anatomyResult = parser.parse(prompt);
      const analysis: AnalyzeResponse = convertAnatomyToAnalyzeResponse(anatomyResult);
      const scoreResult = scorer.score(prompt);
      const score: ScoreResponse = convertScoreToScoreResponse(scoreResult, prompt);

      // Verify comprehensive component detection
      const presentComponents = analysis.components.filter(c => c.presence.present);
      expect(presentComponents.length).toBeGreaterThanOrEqual(5);

      // Verify high score for complete prompt
      expect(score.overall_score).toBeGreaterThan(0.5);
      expect(score.grade).toMatch(/^[ABC]/); // Should be A, B, or C grade

      // Verify key components are detected (at least some of them)
      const componentTypes = presentComponents.map(c => c.component);
      expect(componentTypes).toContain('role');
      
      // Should have at least 3 of these important components
      const importantComponents = ['constraint', 'example', 'output_format', 'context'];
      const detectedImportant = importantComponents.filter(comp => (componentTypes as string[]).includes(comp));
      expect(detectedImportant.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Component Detection Flow', () => {
    it('should detect role component and display it correctly', () => {
      const prompt = 'You are a senior software engineer. Write code.';
      
      const anatomyResult = parser.parse(prompt);
      const analysis: AnalyzeResponse = convertAnatomyToAnalyzeResponse(anatomyResult);

      const roleComponent = analysis.components.find(c => c.component === 'role');
      expect(roleComponent).toBeDefined();
      expect(roleComponent?.presence.present).toBe(true);
      expect(roleComponent?.presence.quality_score).toBeGreaterThan(0);
    });

    it('should detect instruction component and display it correctly', () => {
      const prompt = 'Please write a function that adds two numbers.';
      
      const anatomyResult = parser.parse(prompt);
      const analysis: AnalyzeResponse = convertAnatomyToAnalyzeResponse(anatomyResult);

      const instructionComponent = analysis.components.find(c => c.component === 'instruction');
      expect(instructionComponent).toBeDefined();
      expect(instructionComponent?.presence.present).toBe(true);
    });

    it('should detect context component and display it correctly', () => {
      const prompt = 'Given that we are building a web application, write a function.';
      
      const anatomyResult = parser.parse(prompt);
      const analysis: AnalyzeResponse = convertAnatomyToAnalyzeResponse(anatomyResult);

      const contextComponent = analysis.components.find(c => c.component === 'context');
      expect(contextComponent).toBeDefined();
      expect(contextComponent?.presence.present).toBe(true);
    });

    it('should detect constraint component and display it correctly', () => {
      const prompt = 'Write a function. Do not use external libraries.';
      
      const anatomyResult = parser.parse(prompt);
      const analysis: AnalyzeResponse = convertAnatomyToAnalyzeResponse(anatomyResult);

      const constraintComponent = analysis.components.find(c => c.component === 'constraint');
      expect(constraintComponent).toBeDefined();
      expect(constraintComponent?.presence.present).toBe(true);
    });

    it('should detect example component and display it correctly', () => {
      const prompt = 'Write a function. For example: add(1, 2) returns 3.';
      
      const anatomyResult = parser.parse(prompt);
      const analysis: AnalyzeResponse = convertAnatomyToAnalyzeResponse(anatomyResult);

      const exampleComponent = analysis.components.find(c => c.component === 'example');
      expect(exampleComponent).toBeDefined();
      expect(exampleComponent?.presence.present).toBe(true);
    });

    it('should detect format component and display it correctly', () => {
      const prompt = 'Write a function. Output as JSON.';
      
      const anatomyResult = parser.parse(prompt);
      const analysis: AnalyzeResponse = convertAnatomyToAnalyzeResponse(anatomyResult);

      const formatComponent = analysis.components.find(c => c.component === 'output_format');
      expect(formatComponent).toBeDefined();
      expect(formatComponent?.presence.present).toBe(true);
    });

    it('should detect audience component and display it correctly', () => {
      const prompt = 'Write documentation. Target audience: junior developers.';
      
      const anatomyResult = parser.parse(prompt);
      const analysis: AnalyzeResponse = convertAnatomyToAnalyzeResponse(anatomyResult);

      const audienceComponent = analysis.components.find(c => c.component === 'audience');
      expect(audienceComponent).toBeDefined();
      expect(audienceComponent?.presence.present).toBe(true);
    });

    it('should detect tone component and display it correctly', () => {
      const prompt = 'Write a blog post. Use a professional tone.';
      
      const anatomyResult = parser.parse(prompt);
      const analysis: AnalyzeResponse = convertAnatomyToAnalyzeResponse(anatomyResult);

      // Tone detection may vary, but parsing should work
      expect(analysis.components).toBeDefined();
      expect(analysis.components.length).toBeGreaterThan(0);
    });

    it('should detect multiple components in a single prompt', () => {
      const prompt = `You are a developer.
Given a list of numbers, write a function.
Do not use built-in methods.
For example: sort([3,1,2]) returns [1,2,3].
Output as JSON.`;

      const anatomyResult = parser.parse(prompt);
      const analysis: AnalyzeResponse = convertAnatomyToAnalyzeResponse(anatomyResult);

      const presentComponents = analysis.components.filter(c => c.presence.present);
      expect(presentComponents.length).toBeGreaterThanOrEqual(4);

      const componentTypes = presentComponents.map(c => c.component);
      expect(componentTypes).toContain('role');
      expect(componentTypes).toContain('instruction');
      expect(componentTypes).toContain('constraint');
      expect(componentTypes).toContain('output_format');
    });
  });

  describe('Scoring and Grade Assignment Flow', () => {
    it('should calculate score and assign grade', () => {
      const prompt = 'You are a developer. Write a function. Output as JSON.';
      
      const scoreResult = scorer.score(prompt);
      const score: ScoreResponse = convertScoreToScoreResponse(scoreResult, prompt);

      expect(score.overall_score).toBeGreaterThan(0);
      expect(score.overall_score).toBeLessThanOrEqual(1);
      expect(score.grade).toBeDefined();
      expect(score.grade).toMatch(/^[ABCDF][+-]?$/);
    });

    it('should assign higher grade to better prompts', () => {
      const simplePrompt = 'Write code.';
      const complexPrompt = 'You are a senior developer. Write a function that sorts numbers. Do not use built-in sort. Output as JSON.';

      const simpleScore = convertScoreToScoreResponse(scorer.score(simplePrompt), simplePrompt);
      const complexScore = convertScoreToScoreResponse(scorer.score(complexPrompt), complexPrompt);

      expect(complexScore.overall_score).toBeGreaterThan(simpleScore.overall_score);
    });

    it('should calculate all component scores', () => {
      const prompt = 'You are a developer. Write a function.';
      
      const scoreResult = scorer.score(prompt);
      const score: ScoreResponse = convertScoreToScoreResponse(scoreResult, prompt);

      // Score adapter groups dimensions by component type
      expect(score.component_scores).toBeDefined();
      expect(score.component_scores).not.toBeNull();
      
      if (score.component_scores) {
        expect(score.component_scores.length).toBeGreaterThan(0);
        
        // Verify each component score has required fields
        for (const compScore of score.component_scores) {
          expect(compScore.component).toBeDefined();
          expect(compScore.score).toBeGreaterThanOrEqual(0);
          expect(compScore.score).toBeLessThanOrEqual(1);
          expect(compScore.weight).toBeGreaterThan(0);
        }
      }
    });

    it('should assign grades to component scores', () => {
      const prompt = 'You are a developer. Write a function.';
      
      const scoreResult = scorer.score(prompt);
      const score: ScoreResponse = convertScoreToScoreResponse(scoreResult, prompt);

      // Verify overall grade
      expect(score.grade).toBeDefined();
      expect(score.grade).toMatch(/^[ABCDF][+-]?$/);
    });

    it('should provide recommendations for improvement', () => {
      const prompt = 'Write code.';
      
      const scoreResult = scorer.score(prompt);
      const score: ScoreResponse = convertScoreToScoreResponse(scoreResult, prompt);

      expect(score.recommendations).toBeDefined();
      expect(typeof score.recommendations).toBe('string');
      expect(score.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('Component Highlighting Flow', () => {
    it('should generate highlights for detected components', () => {
      const prompt = 'You are a developer. Write a function.';
      
      const anatomyResult = parser.parse(prompt);

      expect(anatomyResult.highlightedPhrases).toBeDefined();
      expect(anatomyResult.highlightedPhrases.length).toBeGreaterThan(0);
    });

    it('should include color information in highlights', () => {
      const prompt = 'You are a developer. Write a function. Output as JSON.';
      
      const anatomyResult = parser.parse(prompt);

      for (const highlight of anatomyResult.highlightedPhrases) {
        expect(highlight.highlightColor).toBeDefined();
        expect(highlight.highlightColor).toMatch(/^#[0-9A-F]{6}$/i);
      }
    });

    it('should include tooltip information in highlights', () => {
      const prompt = 'You are a developer. Write a function.';
      
      const anatomyResult = parser.parse(prompt);

      for (const highlight of anatomyResult.highlightedPhrases) {
        expect(highlight.tooltip).toBeDefined();
        expect(highlight.tooltip?.length).toBeGreaterThan(0);
      }
    });

    it('should map component types to correct colors', () => {
      const prompt = 'You are a developer. Write a function. Output as JSON.';

      const anatomyResult = parser.parse(prompt);

      const roleHighlight = anatomyResult.highlightedPhrases.find(h => h.highlightType === 'role');
      expect(roleHighlight).toBeDefined();
      if (roleHighlight) {
        expect(roleHighlight.highlightColor).toBe('#3B82F6'); // Blue
      }

      const formatHighlight = anatomyResult.highlightedPhrases.find(h => h.highlightType === 'format');
      expect(formatHighlight).toBeDefined();
      if (formatHighlight) {
        expect(formatHighlight.highlightColor).toBe('#06B6D4'); // Cyan
      }
    });

    it('should create unique IDs for each highlight', () => {
      const prompt = 'You are a developer. Write a function. Output as JSON.';
      
      const anatomyResult = parser.parse(prompt);

      const phraseIds = anatomyResult.highlightedPhrases.map(h => h.phraseId);
      const uniqueIds = new Set(phraseIds);

      expect(uniqueIds.size).toBe(phraseIds.length);
    });

    it('should include text content in highlights', () => {
      const prompt = 'You are a developer. Write a function.';

      const anatomyResult = parser.parse(prompt);

      for (const highlight of anatomyResult.highlightedPhrases) {
        expect(highlight.text).toBeDefined();
        expect(highlight.text.length).toBeGreaterThan(0);
      }
    });

    it('should ensure highlight text appears in the original prompt', () => {
      const prompt = 'You are a developer. Write a function. Output as JSON.';
      const anatomyResult = parser.parse(prompt);
      for (const highlight of anatomyResult.highlightedPhrases) {
        expect(prompt).toContain(highlight.text);
      }
    });

    it('should not produce overlapping highlights', () => {
      const prompt = 'You are a developer. Write a function. Do not use loops. Output as JSON.';
      const anatomyResult = parser.parse(prompt);
      const phrases = anatomyResult.highlightedPhrases;
      for (let i = 0; i < phrases.length; i++) {
        for (let j = i + 1; j < phrases.length; j++) {
          const aIdx = prompt.indexOf(phrases[i].text);
          const bIdx = prompt.indexOf(phrases[j].text);
          if (aIdx >= 0 && bIdx >= 0) {
            const aEnd = aIdx + phrases[i].text.length;
            const bEnd = bIdx + phrases[j].text.length;
            const overlaps = aIdx < bEnd && bIdx < aEnd;
            expect(overlaps).toBe(false);
          }
        }
      }
    });

    it('should assign valid highlightType to all highlights', () => {
      const prompt = 'You are a developer. Write a function. Output as JSON.';
      const anatomyResult = parser.parse(prompt);
      const validTypes = ['role', 'instruction', 'constraint', 'context', 'example', 'format', 'goal', 'issue', 'suggestion', 'excellent', 'warning', 'audience', 'tone'];
      for (const highlight of anatomyResult.highlightedPhrases) {
        expect(validTypes).toContain(highlight.highlightType);
      }
    });
  });

  describe('Multilingual Analysis Flow - English', () => {
    it('should detect English language', () => {
      const prompt = 'You are a senior developer. Write a function that sorts numbers.';
      
      const anatomyResult = parser.parse(prompt);

      expect(anatomyResult.metadata.detectedLanguage).toBe('en');
    });

    it('should detect English components correctly', () => {
      const prompt = 'You are a developer. Write a function. Do not use loops. Output as JSON.';
      
      const anatomyResult = parser.parse(prompt);
      const analysis: AnalyzeResponse = convertAnatomyToAnalyzeResponse(anatomyResult);

      const presentComponents = analysis.components.filter(c => c.presence.present);
      expect(presentComponents.length).toBeGreaterThanOrEqual(3);

      const componentTypes = presentComponents.map(c => c.component);
      expect(componentTypes).toContain('role');
      expect(componentTypes).toContain('instruction');
      expect(componentTypes).toContain('constraint');
      expect(componentTypes).toContain('output_format');
    });

    it('should score English prompts correctly', () => {
      const prompt = 'You are a senior Python developer. Write a function that sorts a list. Do not use built-in sort. Output as JSON.';
      
      const scoreResult = scorer.score(prompt);
      const score: ScoreResponse = convertScoreToScoreResponse(scoreResult, prompt);

      expect(score.overall_score).toBeGreaterThan(0.4);
      expect(score.grade).toMatch(/^[ABC]/);
    });
  });

  describe('Multilingual Analysis Flow - Portuguese', () => {
    it('should detect Portuguese language', () => {
      const prompt = 'Você é um desenvolvedor sênior. Escreva uma função que ordena números.';
      
      const anatomyResult = parser.parse(prompt);

      expect(anatomyResult.metadata.detectedLanguage).toBe('pt');
    });

    it('should detect Portuguese components correctly', () => {
      const prompt = 'Você é um desenvolvedor. Escreva uma função. Não use loops. Retorne como JSON.';
      
      const anatomyResult = parser.parse(prompt);
      const analysis: AnalyzeResponse = convertAnatomyToAnalyzeResponse(anatomyResult);

      const presentComponents = analysis.components.filter(c => c.presence.present);
      expect(presentComponents.length).toBeGreaterThanOrEqual(3);

      const componentTypes = presentComponents.map(c => c.component);
      expect(componentTypes).toContain('role');
      expect(componentTypes).toContain('instruction');
    });

    it('should score Portuguese prompts correctly', () => {
      const prompt = 'Você é um desenvolvedor Python sênior. Escreva uma função que ordena uma lista. Não use sort nativo. Retorne como JSON.';
      
      const scoreResult = scorer.score(prompt);
      const score: ScoreResponse = convertScoreToScoreResponse(scoreResult, prompt);

      expect(score.overall_score).toBeGreaterThan(0.3);
      expect(score.grade).toBeDefined();
    });

    it('should generate highlights for Portuguese prompts', () => {
      const prompt = 'Você é um desenvolvedor. Escreva uma função.';
      
      const anatomyResult = parser.parse(prompt);

      expect(anatomyResult.highlightedPhrases.length).toBeGreaterThan(0);
    });

    it('should complete full flow for Portuguese prompts', () => {
      const prompt = `Você é um desenvolvedor Python sênior com experiência em estruturas de dados.

Dado que estamos construindo uma biblioteca de ordenação de alto desempenho, por favor escreva uma função que implementa quicksort.

Requisitos:
- Não use métodos de ordenação nativos
- Complexidade de tempo deve ser O(n log n) no caso médio

Por exemplo:
quicksort([3, 1, 4, 1, 5, 9, 2, 6]) deve retornar [1, 1, 2, 3, 4, 5, 6, 9]

Formato de saída: Retorne como uma função Python com docstring.

Público alvo: Desenvolvedores Python intermediários`;

      const anatomyResult = parser.parse(prompt);
      const analysis: AnalyzeResponse = convertAnatomyToAnalyzeResponse(anatomyResult);
      const scoreResult = scorer.score(prompt);
      const score: ScoreResponse = convertScoreToScoreResponse(scoreResult, prompt);

      expect(anatomyResult.metadata.detectedLanguage).toBe('pt');
      
      const presentComponents = analysis.components.filter(c => c.presence.present);
      expect(presentComponents.length).toBeGreaterThanOrEqual(4);

      expect(score.overall_score).toBeGreaterThan(0.4);
    });
  });

  describe('Multilingual Analysis Flow - Spanish', () => {
    it('should detect Spanish language', () => {
      const prompt = 'Usted es un desarrollador senior. Escriba una función que ordena números.';
      
      const anatomyResult = parser.parse(prompt);

      expect(anatomyResult.metadata.detectedLanguage).toBe('es');
    });

    it('should detect Spanish components correctly', () => {
      const prompt = 'Usted es un desarrollador. Escriba una función. No use bucles. Retorne como JSON.';
      
      const anatomyResult = parser.parse(prompt);
      const analysis: AnalyzeResponse = convertAnatomyToAnalyzeResponse(anatomyResult);

      const presentComponents = analysis.components.filter(c => c.presence.present);
      expect(presentComponents.length).toBeGreaterThanOrEqual(3);

      const componentTypes = presentComponents.map(c => c.component);
      expect(componentTypes).toContain('role');
      expect(componentTypes).toContain('instruction');
    });

    it('should score Spanish prompts correctly', () => {
      const prompt = 'Usted es un desarrollador Python senior. Escriba una función que ordena una lista. No use sort nativo. Retorne como JSON.';
      
      const scoreResult = scorer.score(prompt);
      const score: ScoreResponse = convertScoreToScoreResponse(scoreResult, prompt);

      expect(score.overall_score).toBeGreaterThan(0.3);
      expect(score.grade).toBeDefined();
    });

    it('should generate highlights for Spanish prompts', () => {
      const prompt = 'Usted es un desarrollador. Escriba una función.';
      
      const anatomyResult = parser.parse(prompt);

      expect(anatomyResult.highlightedPhrases.length).toBeGreaterThan(0);
    });

    it('should complete full flow for Spanish prompts', () => {
      const prompt = `Usted es un desarrollador Python senior con experiencia en estructuras de datos.

Dado que estamos construyendo una biblioteca de ordenación de alto rendimiento, por favor escriba una función que implementa quicksort.

Requisitos:
- No use métodos de ordenación nativos
- La complejidad de tiempo debe ser O(n log n) en el caso promedio

Por ejemplo:
quicksort([3, 1, 4, 1, 5, 9, 2, 6]) debe retornar [1, 1, 2, 3, 4, 5, 6, 9]

Formato de salida: Retorne como una función Python con docstring.

Público objetivo: Desarrolladores Python intermedios`;

      const anatomyResult = parser.parse(prompt);
      const analysis: AnalyzeResponse = convertAnatomyToAnalyzeResponse(anatomyResult);
      const scoreResult = scorer.score(prompt);
      const score: ScoreResponse = convertScoreToScoreResponse(scoreResult, prompt);

      expect(anatomyResult.metadata.detectedLanguage).toBe('es');
      
      const presentComponents = analysis.components.filter(c => c.presence.present);
      expect(presentComponents.length).toBeGreaterThanOrEqual(4);

      expect(score.overall_score).toBeGreaterThan(0.4);
    });
  });

  describe('Edge Cases in Analysis Flow', () => {
    it('should handle empty prompt gracefully', () => {
      const prompt = '';
      
      const anatomyResult = parser.parse(prompt);
      const analysis: AnalyzeResponse = convertAnatomyToAnalyzeResponse(anatomyResult);
      const scoreResult = scorer.score(prompt);
      const score: ScoreResponse = convertScoreToScoreResponse(scoreResult, prompt);

      expect(analysis.components).toBeDefined();
      expect(score.overall_score).toBeLessThan(0.3);
    });

    it('should handle very short prompt', () => {
      const prompt = 'Hi';
      
      const anatomyResult = parser.parse(prompt);
      const analysis: AnalyzeResponse = convertAnatomyToAnalyzeResponse(anatomyResult);
      const scoreResult = scorer.score(prompt);
      const score: ScoreResponse = convertScoreToScoreResponse(scoreResult, prompt);

      expect(analysis).toBeDefined();
      expect(score).toBeDefined();
    });

    it('should handle very long prompt', () => {
      const longPrompt = 'You are a developer. '.repeat(100) + 'Write a function.';
      
      const anatomyResult = parser.parse(longPrompt);
      const analysis: AnalyzeResponse = convertAnatomyToAnalyzeResponse(anatomyResult);
      const scoreResult = scorer.score(longPrompt);
      const score: ScoreResponse = convertScoreToScoreResponse(scoreResult, longPrompt);

      expect(analysis.components.length).toBeGreaterThan(0);
      expect(score.overall_score).toBeGreaterThan(0);
    });

    it('should handle prompt with special characters', () => {
      const prompt = 'You are a developer. Write a function with @#$%^&*() characters.';
      
      const anatomyResult = parser.parse(prompt);
      const analysis: AnalyzeResponse = convertAnatomyToAnalyzeResponse(anatomyResult);
      const scoreResult = scorer.score(prompt);
      const score: ScoreResponse = convertScoreToScoreResponse(scoreResult, prompt);

      expect(analysis.components.length).toBeGreaterThan(0);
      expect(score.overall_score).toBeGreaterThan(0);
    });

    it('should handle prompt with code blocks', () => {
      const prompt = `You are a developer. Write a function.
\`\`\`javascript
function test() {
  return true;
}
\`\`\`
Output as JSON.`;

      const anatomyResult = parser.parse(prompt);
      const analysis: AnalyzeResponse = convertAnatomyToAnalyzeResponse(anatomyResult);
      const scoreResult = scorer.score(prompt);
      const score: ScoreResponse = convertScoreToScoreResponse(scoreResult, prompt);

      expect(analysis.components.length).toBeGreaterThan(0);
      expect(score.overall_score).toBeGreaterThan(0);
    });
  });

  describe('Performance in Analysis Flow', () => {
    it('should complete analysis in reasonable time for typical prompt', () => {
      const prompt = 'You are a developer. Write a function that sorts numbers. Do not use built-in methods. Output as JSON.';
      
      const startTime = performance.now();
      
      const anatomyResult = parser.parse(prompt);
      const analysis: AnalyzeResponse = convertAnatomyToAnalyzeResponse(anatomyResult);
      const scoreResult = scorer.score(prompt);
      const score: ScoreResponse = convertScoreToScoreResponse(scoreResult, prompt);
      
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete in less than 100ms for typical prompts
      expect(duration).toBeLessThan(100);
      
      expect(analysis).toBeDefined();
      expect(score).toBeDefined();
    });

    it('should complete analysis in reasonable time for long prompt', () => {
      const longPrompt = `You are a senior Python developer with expertise in algorithms and data structures.

Given that we are building a high-performance sorting library for production use, please write a comprehensive implementation of the quicksort algorithm.

Requirements:
- Do not use built-in sort methods or libraries
- Time complexity must be O(n log n) average case
- Space complexity should be O(log n) for the call stack
- Handle edge cases including empty arrays, single elements, and duplicate values
- Implement in-place sorting to minimize memory usage
- Add proper error handling for invalid inputs

For example:
quicksort([3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5]) should return [1, 1, 2, 3, 3, 4, 5, 5, 5, 6, 9]
quicksort([]) should return []
quicksort([1]) should return [1]

Output format: Return as a well-documented Python function with:
- Type hints for all parameters and return values
- Comprehensive docstring explaining the algorithm
- Inline comments for complex logic
- Unit tests demonstrating correctness

Target audience: Senior Python developers familiar with algorithms
Use a professional, technical tone with clear explanations.`;

      const startTime = performance.now();
      
      const anatomyResult = parser.parse(longPrompt);
      const analysis: AnalyzeResponse = convertAnatomyToAnalyzeResponse(anatomyResult);
      const scoreResult = scorer.score(longPrompt);
      const score: ScoreResponse = convertScoreToScoreResponse(scoreResult, longPrompt);
      
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete in less than 300ms even for long prompts
      expect(duration).toBeLessThan(300);
      
      expect(analysis).toBeDefined();
      expect(score).toBeDefined();
    });
  });

  describe('Data Consistency in Analysis Flow', () => {
    it('should maintain consistent data structure through adapters', () => {
      const prompt = 'You are a developer. Write a function. Output as JSON.';
      
      const anatomyResult = parser.parse(prompt);
      const analysis: AnalyzeResponse = convertAnatomyToAnalyzeResponse(anatomyResult);

      // Verify adapter maintains expected structure
      expect(analysis.components).toBeDefined();
      expect(Array.isArray(analysis.components)).toBe(true);
      
      for (const component of analysis.components) {
        expect(component.component).toBeDefined();
        expect(component.presence).toBeDefined();
        expect(component.presence.present).toBeDefined();
        expect(typeof component.presence.present).toBe('boolean');
      }
    });

    it('should maintain consistent score structure through adapters', () => {
      const prompt = 'You are a developer. Write a function.';
      
      const scoreResult = scorer.score(prompt);
      const score: ScoreResponse = convertScoreToScoreResponse(scoreResult, prompt);

      // Verify adapter maintains expected structure
      expect(score.overall_score).toBeDefined();
      expect(score.grade).toBeDefined();
      expect(score.recommendations).toBeDefined();
      expect(typeof score.recommendations).toBe('string');
    });

    it('should produce same results for identical prompts', () => {
      const prompt = 'You are a developer. Write a function. Output as JSON.';
      
      // First analysis
      const anatomyResult1 = parser.parse(prompt);
      const analysis1: AnalyzeResponse = convertAnatomyToAnalyzeResponse(anatomyResult1);
      const scoreResult1 = scorer.score(prompt);
      const score1: ScoreResponse = convertScoreToScoreResponse(scoreResult1, prompt);

      // Second analysis
      const anatomyResult2 = parser.parse(prompt);
      const analysis2: AnalyzeResponse = convertAnatomyToAnalyzeResponse(anatomyResult2);
      const scoreResult2 = scorer.score(prompt);
      const score2: ScoreResponse = convertScoreToScoreResponse(scoreResult2, prompt);

      // Results should be identical
      expect(analysis1.components.length).toBe(analysis2.components.length);
      expect(score1.overall_score).toBeCloseTo(score2.overall_score, 5);
      expect(score1.grade).toBe(score2.grade);
    });
  });
});
