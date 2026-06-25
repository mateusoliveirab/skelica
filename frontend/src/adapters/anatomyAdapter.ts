/**
 * Anatomy Adapter - Converts AnatomyResult to AnalyzeResponse format
 * Provides backward compatibility with existing API response format
 */

import type { AnatomyResult, ComponentMatch } from '../types/anatomy';
import type { AnalyzeResponse, AnalysisResult, ComponentPresence, PromptComponent } from '../api/types';

/**
 * Map new component types to legacy API component types
 */
const COMPONENT_TYPE_MAP: Record<string, PromptComponent> = {
  role: 'role',
  context: 'context',
  instruction: 'instruction',
  constraint: 'constraint',
  negative_constraint: 'negative_constraint',
  example: 'example',
  format: 'output_format',
  output_spec: 'output_format',
  audience: 'audience',
  tone: 'tone',
  // Additional mappings for compatibility
  goal: 'instruction',
  input_data: 'context',
  reference: 'example',
  constraint_negative: 'negative_constraint',
  chain_of_thought: 'instruction',
  persona: 'role',
};

/**
 * Component importance weights for the legacy API format
 */
const COMPONENT_IMPORTANCE: Record<PromptComponent, number> = {
  role: 0.9,
  context: 0.8,
  instruction: 1.0,
  example: 0.7,
  constraint: 0.8,
  negative_constraint: 0.85,
  output_format: 0.8,
  audience: 0.6,
  tone: 0.5,
};

/**
 * Component descriptions for the legacy API format
 */
const COMPONENT_DESCRIPTIONS: Record<PromptComponent, string> = {
  role: 'Defines who the AI should act as and their expertise level',
  context: 'Provides background information and scenario details',
  instruction: 'Specifies the main task or action to perform',
  example: 'Demonstrates expected input/output or provides samples',
  constraint: 'Sets rules, limitations, and requirements',
  negative_constraint: 'Explicitly defines what the AI should NOT do (Don\'ts)',
  output_format: 'Defines how the response should be structured',
  audience: 'Identifies the target audience for the response',
  tone: 'Specifies the style or voice of the response',
};

/**
 * Convert AnatomyResult to AnalyzeResponse format
 * 
 * This adapter transforms the new anatomy analysis format to the legacy API format
 * that existing components expect. It aggregates components by type and calculates
 * quality scores for each component type.
 * 
 * @param anatomyResult - The result from AnatomyParser.parse()
 * @returns AnalyzeResponse compatible with existing frontend components
 */
export function convertAnatomyToAnalyzeResponse(anatomyResult: AnatomyResult): AnalyzeResponse {
  // Group components by type
  const componentsByType = new Map<PromptComponent, ComponentMatch[]>();
  
  for (const component of anatomyResult.components) {
    const legacyType = COMPONENT_TYPE_MAP[component.componentType] || 'instruction';
    
    if (!componentsByType.has(legacyType)) {
      componentsByType.set(legacyType, []);
    }
    
    componentsByType.get(legacyType)!.push(component);
  }

  // Build analysis results for each component type
  const analysisResults: AnalysisResult[] = [];
  
  // Define all possible component types to ensure consistent output
  const allComponentTypes: PromptComponent[] = [
    'role',
    'context',
    'instruction',
    'example',
    'constraint',
    'negative_constraint',
    'output_format',
    'audience',
    'tone',
  ];

  for (const componentType of allComponentTypes) {
    const matches = componentsByType.get(componentType) || [];
    const isPresent = matches.length > 0;
    
    // Calculate quality score for this component type
    const qualityScore = isPresent
      ? matches.reduce((sum, m) => sum + m.confidence, 0) / matches.length
      : 0;

    // Extract content and position from first match
    const firstMatch = matches[0];
    const content = isPresent
      ? anatomyResult.rawText.substring(firstMatch.start, firstMatch.end).trim()
      : null;

    // Generate suggestions for missing or low-quality components
    const suggestions = generateSuggestions(componentType, isPresent, qualityScore);

    const presence: ComponentPresence = {
      present: isPresent,
      content,
      quality_score: qualityScore,
      suggestions: suggestions.length > 0 ? suggestions : undefined,
      start: firstMatch?.start,
      end: firstMatch?.end,
    };

    analysisResults.push({
      component: componentType,
      presence,
      importance: COMPONENT_IMPORTANCE[componentType],
      description: COMPONENT_DESCRIPTIONS[componentType],
      start: firstMatch?.start,
      end: firstMatch?.end,
    });
  }

  // Generate summary based on completeness and quality
  const summary = generateSummary(anatomyResult, analysisResults);

  return {
    prompt: anatomyResult.rawText,
    components: analysisResults,
    overall_score: anatomyResult.overallQualityScore,
    summary,
    created_at: anatomyResult.createdAt,
  };
}

/**
 * Generate suggestions for improving a component
 */
function generateSuggestions(
  componentType: PromptComponent,
  isPresent: boolean,
  qualityScore: number
): string[] {
  const suggestions: string[] = [];

  if (!isPresent) {
    switch (componentType) {
      case 'role':
        suggestions.push('Add a clear role definition (e.g., "You are a senior software engineer...")');
        break;
      case 'context':
        suggestions.push('Provide background information or scenario details');
        break;
      case 'instruction':
        suggestions.push('Specify the main task or action you want performed');
        break;
      case 'example':
        suggestions.push('Include examples to demonstrate expected output');
        break;
      case 'constraint':
        suggestions.push('Add explicit constraints or limitations');
        break;
      case 'negative_constraint':
        suggestions.push('Explicitly state what to avoid to prevent hallucinations');
        break;
      case 'output_format':
        suggestions.push('Specify the desired output format (e.g., JSON, list, table)');
        break;
      case 'audience':
        suggestions.push('Define the target audience for the response');
        break;
      case 'tone':
        suggestions.push('Specify the desired tone or style');
        break;
    }
  } else if (qualityScore < 0.6) {
    suggestions.push(`Improve the quality of your ${componentType} definition`);
  }

  return suggestions;
}

/**
 * Generate a summary of the analysis
 */
function generateSummary(anatomyResult: AnatomyResult, analysisResults: AnalysisResult[]): string {
  const presentCount = analysisResults.filter(r => r.presence.present).length;
  const totalCount = analysisResults.length;
  const completeness = anatomyResult.completenessScore;
  const quality = anatomyResult.overallQualityScore;

  // Determine quality level
  let qualityLevel: string;
  if (quality >= 0.8) {
    qualityLevel = 'excellent';
  } else if (quality >= 0.6) {
    qualityLevel = 'good';
  } else if (quality >= 0.4) {
    qualityLevel = 'fair';
  } else {
    qualityLevel = 'needs improvement';
  }

  // Find missing essential components
  const missingEssential = analysisResults
    .filter(r => !r.presence.present && r.importance >= 0.8)
    .map(r => r.component);

  let summary = `Your prompt has ${presentCount} of ${totalCount} components detected. `;
  summary += `Overall quality is ${qualityLevel} (${Math.round(quality * 100)}%). `;
  summary += `Completeness score: ${Math.round(completeness * 100)}%. `;

  if (missingEssential.length > 0) {
    summary += `Consider adding: ${missingEssential.join(', ')}.`;
  } else if (quality < 0.8) {
    summary += 'Consider improving component quality for better results.';
  } else {
    summary += 'Your prompt is well-structured!';
  }

  return summary;
}

/**
 * Extract component content from raw text
 * Helper function for backward compatibility
 */
export function extractComponentContent(
  rawText: string,
  componentType: PromptComponent,
  anatomyResult: AnatomyResult
): string | null {
  const legacyType = componentType;
  
  // Find all components that map to this legacy type
  const matchingComponents = anatomyResult.components.filter(
    c => COMPONENT_TYPE_MAP[c.componentType] === legacyType
  );

  if (matchingComponents.length === 0) {
    return null;
  }

  // Return content from the first match
  const firstMatch = matchingComponents[0];
  return rawText.substring(firstMatch.start, firstMatch.end).trim();
}
