/**
 * TypeScript types matching backend Pydantic models for anatomy analysis
 * Based on backend/app/models/anatomy.py and backend/app/models/prompt.py
 */

// Enums as const objects (compatible with erasableSyntaxOnly)
export const PromptComponentType = {
  CONTEXT: 'context',
  INSTRUCTION: 'instruction',
  CONSTRAINT: 'constraint',
  EXAMPLE: 'example',
  FORMAT: 'format',
  ROLE: 'role',
  GOAL: 'goal',
  INPUT_DATA: 'input_data',
  OUTPUT_SPEC: 'output_spec',
  TONE: 'tone',
  AUDIENCE: 'audience',
  NEGATIVE_CONSTRAINT: 'negative_constraint',
  REFERENCE: 'reference',
  CONSTRAINT_NEGATIVE: 'constraint_negative', // Keeping for backward compatibility
  CHAIN_OF_THOUGHT: 'chain_of_thought',
  PERSONA: 'persona',
} as const;

export type PromptComponentType = typeof PromptComponentType[keyof typeof PromptComponentType];

export const HighlightType = {
  ROLE: 'role',
  INSTRUCTION: 'instruction',
  CONSTRAINT: 'constraint',
  NEGATIVE_CONSTRAINT: 'negative_constraint',
  CONTEXT: 'context',
  EXAMPLE: 'example',
  FORMAT: 'format',
  GOAL: 'goal',
  TONE: 'tone',
  AUDIENCE: 'audience',
  ISSUE: 'issue',
  SUGGESTION: 'suggestion',
  EXCELLENT: 'excellent',
  WARNING: 'warning',
} as const;

export type HighlightType = typeof HighlightType[keyof typeof HighlightType];

export const RoleAreaType = {
  OPENING: 'opening',
  CONTEXT_SETTING: 'context_setting',
  INSTRUCTION_BLOCK: 'instruction_block',
  CONSTRAINT_BLOCK: 'constraint_block',
  EXAMPLE_BLOCK: 'example_block',
  CLOSING: 'closing',
} as const;

export type RoleAreaType = typeof RoleAreaType[keyof typeof RoleAreaType];

// Interfaces
export interface HighlightedPhrase {
  phraseId: string;
  text: string;
  highlightType: HighlightType;
  highlightColor?: string;
  tooltip?: string;
  cssClass?: string;
  priority: number;
}

export interface ComponentMatch {
  componentId: string;
  componentType: PromptComponentType;
  matchScore: number; // 0-1
  isExactMatch: boolean;
  matchedPatterns: string[];
  confidence: number; // 0-1
  alternativeTypes: PromptComponentType[];
  start: number;
  end: number;
}

export interface RoleArea {
  id: string;
  areaType: RoleAreaType;
  label: string;
  description: string;
  components: ComponentMatch[];
  phrases: HighlightedPhrase[];
  startPosition: number;
  endPosition: number;
  isPresent: boolean;
  qualityScore: number; // 0-1
  expectedComponents: PromptComponentType[];
  missingComponents: PromptComponentType[];
}

export interface AnatomyResult {
  id: string;
  createdAt: string; // ISO date string
  updatedAt?: string; // ISO date string
  metadata: {
    detectedLanguage: string;
    [key: string]: unknown;
  };
  promptId: string;
  rawText: string;
  anatomyVersion: string;
  areas: RoleArea[];
  components: ComponentMatch[];
  highlightedPhrases: HighlightedPhrase[];
  overallQualityScore: number; // 0-1
  completenessScore: number; // 0-1
  analysisTimeMs: number;
  modelUsed?: string;
  parseError?: boolean;
  // Computed fields
  areaCount: number;
  presentAreaCount: number;
}

export interface Phrase {
  id: string;
  text: string;
  startPosition: number;
  endPosition: number;
  componentType?: PromptComponentType;
  confidence: number; // 0-1
  isKeyPhrase: boolean;
  keywords: string[];
  // Computed field
  length: number;
}

export interface PromptComponent {
  id: string;
  componentType: PromptComponentType;
  content: string;
  phrases: Phrase[];
  startPosition: number;
  endPosition: number;
  isOptional: boolean;
  isPresent: boolean;
  qualityScore: number; // 0-1
  improvementSuggestions: string[];
  // Computed field
  wordCount: number;
}

export interface Prompt {
  id: string;
  createdAt: string; // ISO date string
  updatedAt?: string; // ISO date string
  metadata: {
    [key: string]: unknown;
  };
  rawText: string;
  processedText?: string;
  language: string; // 2-letter code
  components: PromptComponent[];
  phrases: Phrase[];
  wordCount: number;
  characterCount: number;
  isComplete: boolean;
  detectedIntent?: string;
  // Computed field
  tokenEstimate: number;
}
