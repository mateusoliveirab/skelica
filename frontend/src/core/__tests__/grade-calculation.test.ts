import { describe, it, expect } from 'vitest';
import { calculateGrade, calculateLabel } from '../../types/score';
import { Scorer } from '../scorer';

describe('Grade Calculation', () => {
  describe('calculateGrade', () => {
    it('should return A+ for scores >= 0.9', () => {
      expect(calculateGrade(0.95)).toBe('A+');
      expect(calculateGrade(0.9)).toBe('A+');
    });

    it('should return A for scores >= 0.85 and < 0.9', () => {
      expect(calculateGrade(0.87)).toBe('A');
      expect(calculateGrade(0.85)).toBe('A');
    });

    it('should return A- for scores >= 0.8 and < 0.85', () => {
      expect(calculateGrade(0.82)).toBe('A-');
      expect(calculateGrade(0.8)).toBe('A-');
    });

    it('should return B+ for scores >= 0.75 and < 0.8', () => {
      expect(calculateGrade(0.77)).toBe('B+');
      expect(calculateGrade(0.75)).toBe('B+');
    });

    it('should return B for scores >= 0.7 and < 0.75', () => {
      expect(calculateGrade(0.72)).toBe('B');
      expect(calculateGrade(0.7)).toBe('B');
    });

    it('should return B- for scores >= 0.65 and < 0.7', () => {
      expect(calculateGrade(0.67)).toBe('B-');
      expect(calculateGrade(0.65)).toBe('B-');
    });

    it('should return C+ for scores >= 0.6 and < 0.65', () => {
      expect(calculateGrade(0.62)).toBe('C+');
      expect(calculateGrade(0.6)).toBe('C+');
    });

    it('should return C for scores >= 0.55 and < 0.6', () => {
      expect(calculateGrade(0.57)).toBe('C');
      expect(calculateGrade(0.55)).toBe('C');
    });

    it('should return C- for scores >= 0.5 and < 0.55', () => {
      expect(calculateGrade(0.52)).toBe('C-');
      expect(calculateGrade(0.5)).toBe('C-');
    });

    it('should return D for scores >= 0.4 and < 0.5', () => {
      expect(calculateGrade(0.45)).toBe('D');
      expect(calculateGrade(0.4)).toBe('D');
    });

    it('should return F for scores < 0.4', () => {
      expect(calculateGrade(0.35)).toBe('F');
      expect(calculateGrade(0.1)).toBe('F');
      expect(calculateGrade(0)).toBe('F');
    });
  });

  describe('calculateLabel', () => {
    it('should return Excellent for scores >= 0.9', () => {
      expect(calculateLabel(0.95)).toBe('Excellent');
      expect(calculateLabel(0.9)).toBe('Excellent');
    });

    it('should return Very Good for scores >= 0.8 and < 0.9', () => {
      expect(calculateLabel(0.85)).toBe('Very Good');
      expect(calculateLabel(0.8)).toBe('Very Good');
    });

    it('should return Good for scores >= 0.7 and < 0.8', () => {
      expect(calculateLabel(0.75)).toBe('Good');
      expect(calculateLabel(0.7)).toBe('Good');
    });

    it('should return Fair for scores >= 0.6 and < 0.7', () => {
      expect(calculateLabel(0.65)).toBe('Fair');
      expect(calculateLabel(0.6)).toBe('Fair');
    });

    it('should return Needs Improvement for scores >= 0.5 and < 0.6', () => {
      expect(calculateLabel(0.55)).toBe('Needs Improvement');
      expect(calculateLabel(0.5)).toBe('Needs Improvement');
    });

    it('should return Poor for scores < 0.5', () => {
      expect(calculateLabel(0.45)).toBe('Poor');
      expect(calculateLabel(0.1)).toBe('Poor');
    });
  });

  describe('Scorer grade integration', () => {
    const scorer = new Scorer();

    it('should assign grades to overall score', () => {
      const result = scorer.score('You are a senior developer. Write a function.');
      
      expect(result.overall.grade).toBeDefined();
      expect(result.overall.grade).toMatch(/^[A-F][+-]?$/);
      expect(result.overall.label).toBeDefined();
    });

    it('should assign grades to all dimension scores', () => {
      const result = scorer.score('You are an expert. Write code. Output as JSON.');
      
      result.dimensions.forEach(dim => {
        expect(dim.grade).toBeDefined();
        expect(dim.grade).toMatch(/^[A-F][+-]?$/);
      });
    });

    it('should have consistent grades across score ranges', () => {
      const poorPrompt = 'Do it.';
      const goodPrompt = `You are a senior Python developer with expertise in algorithms.

Write a function that implements the quicksort algorithm.

Constraints:
- Use recursion
- Handle edge cases (empty array, single element)
- Time complexity must be O(n log n) average case

Output format: JSON with the following structure:
\`\`\`json
{
  "code": "function implementation here",
  "explanation": "detailed explanation",
  "complexity": "time and space complexity analysis"
}
\`\`\`

Example output:
\`\`\`json
{
  "code": "def quicksort(arr): ...",
  "explanation": "This implements quicksort using...",
  "complexity": "O(n log n) average, O(n^2) worst"
}
\`\`\``;

      const poorResult = scorer.score(poorPrompt);
      const goodResult = scorer.score(goodPrompt);

      // Poor prompt should have lower grade
      const gradeOrder = ['F', 'D', 'C-', 'C', 'C+', 'B-', 'B', 'B+', 'A-', 'A', 'A+'];
      const poorGradeIndex = gradeOrder.indexOf(poorResult.overall.grade!);
      const goodGradeIndex = gradeOrder.indexOf(goodResult.overall.grade!);

      expect(goodGradeIndex).toBeGreaterThan(poorGradeIndex);
    });
  });

  describe('Recommendation generation', () => {
    const scorer = new Scorer();

    it('should generate recommendations for poor prompts', () => {
      const result = scorer.score('Do something.');
      
      expect(result.metadata.recommendations).toBeDefined();
      expect(result.metadata.recommendations.length).toBeGreaterThan(0);
    });

    it('should recommend improvements for low-scoring dimensions', () => {
      const result = scorer.score('Write code.');

      const recommendations = result.metadata.recommendations;

      // Should have recommendations for missing components
      const hasRoleRecommendation = recommendations.some(r =>
        r.toLowerCase().includes('role')
      );
      const hasFormatRecommendation = recommendations.some(r =>
        r.toLowerCase().includes('format')
      );

      expect(hasRoleRecommendation || hasFormatRecommendation).toBe(true);
    });

    it('should provide specific improvement suggestions', () => {
      const result = scorer.score('Tell me about AI.');

      const recommendations = result.metadata.recommendations;

      // Recommendations should be actionable
      recommendations.forEach(rec => {
        expect(rec.length).toBeGreaterThan(10); // Not just empty strings
        expect(typeof rec).toBe('string');
      });
    });

    it('should generate fewer recommendations for complete prompts', () => {
      const poorPrompt = 'Do it.';
      const goodPrompt = `You are a senior developer.

Write a function that sorts numbers.

Constraints:
- Do not use built-in sort
- Time complexity O(n log n)

Output format: JSON

Example:
\`\`\`json
{"code": "def sort(arr): ..."}
\`\`\``;

      const poorResult = scorer.score(poorPrompt);
      const goodResult = scorer.score(goodPrompt);

      const poorRecs = poorResult.metadata.recommendations.length;
      const goodRecs = goodResult.metadata.recommendations.length;

      expect(poorRecs).toBeGreaterThan(goodRecs);
    });

    it('should recommend specific dimension improvements', () => {
      const result = scorer.score('Write something.');

      const recommendations = result.metadata.recommendations;

      // Should mention specific dimensions that scored low
      const mentionsDimension = recommendations.some(r =>
        r.includes('clarity') ||
        r.includes('specificity') || 
        r.includes('completeness') ||
        r.includes('actionability')
      );
      
      expect(mentionsDimension).toBe(true);
    });
  });
});
