/**
 * Score Adapter - Converts ScoreResult to ScoreResponse format
 * Provides backward compatibility with existing API response format
 */

import type { ScoreResult, DimensionScore } from '../types/score';
import type { ScoreResponse, ComponentScore, PromptComponent } from '../api/types';

/**
 * Map dimension names to component types for legacy API format
 * This mapping allows dimension scores to be represented as component scores
 */
const DIMENSION_TO_COMPONENT_MAP: Record<string, PromptComponent> = {
  clarity: 'role',
  specificity: 'constraint',
  completeness: 'instruction',
  structure: 'output_format',
  effectiveness: 'instruction',
  actionability: 'instruction',
  accuracy: 'example',
  relevance: 'context',
};

/**
 * Convert ScoreResult to ScoreResponse format
 * 
 * This adapter transforms the new scoring format to the legacy API format
 * that existing components expect. It maps dimension scores to component scores
 * and generates recommendations based on low-scoring dimensions.
 * 
 * @param scoreResult - The result from Scorer.score()
 * @param promptText - The original prompt text
 * @returns ScoreResponse compatible with existing frontend components
 */
export function convertScoreToScoreResponse(
  scoreResult: ScoreResult,
  promptText: string
): ScoreResponse {
  // Convert dimension scores to component scores
  const componentScores = convertDimensionsToComponentScores(scoreResult.dimensions);

  // Extract recommendations from metadata or generate from dimensions
  const recommendationsArr = extractRecommendations(scoreResult);
  const recommendations = recommendationsArr.join(" ");

  return {
    prompt: promptText,
    overall_score: scoreResult.overall.score,
    component_scores: componentScores.length > 0 ? componentScores : null,
    grade: scoreResult.overall.grade || 'N/A',
    recommendations,
  };
}

/**
 * Convert dimension scores to component scores
 * Groups dimensions by their associated component type and averages scores
 */
function convertDimensionsToComponentScores(dimensions: DimensionScore[]): ComponentScore[] {
  // Group dimensions by component type
  const componentScoreMap = new Map<PromptComponent, {
    scores: number[];
    weights: number[];
  }>();

  for (const dimension of dimensions) {
    const componentType = DIMENSION_TO_COMPONENT_MAP[dimension.dimension] || 'instruction';
    
    if (!componentScoreMap.has(componentType)) {
      componentScoreMap.set(componentType, {
        scores: [],
        weights: [],
      });
    }

    const entry = componentScoreMap.get(componentType)!;
    entry.scores.push(dimension.score);
    entry.weights.push(dimension.weight);
  }

  // Calculate average scores for each component
  const componentScores: ComponentScore[] = [];

  for (const [component, data] of componentScoreMap.entries()) {
    const avgScore = data.scores.reduce((sum, s) => sum + s, 0) / data.scores.length;
    const avgWeight = data.weights.reduce((sum, w) => sum + w, 0) / data.weights.length;
    const weightedScore = avgScore * avgWeight;

    componentScores.push({
      component,
      score: avgScore,
      weight: avgWeight,
      weighted_score: weightedScore,
    });
  }

  // Sort by weighted score descending
  return componentScores.sort((a, b) => b.weighted_score - a.weighted_score);
}

/**
 * Extract recommendations from score result
 * Uses metadata recommendations if available, otherwise generates from dimensions
 */
function extractRecommendations(scoreResult: ScoreResult): string[] {
  // Check if recommendations are in metadata
  if (scoreResult.metadata?.recommendations && Array.isArray(scoreResult.metadata.recommendations) && scoreResult.metadata.recommendations.length > 0) {
    return scoreResult.metadata.recommendations;
  }

  // Generate recommendations from low-scoring dimensions
  const recommendations: string[] = [];

  // Find dimensions scoring below 0.6
  const lowScoringDimensions = scoreResult.dimensions
    .filter(d => d.score < 0.6)
    .sort((a, b) => a.score - b.score); // Sort by score ascending (worst first)

  for (const dimension of lowScoringDimensions) {
    const percentage = Math.round(dimension.score * 100);
    const recommendation = generateDimensionRecommendation(dimension.dimension, percentage);
    recommendations.push(recommendation);
  }

  // Add general recommendations based on overall score
  if (scoreResult.overall.score < 0.5) {
    recommendations.push('Consider restructuring your prompt with clear sections for role, context, and instructions');
  } else if (scoreResult.overall.score < 0.7) {
    recommendations.push('Add more specific details and constraints to improve prompt quality');
  }

  // If no specific recommendations, provide encouragement
  if (recommendations.length === 0) {
    if (scoreResult.overall.score >= 0.9) {
      recommendations.push('Excellent prompt! Your prompt is well-structured and comprehensive.');
    } else if (scoreResult.overall.score >= 0.8) {
      recommendations.push('Great prompt! Minor improvements could make it even better.');
    } else {
      recommendations.push('Good prompt! Consider adding examples or more specific constraints.');
    }
  }

  return recommendations;
}

/**
 * Generate a specific recommendation for a dimension
 */
function generateDimensionRecommendation(dimension: string, percentage: number): string {
  const recommendations: Record<string, string> = {
    clarity: `Improve clarity (${percentage}%): Use clear, unambiguous language and define the role explicitly.`,
    specificity: `Improve specificity (${percentage}%): Add specific details, numbers, and constraints to make the request more precise.`,
    completeness: `Improve completeness (${percentage}%): Include all necessary components: role, context, instructions, constraints, and format.`,
    structure: `Improve structure (${percentage}%): Organize your prompt with sections, bullet points, or numbered lists.`,
    effectiveness: `Improve effectiveness (${percentage}%): Ensure your prompt has clear goals, constraints, and examples to guide the response.`,
    actionability: `Improve actionability (${percentage}%): Use action verbs and provide clear, executable instructions.`,
    accuracy: `Improve accuracy (${percentage}%): Ensure all information is correct and provide examples for validation.`,
    relevance: `Improve relevance (${percentage}%): Focus on domain-specific terminology and relevant context.`,
    consistency: `Improve consistency (${percentage}%): Ensure all parts of your prompt align and don't contradict each other.`,
    safety: `Improve safety (${percentage}%): Add constraints to prevent harmful or inappropriate outputs.`,
    efficiency: `Improve efficiency (${percentage}%): Make your prompt more concise while maintaining clarity.`,
    adaptability: `Improve adaptability (${percentage}%): Consider edge cases and provide guidance for different scenarios.`,
    professionalism: `Improve professionalism (${percentage}%): Use professional language and appropriate tone.`,
  };

  return recommendations[dimension] || `Improve ${dimension} (${percentage}%): Review and enhance this aspect of your prompt.`;
}

/**
 * Create a minimal ScoreResponse for error cases
 */
export function createEmptyScoreResponse(promptText: string): ScoreResponse {
  return {
    prompt: promptText,
    overall_score: 0,
    component_scores: null,
    grade: 'F',
    recommendations: 'Unable to score prompt. Please try again.',
  };
}

/**
 * Validate that a ScoreResponse has all required fields
 */
export function validateScoreResponse(response: ScoreResponse): boolean {
  return (
    typeof response.prompt === 'string' &&
    typeof response.overall_score === 'number' &&
    typeof response.grade === 'string' &&
    typeof response.recommendations === 'string' &&
    response.overall_score >= 0 &&
    response.overall_score <= 1
  );
}
