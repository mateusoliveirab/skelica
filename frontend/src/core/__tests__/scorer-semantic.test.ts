import { describe, it, expect, vi } from 'vitest';
import { Scorer } from '../scorer';

describe('Scorer with Semantic Mocking', () => {
  it('should use provided semantic component scores to calculate completeness', () => {
    const scorer = new Scorer();
    const prompt = "Short prompt."; // Low natural score
    
    // Without semantic data, completeness should be low
    const resultWithoutSemantic = scorer.score(prompt);
    const scoreWithout = resultWithoutSemantic.dimensions.find(d => d.dimension === 'completeness')?.score || 0;
    
    // With semantic data (all 8 components detected with high confidence)
    const mockSemanticData = {
      role: 0.9,
      context: 0.9,
      instruction: 0.9,
      constraint: 0.9,
      example: 0.9,
      format: 0.9,
      audience: 0.9,
      tone: 0.9
    };
    
    const resultWithSemantic = scorer.score(prompt, mockSemanticData);
    const scoreWith = resultWithSemantic.dimensions.find(d => d.dimension === 'completeness')?.score || 0;
    
    expect(scoreWith).toBeGreaterThan(scoreWithout);
    expect(scoreWith).toBeGreaterThan(0.8); // 0.1 base + sum of all weights + bonus
  });

  it('should correctly apply weights from semantic components', () => {
    const scorer = new Scorer();
    const prompt = "Prompt.";
    
    // Only instruction detected
    const onlyInstruction = scorer.score(prompt, { instruction: 0.9 });
    const instructionScore = onlyInstruction.dimensions.find(d => d.dimension === 'completeness')?.score || 0;
    
    // Only role detected
    const onlyRole = scorer.score(prompt, { role: 0.9 });
    const roleScore = onlyRole.dimensions.find(d => d.dimension === 'completeness')?.score || 0;
    
    // weights: instruction=0.2, role=0.2. Base=0.1. (Words < 5 penalty -0.1)
    // Actually base 0.1 - 0.1 (penalty) + 0.2 = 0.2
    expect(instructionScore).toBeCloseTo(0.2, 1);
    expect(roleScore).toBeCloseTo(0.2, 1);
    
    // Both detected
    const both = scorer.score(prompt, { instruction: 0.9, role: 0.9 });
    const bothScore = both.dimensions.find(d => d.dimension === 'completeness')?.score || 0;
    expect(bothScore).toBeCloseTo(0.4, 1);
  });
});
