/**
 * Tests for ScoreAdapter
 */

import { describe, it, expect } from 'vitest';
import {
  convertScoreToScoreResponse,
  createEmptyScoreResponse,
  validateScoreResponse,
} from '../scoreAdapter';
import type { ScoreResult, DimensionScore } from '../../types/score';

describe('ScoreAdapter', () => {
  it('should convert ScoreResult to ScoreResponse format', () => {
    const dimensions: DimensionScore[] = [
      {
        dimension: 'clarity',
        score: 0.8,
        weight: 0.15,
        maxScore: 1.0,
        minScore: 0.0,
        issues: [],
        strengths: [],
        improvementActions: [],
        weightedScore: 0.12,
        percentage: 80,
        grade: 'B+',
      },
      {
        dimension: 'completeness',
        score: 0.7,
        weight: 0.15,
        maxScore: 1.0,
        minScore: 0.0,
        issues: [],
        strengths: [],
        improvementActions: [],
        weightedScore: 0.105,
        percentage: 70,
        grade: 'B',
      },
    ];

    const scoreResult: ScoreResult = {
      id: 'score-id',
      createdAt: '2024-01-01T00:00:00Z',
      metadata: {
        recommendations: ['Add more examples', 'Improve clarity'],
      },
      promptId: 'prompt-id',
      overall: {
        score: 0.75,
        weightedAverage: 0.75,
        calculationMethod: 'weighted_average',
        confidence: 1.0,
        improvementPotential: 0.25,
        grade: 'B',
        percentage: 75,
      },
      dimensions,
      scoringVersion: '1.0.0',
      analysisTimeMs: 15,
      comparedPrompts: [],
      historicalScores: [],
      dimensionCount: 2,
      averageDimensionScore: 0.75,
    };

    const response = convertScoreToScoreResponse(scoreResult, 'Test prompt');

    expect(response.prompt).toBe('Test prompt');
    expect(response.overall_score).toBe(0.75);
    expect(response.grade).toBe('B');
    expect(response.recommendations).toBe('Add more examples Improve clarity');
    expect(response.component_scores).toBeDefined();
    expect(response.component_scores?.length).toBeGreaterThan(0);
  });

  it('should generate recommendations from low-scoring dimensions', () => {
    const dimensions: DimensionScore[] = [
      {
        dimension: 'clarity',
        score: 0.5, // Low score
        weight: 0.15,
        maxScore: 1.0,
        minScore: 0.0,
        issues: [],
        strengths: [],
        improvementActions: [],
        weightedScore: 0.075,
        percentage: 50,
        grade: 'C-',
      },
      {
        dimension: 'specificity',
        score: 0.4, // Low score
        weight: 0.12,
        maxScore: 1.0,
        minScore: 0.0,
        issues: [],
        strengths: [],
        improvementActions: [],
        weightedScore: 0.048,
        percentage: 40,
        grade: 'D',
      },
    ];

    const scoreResult: ScoreResult = {
      id: 'score-id',
      createdAt: '2024-01-01T00:00:00Z',
      metadata: { recommendations: [] },
      promptId: 'prompt-id',
      overall: {
        score: 0.45,
        weightedAverage: 0.45,
        calculationMethod: 'weighted_average',
        confidence: 1.0,
        improvementPotential: 0.55,
        grade: 'D',
        percentage: 45,
      },
      dimensions,
      scoringVersion: '1.0.0',
      analysisTimeMs: 10,
      comparedPrompts: [],
      historicalScores: [],
      dimensionCount: 2,
      averageDimensionScore: 0.45,
    };

    const response = convertScoreToScoreResponse(scoreResult, 'Test prompt');

    expect(response.recommendations.length).toBeGreaterThan(0);
    expect(response.recommendations).toContain('specificity');
    expect(response.recommendations).toContain('clarity');
  });

  it('should handle high-scoring prompts with positive feedback', () => {
    const dimensions: DimensionScore[] = [
      {
        dimension: 'clarity',
        score: 0.95,
        weight: 0.15,
        maxScore: 1.0,
        minScore: 0.0,
        issues: [],
        strengths: [],
        improvementActions: [],
        weightedScore: 0.1425,
        percentage: 95,
        grade: 'A+',
      },
    ];

    const scoreResult: ScoreResult = {
      id: 'score-id',
      createdAt: '2024-01-01T00:00:00Z',
      metadata: { recommendations: [] },
      promptId: 'prompt-id',
      overall: {
        score: 0.95,
        weightedAverage: 0.95,
        calculationMethod: 'weighted_average',
        confidence: 1.0,
        improvementPotential: 0.05,
        grade: 'A+',
        percentage: 95,
      },
      dimensions,
      scoringVersion: '1.0.0',
      analysisTimeMs: 10,
      comparedPrompts: [],
      historicalScores: [],
      dimensionCount: 1,
      averageDimensionScore: 0.95,
    };

    const response = convertScoreToScoreResponse(scoreResult, 'Test prompt');

    expect(response.recommendations.length).toBeGreaterThan(0);
    expect(response.recommendations).toContain('Excellent');
  });

  it('should create empty score response', () => {
    const response = createEmptyScoreResponse('Test prompt');

    expect(response.prompt).toBe('Test prompt');
    expect(response.overall_score).toBe(0);
    expect(response.grade).toBe('F');
    expect(response.component_scores).toBeNull();
    expect(response.recommendations.length).toBeGreaterThan(0);
  });

  it('should validate score response correctly', () => {
    const validResponse = {
      prompt: 'Test',
      overall_score: 0.75,
      grade: 'B',
      recommendations: 'Test',
      component_scores: null,
    };

    expect(validateScoreResponse(validResponse as any)).toBe(true);

    const invalidResponse = {
      prompt: 'Test',
      overall_score: 1.5, // Invalid: > 1
      grade: 'B',
      recommendations: 'Test',
      component_scores: null,
    };

    expect(validateScoreResponse(invalidResponse as any)).toBe(false);
  });

  it('should map dimensions to component scores', () => {
    const dimensions: DimensionScore[] = [
      {
        dimension: 'clarity',
        score: 0.8,
        weight: 0.15,
        maxScore: 1.0,
        minScore: 0.0,
        issues: [],
        strengths: [],
        improvementActions: [],
        weightedScore: 0.12,
        percentage: 80,
        grade: 'B+',
      },
      {
        dimension: 'relevance',
        score: 0.7,
        weight: 0.12,
        maxScore: 1.0,
        minScore: 0.0,
        issues: [],
        strengths: [],
        improvementActions: [],
        weightedScore: 0.084,
        percentage: 70,
        grade: 'B',
      },
    ];

    const scoreResult: ScoreResult = {
      id: 'score-id',
      createdAt: '2024-01-01T00:00:00Z',
      metadata: { recommendations: [] },
      promptId: 'prompt-id',
      overall: {
        score: 0.75,
        weightedAverage: 0.75,
        calculationMethod: 'weighted_average',
        confidence: 1.0,
        improvementPotential: 0.25,
        grade: 'B',
        percentage: 75,
      },
      dimensions,
      scoringVersion: '1.0.0',
      analysisTimeMs: 10,
      comparedPrompts: [],
      historicalScores: [],
      dimensionCount: 2,
      averageDimensionScore: 0.75,
    };

    const response = convertScoreToScoreResponse(scoreResult, 'Test prompt');

    expect(response.component_scores).toBeDefined();
    expect(response.component_scores?.length).toBeGreaterThan(0);
    
    // Check that component scores have required fields
    for (const cs of response.component_scores || []) {
      expect(cs.component).toBeDefined();
      expect(typeof cs.score).toBe('number');
      expect(typeof cs.weight).toBe('number');
      expect(typeof cs.weighted_score).toBe('number');
    }
  });
});
