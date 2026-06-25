/**
 * Manual verification test for usePromptAnalysis hook
 * This file demonstrates that the hook works correctly with local implementations
 */

import { getAnatomyParser } from '../../core/anatomyParser';
import { Scorer } from '../../core/scorer';
import { convertAnatomyToAnalyzeResponse, convertScoreToScoreResponse } from '../../adapters';

/**
 * Manual test to verify the hook's core functionality
 */
export function manualTestUsePromptAnalysis() {
  console.log('=== Manual Test: usePromptAnalysis Hook ===\n');

  const testPrompt = 'You are a senior Python developer. Write a function to sort a list of numbers.';

  console.log('Test Prompt:', testPrompt);
  console.log('\n--- Running Analysis ---\n');

  // Simulate what the hook does
  const parser = getAnatomyParser();
  const scorer = new Scorer();

  // Parse anatomy
  const anatomyResult = parser.parse(testPrompt);
  console.log('✓ AnatomyParser executed');
  console.log('  - Components detected:', anatomyResult.components.length);
  console.log('  - Overall quality score:', anatomyResult.overallQualityScore.toFixed(2));
  console.log('  - Completeness score:', anatomyResult.completenessScore.toFixed(2));

  // Score prompt
  const scoreResult = scorer.score(testPrompt);
  console.log('\n✓ Scorer executed');
  console.log('  - Overall score:', scoreResult.overall.score.toFixed(2));
  console.log('  - Grade:', scoreResult.overall.grade);
  console.log('  - Dimensions:', scoreResult.dimensions.length);

  // Convert to API format using adapters
  const analysisResponse = convertAnatomyToAnalyzeResponse(anatomyResult);
  console.log('\n✓ Anatomy converted to AnalyzeResponse format');
  console.log('  - Prompt:', analysisResponse.prompt.substring(0, 50) + '...');
  console.log('  - Components:', analysisResponse.components.length);
  console.log('  - Overall score:', analysisResponse.overall_score.toFixed(2));

  const scoreResponse = convertScoreToScoreResponse(scoreResult, testPrompt);
  console.log('\n✓ Score converted to ScoreResponse format');
  console.log('  - Overall score:', scoreResponse.overall_score.toFixed(2));
  console.log('  - Grade:', scoreResponse.grade);
  console.log('  - Recommendations:', scoreResponse.recommendations.length);

  // Verify interface compatibility
  console.log('\n--- Verifying Interface Compatibility ---\n');

  // Check AnalyzeResponse structure
  const hasAnalyzeResponseFields =
    'prompt' in analysisResponse &&
    'components' in analysisResponse &&
    'overall_score' in analysisResponse &&
    'summary' in analysisResponse;

  console.log('✓ AnalyzeResponse has required fields:', hasAnalyzeResponseFields);

  // Check ScoreResponse structure
  const hasScoreResponseFields =
    'prompt' in scoreResponse &&
    'overall_score' in scoreResponse &&
    'grade' in scoreResponse &&
    'recommendations' in scoreResponse;

  console.log('✓ ScoreResponse has required fields:', hasScoreResponseFields);

  // Check component structure
  if (analysisResponse.components.length > 0) {
    const component = analysisResponse.components[0];
    const hasComponentFields =
      'component' in component &&
      'presence' in component &&
      'importance' in component &&
      'description' in component;

    console.log('✓ Component has required fields:', hasComponentFields);
  }

  console.log('\n=== Test Complete ===\n');

  return {
    anatomyResult,
    scoreResult,
    analysisResponse,
    scoreResponse,
  };
}

// Run the test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  manualTestUsePromptAnalysis();
}
