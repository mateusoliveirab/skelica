/**
 * TypeScript types matching backend Pydantic models for scoring
 * Based on backend/app/models/score.py
 */

// Enums as const objects (compatible with erasableSyntaxOnly)
export const ScoreDimension = {
  CLARITY: 'clarity',
  SPECIFICITY: 'specificity',
  COMPLETENESS: 'completeness',
  STRUCTURE: 'structure',
  EFFECTIVENESS: 'effectiveness',
  SAFETY: 'safety',
  EFFICIENCY: 'efficiency',
  ADAPTABILITY: 'adaptability',
  PROFESSIONALISM: 'professionalism',
  ACTIONABILITY: 'actionability',
  ACCURACY: 'accuracy',
  RELEVANCE: 'relevance',
  CONSISTENCY: 'consistency',
} as const;

export type ScoreDimension = typeof ScoreDimension[keyof typeof ScoreDimension];

// Interfaces
export interface DimensionScore {
  dimension: ScoreDimension;
  score: number; // 0-1
  weight: number; // 0-10
  maxScore: number;
  minScore: number;
  percentile?: number; // 0-100
  label?: string;
  description?: string;
  issues: string[];
  strengths: string[];
  improvementActions: string[];
  benchmarkAverage?: number; // 0-1
  benchmarkTop10?: number; // 0-1
  // Computed fields
  weightedScore: number;
  percentage: number;
  grade: string;
}

export interface OverallScore {
  score: number; // 0-1
  weightedAverage: number; // 0-1
  calculationMethod: string;
  confidence: number; // 0-1
  percentile?: number; // 0-100
  label?: string;
  grade?: string;
  benchmarkAverage?: number; // 0-1
  benchmarkTop10?: number; // 0-1
  improvementPotential: number; // 0-1
  // Computed field
  percentage: number;
}

export interface ScoreResult {
  id: string;
  createdAt: string; // ISO date string
  updatedAt?: string; // ISO date string
  metadata: {
    recommendations: string[];
    [key: string]: unknown;
  };
  promptId: string;
  anatomyResultId?: string;
  suggestionResultId?: string;
  overall: OverallScore;
  dimensions: DimensionScore[];
  scoringVersion: string;
  scoringModel?: string;
  analysisTimeMs: number;
  comparedPrompts: string[];
  historicalScores: number[];
  // Computed fields
  dimensionCount: number;
  averageDimensionScore: number;
  lowestDimension?: DimensionScore;
  highestDimension?: DimensionScore;
}

// Helper functions for grade calculation
export function calculateGrade(score: number): string {
  if (score >= 0.9) return 'A+';
  if (score >= 0.85) return 'A';
  if (score >= 0.8) return 'A-';
  if (score >= 0.75) return 'B+';
  if (score >= 0.7) return 'B';
  if (score >= 0.65) return 'B-';
  if (score >= 0.6) return 'C+';
  if (score >= 0.55) return 'C';
  if (score >= 0.5) return 'C-';
  if (score >= 0.4) return 'D';
  return 'F';
}

export function calculateLabel(score: number): string {
  if (score >= 0.9) return 'Excellent';
  if (score >= 0.8) return 'Very Good';
  if (score >= 0.7) return 'Good';
  if (score >= 0.6) return 'Fair';
  if (score >= 0.5) return 'Needs Improvement';
  return 'Poor';
}
