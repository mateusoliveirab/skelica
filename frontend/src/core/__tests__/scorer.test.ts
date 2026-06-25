/**
 * Unit tests for Scorer
 * Tests each dimension scoring function, overall score calculation,
 * grade assignment, and recommendation generation
 */

import { describe, it, expect } from 'vitest';
import { Scorer, StaticAnalyzer } from '../scorer';
import { calculateGrade } from '../../types/score';

describe('Scorer', () => {
  const scorer = new Scorer();

  describe('Overall Score Calculation', () => {
    it('should calculate overall score for a simple prompt', () => {
      const result = scorer.score('Write a function.');
      
      expect(result.overall.score).toBeGreaterThanOrEqual(0);
      expect(result.overall.score).toBeLessThanOrEqual(1);
      expect(result.overall.weightedAverage).toBe(result.overall.score);
    });

    it('should calculate overall score for a complete prompt', () => {
      const result = scorer.score(
        'You are a senior Python developer. Write a function that sorts a list. Do not use built-in sort. Output as JSON.'
      );
      
      expect(result.overall.score).toBeGreaterThan(0.5);
      expect(result.overall.score).toBeLessThanOrEqual(1);
    });

    it('should give higher overall score to more complete prompts', () => {
      const simpleResult = scorer.score('Write code.');
      const completeResult = scorer.score(
        'You are a senior developer. Given a list of numbers, write a function that sorts them. Do not use built-in methods. Output as JSON. For example: sort([3,1,2]) returns [1,2,3].'
      );
      
      expect(completeResult.overall.score).toBeGreaterThan(simpleResult.overall.score);
    });

    it('should calculate weighted average correctly', () => {
      const result = scorer.score('You are a developer. Write a function. Output as JSON.');
      
      // Weighted average should be sum of (score * weight) / sum of weights
      const totalWeight = result.dimensions.reduce((sum, d) => sum + d.weight, 0);
      const weightedSum = result.dimensions.reduce((sum, d) => sum + d.score * d.weight, 0);
      const expectedWeightedAvg = totalWeight > 0 ? weightedSum / totalWeight : 0;
      
      expect(result.overall.weightedAverage).toBeCloseTo(expectedWeightedAvg, 5);
    });

    it('should set calculation method to weighted_average', () => {
      const result = scorer.score('Write a function.');
      expect(result.overall.calculationMethod).toBe('weighted_average');
    });

    it('should calculate improvement potential', () => {
      const result = scorer.score('Write a function.');
      
      expect(result.overall.improvementPotential).toBeGreaterThanOrEqual(0);
      expect(result.overall.improvementPotential).toBeLessThanOrEqual(1);
      expect(result.overall.improvementPotential).toBeCloseTo(1 - result.overall.score, 5);
    });

    it('should set confidence to 1.0', () => {
      const result = scorer.score('Write a function.');
      expect(result.overall.confidence).toBe(1.0);
    });

    it('should calculate percentage correctly', () => {
      const result = scorer.score('Write a function.');
      expect(result.overall.percentage).toBeCloseTo(result.overall.score * 100, 5);
    });

    it('should return 0 score for empty prompt', () => {
      const result = scorer.score('');
      expect(result.overall.score).toBeLessThan(0.3);
    });
  });

  describe('Grade Assignment', () => {
    it('should assign A+ grade for score >= 0.9', () => {
      expect(calculateGrade(0.95)).toBe('A+');
      expect(calculateGrade(0.9)).toBe('A+');
    });

    it('should assign A grade for score >= 0.85', () => {
      expect(calculateGrade(0.89)).toBe('A');
      expect(calculateGrade(0.85)).toBe('A');
    });

    it('should assign B grade for score >= 0.7', () => {
      expect(calculateGrade(0.79)).toBe('B+');
      expect(calculateGrade(0.75)).toBe('B+');
      expect(calculateGrade(0.74)).toBe('B');
      expect(calculateGrade(0.7)).toBe('B');
    });

    it('should assign C grade for score >= 0.5', () => {
      expect(calculateGrade(0.64)).toBe('C+');
      expect(calculateGrade(0.6)).toBe('C+');
      expect(calculateGrade(0.59)).toBe('C');
      expect(calculateGrade(0.5)).toBe('C-');
    });

    it('should assign D grade for score >= 0.4', () => {
      expect(calculateGrade(0.49)).toBe('D');
      expect(calculateGrade(0.4)).toBe('D');
    });

    it('should assign F grade for score < 0.4', () => {
      expect(calculateGrade(0.39)).toBe('F');
      expect(calculateGrade(0.2)).toBe('F');
      expect(calculateGrade(0)).toBe('F');
    });

    it('should assign grade to overall score', () => {
      const result = scorer.score('You are a developer. Write a function. Output as JSON.');
      expect(result.overall.grade).toBeDefined();
      expect(result.overall.grade).toMatch(/^[ABCDF][+-]?$/);
    });

    it('should assign grade to each dimension', () => {
      const result = scorer.score('Write a function.');
      
      for (const dimension of result.dimensions) {
        expect(dimension.grade).toBeDefined();
        expect(dimension.grade).toMatch(/^[ABCDF][+-]?$/);
      }
    });

    it('should assign label to overall score', () => {
      const result = scorer.score('You are a developer. Write a function. Output as JSON.');
      expect(result.overall.label).toBeDefined();
      expect(['Excellent', 'Very Good', 'Good', 'Fair', 'Needs Improvement', 'Poor']).toContain(result.overall.label);
    });
  });

  describe('Dimension Scoring', () => {
    it('should score all 8 dimensions', () => {
      const result = scorer.score('You are a developer. Write a function. Output as JSON.');
      
      expect(result.dimensions.length).toBe(8);
      
      const dimensionNames = result.dimensions.map(d => d.dimension);
      expect(dimensionNames).toContain('clarity');
      expect(dimensionNames).toContain('specificity');
      expect(dimensionNames).toContain('completeness');
      expect(dimensionNames).toContain('structure');
      expect(dimensionNames).toContain('effectiveness');
      expect(dimensionNames).toContain('actionability');
      expect(dimensionNames).toContain('accuracy');
      expect(dimensionNames).toContain('relevance');
    });

    it('should assign correct weights to dimensions', () => {
      const result = scorer.score('Write a function.');
      
      const weights: Record<string, number> = {
        clarity: 0.15,
        specificity: 0.12,
        completeness: 0.15,
        structure: 0.10,
        effectiveness: 0.12,
        actionability: 0.12,
        accuracy: 0.12,
        relevance: 0.12,
      };
      
      for (const dimension of result.dimensions) {
        expect(dimension.weight).toBe(weights[dimension.dimension]);
      }
    });

    it('should calculate weighted score for each dimension', () => {
      const result = scorer.score('Write a function.');
      
      for (const dimension of result.dimensions) {
        expect(dimension.weightedScore).toBeCloseTo(dimension.score * dimension.weight, 5);
      }
    });

    it('should calculate percentage for each dimension', () => {
      const result = scorer.score('Write a function.');
      
      for (const dimension of result.dimensions) {
        expect(dimension.percentage).toBeCloseTo(dimension.score * 100, 5);
      }
    });

    it('should set maxScore to 1.0 and minScore to 0.0', () => {
      const result = scorer.score('Write a function.');
      
      for (const dimension of result.dimensions) {
        expect(dimension.maxScore).toBe(1.0);
        expect(dimension.minScore).toBe(0.0);
      }
    });

    it('should keep all dimension scores between 0 and 1', () => {
      const result = scorer.score('Write a function.');
      
      for (const dimension of result.dimensions) {
        expect(dimension.score).toBeGreaterThanOrEqual(0);
        expect(dimension.score).toBeLessThanOrEqual(1);
      }
    });
  });

  describe('Clarity Dimension', () => {
    it('should give higher clarity score to prompts with role definition', () => {
      const withoutRole = scorer.score('Write a function that sorts numbers.');
      const withRole = scorer.score('You are a senior developer. Write a function that sorts numbers.');
      
      const clarityWithoutRole = withoutRole.dimensions.find(d => d.dimension === 'clarity')!;
      const clarityWithRole = withRole.dimensions.find(d => d.dimension === 'clarity')!;
      
      expect(clarityWithRole.score).toBeGreaterThan(clarityWithoutRole.score);
    });

    it('should give higher clarity score to prompts with structure', () => {
      const withoutStructure = scorer.score('You are a developer write a function');
      const withStructure = scorer.score('## Role\nYou are a developer.\n\n## Task\nWrite a function.');
      
      const clarityWithoutStructure = withoutStructure.dimensions.find(d => d.dimension === 'clarity')!;
      const clarityWithStructure = withStructure.dimensions.find(d => d.dimension === 'clarity')!;
      
      expect(clarityWithStructure.score).toBeGreaterThan(clarityWithoutStructure.score);
    });

    it('should penalize clarity for ambiguous words', () => {
      const clear = scorer.score('You are a developer. Write a sorting function.');
      const ambiguous = scorer.score('You are something. Write some stuff or whatever.');
      
      const clarityScore = clear.dimensions.find(d => d.dimension === 'clarity')!;
      const ambiguousScore = ambiguous.dimensions.find(d => d.dimension === 'clarity')!;
      
      expect(clarityScore.score).toBeGreaterThan(ambiguousScore.score);
    });

    it('should penalize clarity for very short prompts', () => {
      const veryShort = scorer.score('Hi');
      const adequate = scorer.score('You are a developer. Write a function that sorts numbers.');
      
      const clarityShort = veryShort.dimensions.find(d => d.dimension === 'clarity')!;
      const clarityAdequate = adequate.dimensions.find(d => d.dimension === 'clarity')!;
      
      expect(clarityAdequate.score).toBeGreaterThan(clarityShort.score);
    });

    it('should include clarity issues when role is missing', () => {
      const result = scorer.score('Write a function.');
      const clarity = result.dimensions.find(d => d.dimension === 'clarity')!;
      
      expect(clarity.issues).toContain('Missing role definition');
    });
  });

  describe('Specificity Dimension', () => {
    it('should give higher specificity score to prompts with format specification', () => {
      const withoutFormat = scorer.score('Write a function.');
      const withFormat = scorer.score('Write a function. Output as JSON.');
      
      const specificityWithout = withoutFormat.dimensions.find(d => d.dimension === 'specificity')!;
      const specificityWith = withFormat.dimensions.find(d => d.dimension === 'specificity')!;
      
      expect(specificityWith.score).toBeGreaterThan(specificityWithout.score);
    });

    it('should give higher specificity score to prompts with constraints', () => {
      const withoutConstraints = scorer.score('Write a sorting function.');
      const withConstraints = scorer.score('Write a sorting function. Do not use built-in methods.');
      
      const specificityWithout = withoutConstraints.dimensions.find(d => d.dimension === 'specificity')!;
      const specificityWith = withConstraints.dimensions.find(d => d.dimension === 'specificity')!;
      
      expect(specificityWith.score).toBeGreaterThan(specificityWithout.score);
    });

    it('should give higher specificity score to prompts with numbers', () => {
      const withoutNumbers = scorer.score('Write a function that processes items.');
      const withNumbers = scorer.score('Write a function that processes 10 items in 5 seconds.');
      
      const specificityWithout = withoutNumbers.dimensions.find(d => d.dimension === 'specificity')!;
      const specificityWith = withNumbers.dimensions.find(d => d.dimension === 'specificity')!;
      
      expect(specificityWith.score).toBeGreaterThan(specificityWithout.score);
    });

    it('should penalize specificity for very short prompts', () => {
      const veryShort = scorer.score('Code');
      const adequate = scorer.score('Write a function that sorts numbers in ascending order.');
      
      const specificityShort = veryShort.dimensions.find(d => d.dimension === 'specificity')!;
      const specificityAdequate = adequate.dimensions.find(d => d.dimension === 'specificity')!;
      
      expect(specificityAdequate.score).toBeGreaterThan(specificityShort.score);
    });
  });

  describe('Completeness Dimension', () => {
    it('should give higher completeness score to prompts with role', () => {
      const withoutRole = scorer.score('Write a function.');
      const withRole = scorer.score('You are a developer. Write a function.');
      
      const completenessWithout = withoutRole.dimensions.find(d => d.dimension === 'completeness')!;
      const completenessWith = withRole.dimensions.find(d => d.dimension === 'completeness')!;
      
      expect(completenessWith.score).toBeGreaterThan(completenessWithout.score);
    });

    it('should give higher completeness score to prompts with format', () => {
      const withoutFormat = scorer.score('Write a function.');
      const withFormat = scorer.score('Write a function. Output as JSON.');
      
      const completenessWithout = withoutFormat.dimensions.find(d => d.dimension === 'completeness')!;
      const completenessWith = withFormat.dimensions.find(d => d.dimension === 'completeness')!;
      
      expect(completenessWith.score).toBeGreaterThan(completenessWithout.score);
    });

    it('should give higher completeness score to prompts with constraints', () => {
      const withoutConstraints = scorer.score('Write a function.');
      const withConstraints = scorer.score('Write a function. Do not use loops.');
      
      const completenessWithout = withoutConstraints.dimensions.find(d => d.dimension === 'completeness')!;
      const completenessWith = withConstraints.dimensions.find(d => d.dimension === 'completeness')!;
      
      expect(completenessWith.score).toBeGreaterThan(completenessWithout.score);
    });

    it('should give higher completeness score to prompts with examples', () => {
      const withoutExamples = scorer.score('Write a function.');
      const withExamples = scorer.score('Write a function. For example: add(1, 2) returns 3.');
      
      const completenessWithout = withoutExamples.dimensions.find(d => d.dimension === 'completeness')!;
      const completenessWith = withExamples.dimensions.find(d => d.dimension === 'completeness')!;
      
      expect(completenessWith.score).toBeGreaterThan(completenessWithout.score);
    });

    it('should give higher completeness score to prompts with multiple paragraphs', () => {
      const singleParagraph = scorer.score('Write a function that sorts numbers.');
      const multiParagraph = scorer.score('You are a developer.\n\nWrite a function that sorts numbers.\n\nOutput as JSON.');
      
      const completenessSingle = singleParagraph.dimensions.find(d => d.dimension === 'completeness')!;
      const completenessMulti = multiParagraph.dimensions.find(d => d.dimension === 'completeness')!;
      
      expect(completenessMulti.score).toBeGreaterThan(completenessSingle.score);
    });
  });

  describe('Structure Dimension', () => {
    it('should give higher structure score to prompts with sections', () => {
      const withoutSections = scorer.score('You are a developer. Write a function.');
      const withSections = scorer.score('## Role\nYou are a developer.\n\n## Task\nWrite a function.');
      
      const structureWithout = withoutSections.dimensions.find(d => d.dimension === 'structure')!;
      const structureWith = withSections.dimensions.find(d => d.dimension === 'structure')!;
      
      expect(structureWith.score).toBeGreaterThan(structureWithout.score);
    });

    it('should give higher structure score to prompts with bullet points', () => {
      const withoutBullets = scorer.score('Write a function. Use Python. Return JSON.');
      const withBullets = scorer.score('Write a function:\n- Use Python\n- Return JSON');
      
      const structureWithout = withoutBullets.dimensions.find(d => d.dimension === 'structure')!;
      const structureWith = withBullets.dimensions.find(d => d.dimension === 'structure')!;
      
      expect(structureWith.score).toBeGreaterThan(structureWithout.score);
    });

    it('should give higher structure score to prompts with numbered lists', () => {
      const withoutNumbers = scorer.score('Write a function. Use Python. Return JSON.');
      const withNumbers = scorer.score('Write a function:\n1. Use Python\n2. Return JSON');
      
      const structureWithout = withoutNumbers.dimensions.find(d => d.dimension === 'structure')!;
      const structureWith = withNumbers.dimensions.find(d => d.dimension === 'structure')!;
      
      expect(structureWith.score).toBeGreaterThan(structureWithout.score);
    });

    it('should give higher structure score to prompts with code blocks', () => {
      const withoutCode = scorer.score('Write a function similar to the example.');
      const withCode = scorer.score('Write a function similar to:\n```\nfunction test() { return true; }\n```');
      
      const structureWithout = withoutCode.dimensions.find(d => d.dimension === 'structure')!;
      const structureWith = withCode.dimensions.find(d => d.dimension === 'structure')!;
      
      expect(structureWith.score).toBeGreaterThan(structureWithout.score);
    });

    it('should give higher structure score to prompts with multiple paragraphs', () => {
      const singleParagraph = scorer.score('You are a developer. Write a function.');
      const multiParagraph = scorer.score('You are a developer.\n\nWrite a function.');
      
      const structureSingle = singleParagraph.dimensions.find(d => d.dimension === 'structure')!;
      const structureMulti = multiParagraph.dimensions.find(d => d.dimension === 'structure')!;
      
      expect(structureMulti.score).toBeGreaterThan(structureSingle.score);
    });
  });

  describe('Effectiveness Dimension', () => {
    it('should give higher effectiveness score to prompts with role', () => {
      const withoutRole = scorer.score('Write a function.');
      const withRole = scorer.score('You are a senior developer. Write a function.');
      
      const effectivenessWithout = withoutRole.dimensions.find(d => d.dimension === 'effectiveness')!;
      const effectivenessWith = withRole.dimensions.find(d => d.dimension === 'effectiveness')!;
      
      expect(effectivenessWith.score).toBeGreaterThan(effectivenessWithout.score);
    });

    it('should give higher effectiveness score to prompts with format', () => {
      const withoutFormat = scorer.score('Write a function.');
      const withFormat = scorer.score('Write a function. Output as JSON.');
      
      const effectivenessWithout = withoutFormat.dimensions.find(d => d.dimension === 'effectiveness')!;
      const effectivenessWith = withFormat.dimensions.find(d => d.dimension === 'effectiveness')!;
      
      expect(effectivenessWith.score).toBeGreaterThan(effectivenessWithout.score);
    });

    it('should give higher effectiveness score to prompts with constraints', () => {
      const withoutConstraints = scorer.score('Write a function.');
      const withConstraints = scorer.score('Write a function. Do not use loops.');
      
      const effectivenessWithout = withoutConstraints.dimensions.find(d => d.dimension === 'effectiveness')!;
      const effectivenessWith = withConstraints.dimensions.find(d => d.dimension === 'effectiveness')!;
      
      expect(effectivenessWith.score).toBeGreaterThan(effectivenessWithout.score);
    });

    it('should give higher effectiveness score to prompts with examples', () => {
      const withoutExamples = scorer.score('Write a function.');
      const withExamples = scorer.score('Write a function. For example: add(1, 2) returns 3.');
      
      const effectivenessWithout = withoutExamples.dimensions.find(d => d.dimension === 'effectiveness')!;
      const effectivenessWith = withExamples.dimensions.find(d => d.dimension === 'effectiveness')!;
      
      expect(effectivenessWith.score).toBeGreaterThan(effectivenessWithout.score);
    });

    it('should give higher effectiveness score to prompts with structure', () => {
      const withoutStructure = scorer.score('Write a function.');
      const withStructure = scorer.score('Write a function:\n- Use Python\n- Return JSON');
      
      const effectivenessWithout = withoutStructure.dimensions.find(d => d.dimension === 'effectiveness')!;
      const effectivenessWith = withStructure.dimensions.find(d => d.dimension === 'effectiveness')!;
      
      expect(effectivenessWith.score).toBeGreaterThan(effectivenessWithout.score);
    });
  });

  describe('Actionability Dimension', () => {
    it('should give higher actionability score to prompts with action verbs', () => {
      const withoutAction = scorer.score('A function for sorting.');
      const withAction = scorer.score('Write a function that sorts numbers.');
      
      const actionabilityWithout = withoutAction.dimensions.find(d => d.dimension === 'actionability')!;
      const actionabilityWith = withAction.dimensions.find(d => d.dimension === 'actionability')!;
      
      expect(actionabilityWith.score).toBeGreaterThan(actionabilityWithout.score);
    });

    it('should recognize multiple action verbs', () => {
      const singleAction = scorer.score('Write a function.');
      const multipleActions = scorer.score('Create a function, analyze the input, generate output, and explain the logic.');
      
      const actionabilitySingle = singleAction.dimensions.find(d => d.dimension === 'actionability')!;
      const actionabilityMultiple = multipleActions.dimensions.find(d => d.dimension === 'actionability')!;
      
      expect(actionabilityMultiple.score).toBeGreaterThan(actionabilitySingle.score);
    });

    it('should give higher actionability score to prompts with examples', () => {
      const withoutExamples = scorer.score('Write a function.');
      const withExamples = scorer.score('Write a function. For example: add(1, 2) returns 3.');
      
      const actionabilityWithout = withoutExamples.dimensions.find(d => d.dimension === 'actionability')!;
      const actionabilityWith = withExamples.dimensions.find(d => d.dimension === 'actionability')!;
      
      expect(actionabilityWith.score).toBeGreaterThan(actionabilityWithout.score);
    });

    it('should penalize actionability for very short prompts', () => {
      const veryShort = scorer.score('Code');
      const adequate = scorer.score('Write a function that sorts numbers.');
      
      const actionabilityShort = veryShort.dimensions.find(d => d.dimension === 'actionability')!;
      const actionabilityAdequate = adequate.dimensions.find(d => d.dimension === 'actionability')!;
      
      expect(actionabilityAdequate.score).toBeGreaterThan(actionabilityShort.score);
    });
  });

  describe('Accuracy Dimension', () => {
    it('should give higher accuracy score to prompts with role', () => {
      const withoutRole = scorer.score('Write a function.');
      const withRole = scorer.score('You are a developer. Write a function.');
      
      const accuracyWithout = withoutRole.dimensions.find(d => d.dimension === 'accuracy')!;
      const accuracyWith = withRole.dimensions.find(d => d.dimension === 'accuracy')!;
      
      expect(accuracyWith.score).toBeGreaterThan(accuracyWithout.score);
    });

    it('should give higher accuracy score to prompts with examples', () => {
      const withoutExamples = scorer.score('Write a function.');
      const withExamples = scorer.score('Write a function. For example: add(1, 2) returns 3.');
      
      const accuracyWithout = withoutExamples.dimensions.find(d => d.dimension === 'accuracy')!;
      const accuracyWith = withExamples.dimensions.find(d => d.dimension === 'accuracy')!;
      
      expect(accuracyWith.score).toBeGreaterThan(accuracyWithout.score);
    });

    it('should give higher accuracy score to prompts with constraints', () => {
      const withoutConstraints = scorer.score('Write a function.');
      const withConstraints = scorer.score('Write a function. Do not use loops.');
      
      const accuracyWithout = withoutConstraints.dimensions.find(d => d.dimension === 'accuracy')!;
      const accuracyWith = withConstraints.dimensions.find(d => d.dimension === 'accuracy')!;
      
      expect(accuracyWith.score).toBeGreaterThan(accuracyWithout.score);
    });

    it('should give higher accuracy score to longer prompts', () => {
      const short = scorer.score('Write code.');
      const long = scorer.score('You are a senior Python developer. Write a function that sorts a list of numbers in ascending order.');
      
      const accuracyShort = short.dimensions.find(d => d.dimension === 'accuracy')!;
      const accuracyLong = long.dimensions.find(d => d.dimension === 'accuracy')!;
      
      expect(accuracyLong.score).toBeGreaterThan(accuracyShort.score);
    });
  });

  describe('Relevance Dimension', () => {
    it('should give higher relevance score to prompts with role', () => {
      const withoutRole = scorer.score('Write a function.');
      const withRole = scorer.score('You are a developer. Write a function.');
      
      const relevanceWithout = withoutRole.dimensions.find(d => d.dimension === 'relevance')!;
      const relevanceWith = withRole.dimensions.find(d => d.dimension === 'relevance')!;
      
      expect(relevanceWith.score).toBeGreaterThan(relevanceWithout.score);
    });

    it('should give higher relevance score to prompts with format', () => {
      const withoutFormat = scorer.score('Write a function.');
      const withFormat = scorer.score('Write a function. Output as JSON.');
      
      const relevanceWithout = withoutFormat.dimensions.find(d => d.dimension === 'relevance')!;
      const relevanceWith = withFormat.dimensions.find(d => d.dimension === 'relevance')!;
      
      expect(relevanceWith.score).toBeGreaterThan(relevanceWithout.score);
    });

    it('should give higher relevance score to prompts with domain keywords', () => {
      const withoutKeywords = scorer.score('Write something.');
      const withKeywords = scorer.score('Write a function that queries the database and returns user data to the client.');
      
      const relevanceWithout = withoutKeywords.dimensions.find(d => d.dimension === 'relevance')!;
      const relevanceWith = withKeywords.dimensions.find(d => d.dimension === 'relevance')!;
      
      expect(relevanceWith.score).toBeGreaterThan(relevanceWithout.score);
    });

    it('should give higher relevance score to longer prompts', () => {
      const short = scorer.score('Code');
      const long = scorer.score('Write a function that processes user data.');
      
      const relevanceShort = short.dimensions.find(d => d.dimension === 'relevance')!;
      const relevanceLong = long.dimensions.find(d => d.dimension === 'relevance')!;
      
      expect(relevanceLong.score).toBeGreaterThan(relevanceShort.score);
    });
  });

  describe('Recommendation Generation', () => {
    it('should generate recommendations for low-scoring dimensions', () => {
      const result = scorer.score('Write code.');
      
      expect(result.metadata.recommendations).toBeDefined();
      expect(Array.isArray(result.metadata.recommendations)).toBe(true);
      expect(result.metadata.recommendations.length).toBeGreaterThan(0);
    });

    it('should recommend adding role when missing', () => {
      const result = scorer.score('Write a function.');
      
      const hasRoleRecommendation = result.metadata.recommendations.some(
        (r: string) => r.toLowerCase().includes('role')
      );
      expect(hasRoleRecommendation).toBe(true);
    });

    it('should recommend adding format when missing', () => {
      const result = scorer.score('Write a function.');
      
      const hasFormatRecommendation = result.metadata.recommendations.some(
        (r: string) => r.toLowerCase().includes('format')
      );
      expect(hasFormatRecommendation).toBe(true);
    });

    it('should recommend adding constraints when missing', () => {
      const result = scorer.score('Write a function.');
      
      const hasConstraintRecommendation = result.metadata.recommendations.some(
        (r: string) => r.toLowerCase().includes('constraint')
      );
      expect(hasConstraintRecommendation).toBe(true);
    });

    it('should recommend adding examples for longer prompts without examples', () => {
      const result = scorer.score('You are a developer. Write a function that sorts numbers in ascending order.');
      
      const hasExampleRecommendation = result.metadata.recommendations.some(
        (r: string) => r.toLowerCase().includes('example')
      );
      expect(hasExampleRecommendation).toBe(true);
    });

    it('should include dimension-specific recommendations for low scores', () => {
      const result = scorer.score('Code');
      
      // Should have recommendations for multiple low-scoring dimensions
      const lowScoringDimensions = result.dimensions.filter(d => d.score < 0.6);
      
      // Should have at least one recommendation per low-scoring dimension
      expect(result.metadata.recommendations.length).toBeGreaterThanOrEqual(lowScoringDimensions.length);
    });

    it('should provide fewer recommendations for high-quality prompts', () => {
      const lowQuality = scorer.score('Code');
      const highQuality = scorer.score(
        'You are a senior Python developer. Write a function that sorts a list of numbers. Do not use built-in sort. Output as JSON. For example: sort([3,1,2]) returns [1,2,3].'
      );
      
      expect(highQuality.metadata.recommendations.length).toBeLessThan(lowQuality.metadata.recommendations.length);
    });

    it('should include specific improvement suggestions', () => {
      const result = scorer.score('Write code.');
      
      // Recommendations should be actionable and specific
      for (const recommendation of result.metadata.recommendations) {
        expect(recommendation.length).toBeGreaterThan(10); // Should be descriptive
        expect(typeof recommendation).toBe('string');
      }
    });
  });

  describe('Metadata and Computed Fields', () => {
    it('should generate unique promptId', () => {
      const result1 = scorer.score('Write a function.');
      const result2 = scorer.score('Write a function.');
      
      expect(result1.promptId).toBeDefined();
      expect(result2.promptId).toBeDefined();
      expect(result1.promptId).not.toBe(result2.promptId);
    });

    it('should generate unique result id', () => {
      const result1 = scorer.score('Write a function.');
      const result2 = scorer.score('Write a function.');
      
      expect(result1.id).toBeDefined();
      expect(result2.id).toBeDefined();
      expect(result1.id).not.toBe(result2.id);
    });

    it('should include createdAt timestamp', () => {
      const result = scorer.score('Write a function.');
      
      expect(result.createdAt).toBeDefined();
      expect(new Date(result.createdAt).getTime()).toBeGreaterThan(0);
    });

    it('should set scoringVersion', () => {
      const result = scorer.score('Write a function.');
      expect(result.scoringVersion).toBe('1.0.0');
    });

    it('should track analysisTimeMs', () => {
      const result = scorer.score('Write a function.');
      
      expect(result.analysisTimeMs).toBeDefined();
      expect(result.analysisTimeMs).toBeGreaterThanOrEqual(0);
      expect(typeof result.analysisTimeMs).toBe('number');
    });

    it('should calculate dimensionCount', () => {
      const result = scorer.score('Write a function.');
      expect(result.dimensionCount).toBe(8);
    });

    it('should calculate averageDimensionScore', () => {
      const result = scorer.score('Write a function.');
      
      const sum = result.dimensions.reduce((acc, d) => acc + d.score, 0);
      const expected = sum / result.dimensions.length;
      
      expect(result.averageDimensionScore).toBeCloseTo(expected, 5);
    });

    it('should identify lowestDimension', () => {
      const result = scorer.score('Write a function.');
      
      expect(result.lowestDimension).toBeDefined();
      
      const minScore = Math.min(...result.dimensions.map(d => d.score));
      expect(result.lowestDimension!.score).toBe(minScore);
    });

    it('should identify highestDimension', () => {
      const result = scorer.score('Write a function.');
      
      expect(result.highestDimension).toBeDefined();
      
      const maxScore = Math.max(...result.dimensions.map(d => d.score));
      expect(result.highestDimension!.score).toBe(maxScore);
    });

    it('should initialize empty arrays for comparedPrompts and historicalScores', () => {
      const result = scorer.score('Write a function.');
      
      expect(result.comparedPrompts).toEqual([]);
      expect(result.historicalScores).toEqual([]);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty prompt', () => {
      const result = scorer.score('');
      
      expect(result).toBeDefined();
      expect(result.overall.score).toBeGreaterThanOrEqual(0);
      expect(result.overall.score).toBeLessThanOrEqual(1);
      expect(result.dimensions.length).toBe(8);
    });

    it('should handle very short prompt', () => {
      const result = scorer.score('Hi');
      
      expect(result).toBeDefined();
      expect(result.overall.score).toBeGreaterThanOrEqual(0);
      expect(result.overall.score).toBeLessThanOrEqual(1);
    });

    it('should handle very long prompt', () => {
      const longPrompt = 'You are a developer. '.repeat(100) + 'Write a function.';
      const result = scorer.score(longPrompt);
      
      expect(result).toBeDefined();
      expect(result.overall.score).toBeGreaterThanOrEqual(0);
      expect(result.overall.score).toBeLessThanOrEqual(1);
    });

    it('should handle prompt with special characters', () => {
      const result = scorer.score('You are a developer. Write a function with @#$%^&*() characters.');
      
      expect(result).toBeDefined();
      expect(result.dimensions.length).toBe(8);
    });

    it('should handle prompt with unicode characters', () => {
      const result = scorer.score('You are a developer. Write a function with émojis 🚀 and ñ characters.');
      
      expect(result).toBeDefined();
      expect(result.dimensions.length).toBe(8);
    });

    it('should handle prompt with only whitespace', () => {
      const result = scorer.score('   \n\n   \t  ');
      
      expect(result).toBeDefined();
      expect(result.overall.score).toBeGreaterThanOrEqual(0);
    });

    it('should handle null input gracefully', () => {
      const result = scorer.score(null as any);
      
      expect(result).toBeDefined();
      expect(result.dimensions.length).toBe(8);
    });

    it('should handle undefined input gracefully', () => {
      const result = scorer.score(undefined as any);
      
      expect(result).toBeDefined();
      expect(result.dimensions.length).toBe(8);
    });
  });

  describe('StaticAnalyzer', () => {
    const analyzer = new StaticAnalyzer();

    it('should count tokens correctly', () => {
      const analysis = analyzer.analyze('You are a developer. Write a function.');
      
      expect(analysis.tokenCount.words).toBeGreaterThan(0);
      expect(analysis.tokenCount.sentences).toBeGreaterThan(0);
      expect(analysis.tokenCount.total).toBeGreaterThan(0);
    });

    it('should detect structure elements', () => {
      const analysis = analyzer.analyze('## Role\nYou are a developer.\n\n- Task 1\n- Task 2\n\n1. Step 1\n\n```code```');
      
      expect(analysis.structureElements.hasSections).toBe(true);
      expect(analysis.structureElements.hasBulletPoints).toBe(true);
      expect(analysis.structureElements.hasNumberedList).toBe(true);
      expect(analysis.structureElements.hasCodeBlocks).toBe(true);
    });

    it('should detect format requirements', () => {
      const analysis = analyzer.analyze('Write a function. Output as JSON.');
      
      expect(analysis.formatIndicators.hasExplicitFormat).toBe(true);
      expect(analysis.formatIndicators.formatsDetected.json).toBe(true);
    });

    it('should detect constraints', () => {
      const analysis = analyzer.analyze('Write a function. Do not use loops. Maximum 100 lines.');
      
      expect(analysis.constraintIndicators.hasConstraints).toBe(true);
      expect(analysis.constraintIndicators.negativeConstraints.length).toBeGreaterThan(0);
      expect(analysis.constraintIndicators.limits.length).toBeGreaterThan(0);
    });

    it('should detect role indicators', () => {
      const analysis = analyzer.analyze('You are a senior developer. Act as an expert.');
      
      expect(analysis.roleIndicators.hasRole).toBe(true);
      expect(analysis.roleIndicators.detectedRoles.length).toBeGreaterThan(0);
    });

    it('should detect examples', () => {
      const analysis = analyzer.analyze('Write a function. For example: add(1, 2) returns 3.');
      
      expect(analysis.exampleIndicators.hasExamples).toBe(true);
      expect(analysis.exampleIndicators.exampleCount).toBeGreaterThan(0);
    });

    it('should detect anti-patterns', () => {
      const analysis = analyzer.analyze('Tell me everything about programming.');
      
      // Should detect "Open-Ended Without Scope" anti-pattern
      expect(analysis.antiPatternMatches.length).toBeGreaterThan(0);
    });

    it('should detect ambiguous quantifiers', () => {
      const analysis = analyzer.analyze('Write some code with a few examples.');
      
      const hasAmbiguousQuantifier = analysis.antiPatternMatches.some(
        ap => ap.patternId === 'AP006'
      );
      expect(hasAmbiguousQuantifier).toBe(true);
    });

    it('should handle empty input', () => {
      const analysis = analyzer.analyze('');
      
      expect(analysis).toBeDefined();
      expect(analysis.tokenCount.words).toBe(0);
      expect(analysis.roleIndicators.hasRole).toBe(false);
    });
  });

  describe('Integration Tests', () => {
    it('should produce consistent results for same prompt', () => {
      const result1 = scorer.score('You are a developer. Write a function. Output as JSON.');
      const result2 = scorer.score('You are a developer. Write a function. Output as JSON.');
      
      expect(result1.overall.score).toBeCloseTo(result2.overall.score, 5);
      
      for (let i = 0; i < result1.dimensions.length; i++) {
        expect(result1.dimensions[i].score).toBeCloseTo(result2.dimensions[i].score, 5);
      }
    });

    it('should score complete prompt higher than incomplete prompt', () => {
      const incomplete = scorer.score('Write code.');
      const complete = scorer.score(
        'You are a senior Python developer with 10 years of experience. Given a list of numbers, write a function that sorts them in ascending order. Do not use built-in sort methods. The function should have O(n log n) time complexity. Output the result as JSON with the function code and explanation. For example: sort([3,1,2]) should return {"sorted": [1,2,3], "algorithm": "merge sort"}. Target audience: junior developers. Use a professional tone.'
      );
      
      expect(complete.overall.score).toBeGreaterThan(incomplete.overall.score);
      
      // Most dimensions should score higher in complete prompt
      let higherDimensions = 0;
      for (let i = 0; i < complete.dimensions.length; i++) {
        if (complete.dimensions[i].score > incomplete.dimensions[i].score) {
          higherDimensions++;
        }
      }
      
      expect(higherDimensions).toBeGreaterThan(4); // At least half should be higher
    });

    it('should handle multilingual prompts', () => {
      const enResult = scorer.score('You are a developer. Write a function.');
      const ptResult = scorer.score('Você é um desenvolvedor. Escreva uma função.');
      const esResult = scorer.score('Usted es un desarrollador. Escriba una función.');
      
      // All should produce valid results
      expect(enResult.overall.score).toBeGreaterThan(0);
      expect(ptResult.overall.score).toBeGreaterThan(0);
      expect(esResult.overall.score).toBeGreaterThan(0);
      
      // Scores should be similar for equivalent prompts
      expect(Math.abs(enResult.overall.score - ptResult.overall.score)).toBeLessThan(0.3);
      expect(Math.abs(enResult.overall.score - esResult.overall.score)).toBeLessThan(0.3);
    });

    it('should complete analysis in reasonable time', () => {
      const start = performance.now();
      scorer.score('You are a developer. Write a function that sorts numbers. Output as JSON.');
      const end = performance.now();
      
      const duration = end - start;
      expect(duration).toBeLessThan(100); // Should complete in less than 100ms
    });
  });
});
