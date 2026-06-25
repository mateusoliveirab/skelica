/**
 * Tests for AnatomyAdapter
 */

import { describe, it, expect } from 'vitest';
import { convertAnatomyToAnalyzeResponse, extractComponentContent } from '../anatomyAdapter';
import type { AnatomyResult } from '../../types/anatomy';

describe('AnatomyAdapter', () => {
  it('should convert AnatomyResult to AnalyzeResponse format', () => {
    const anatomyResult: AnatomyResult = {
      id: 'test-id',
      createdAt: '2024-01-01T00:00:00Z',
      metadata: { detectedLanguage: 'en' },
      promptId: 'prompt-id',
      rawText: 'You are a senior developer. Write a function.',
      anatomyVersion: '1.0.0',
      areas: [],
      components: [
        {
          componentId: 'comp-1',
          componentType: 'role',
          matchScore: 0.9,
          isExactMatch: true,
          matchedPatterns: [],
          confidence: 0.9,
          alternativeTypes: [],
          start: 0,
          end: 27,
        },
        {
          componentId: 'comp-2',
          componentType: 'instruction',
          matchScore: 0.8,
          isExactMatch: true,
          matchedPatterns: [],
          confidence: 0.8,
          alternativeTypes: [],
          start: 28,
          end: 46,
        },
      ],
      highlightedPhrases: [],
      overallQualityScore: 0.75,
      completenessScore: 0.65,
      analysisTimeMs: 10,
      areaCount: 0,
      presentAreaCount: 0,
    };

    const response = convertAnatomyToAnalyzeResponse(anatomyResult);

    expect(response.prompt).toBe('You are a senior developer. Write a function.');
    expect(response.overall_score).toBe(0.75);
    expect(response.components).toHaveLength(9); // All component types
    expect(response.created_at).toBe('2024-01-01T00:00:00Z');

    // Check that role component is present
    const roleComponent = response.components.find(c => c.component === 'role');
    expect(roleComponent).toBeDefined();
    expect(roleComponent?.presence.present).toBe(true);
    expect(roleComponent?.presence.content).toBe('You are a senior developer.');

    // Check that instruction component is present
    const instructionComponent = response.components.find(c => c.component === 'instruction');
    expect(instructionComponent).toBeDefined();
    expect(instructionComponent?.presence.present).toBe(true);
    expect(instructionComponent?.presence.content).toBe('Write a function.');

    // Check that missing components have suggestions
    const contextComponent = response.components.find(c => c.component === 'context');
    expect(contextComponent).toBeDefined();
    expect(contextComponent?.presence.present).toBe(false);
    expect(contextComponent?.presence.suggestions).toBeDefined();
    expect(contextComponent?.presence.suggestions?.length).toBeGreaterThan(0);
  });

  it('should handle empty anatomy result', () => {
    const anatomyResult: AnatomyResult = {
      id: 'test-id',
      createdAt: '2024-01-01T00:00:00Z',
      metadata: { detectedLanguage: 'en' },
      promptId: 'prompt-id',
      rawText: '',
      anatomyVersion: '1.0.0',
      areas: [],
      components: [],
      highlightedPhrases: [],
      overallQualityScore: 0,
      completenessScore: 0,
      analysisTimeMs: 0,
      areaCount: 0,
      presentAreaCount: 0,
    };

    const response = convertAnatomyToAnalyzeResponse(anatomyResult);

    expect(response.prompt).toBe('');
    expect(response.overall_score).toBe(0);
    expect(response.components).toHaveLength(9);
    
    // All components should be absent
    for (const component of response.components) {
      expect(component.presence.present).toBe(false);
      expect(component.presence.content).toBeNull();
    }
  });

  it('should map component types correctly', () => {
    const anatomyResult: AnatomyResult = {
      id: 'test-id',
      createdAt: '2024-01-01T00:00:00Z',
      metadata: { detectedLanguage: 'en' },
      promptId: 'prompt-id',
      rawText: 'Test prompt with format specification',
      anatomyVersion: '1.0.0',
      areas: [],
      components: [
        {
          componentId: 'comp-1',
          componentType: 'format', // Should map to 'output_format'
          matchScore: 0.8,
          isExactMatch: true,
          matchedPatterns: [],
          confidence: 0.8,
          alternativeTypes: [],
          start: 0,
          end: 38,
        },
      ],
      highlightedPhrases: [],
      overallQualityScore: 0.5,
      completenessScore: 0.4,
      analysisTimeMs: 5,
      areaCount: 0,
      presentAreaCount: 0,
    };

    const response = convertAnatomyToAnalyzeResponse(anatomyResult);

    const formatComponent = response.components.find(c => c.component === 'output_format');
    expect(formatComponent).toBeDefined();
    expect(formatComponent?.presence.present).toBe(true);
  });

  it('should extract component content correctly', () => {
    const anatomyResult: AnatomyResult = {
      id: 'test-id',
      createdAt: '2024-01-01T00:00:00Z',
      metadata: { detectedLanguage: 'en' },
      promptId: 'prompt-id',
      rawText: 'You are a developer. Write code.',
      anatomyVersion: '1.0.0',
      areas: [],
      components: [
        {
          componentId: 'comp-1',
          componentType: 'role',
          matchScore: 0.9,
          isExactMatch: true,
          matchedPatterns: [],
          confidence: 0.9,
          alternativeTypes: [],
          start: 0,
          end: 20, // Include the period
        },
      ],
      highlightedPhrases: [],
      overallQualityScore: 0.6,
      completenessScore: 0.5,
      analysisTimeMs: 5,
      areaCount: 0,
      presentAreaCount: 0,
    };

    const content = extractComponentContent('You are a developer. Write code.', 'role', anatomyResult);
    expect(content).toBe('You are a developer.');
  });

  it('should return null for missing component content', () => {
    const anatomyResult: AnatomyResult = {
      id: 'test-id',
      createdAt: '2024-01-01T00:00:00Z',
      metadata: { detectedLanguage: 'en' },
      promptId: 'prompt-id',
      rawText: 'Test prompt',
      anatomyVersion: '1.0.0',
      areas: [],
      components: [],
      highlightedPhrases: [],
      overallQualityScore: 0,
      completenessScore: 0,
      analysisTimeMs: 0,
      areaCount: 0,
      presentAreaCount: 0,
    };

    const content = extractComponentContent('Test prompt', 'role', anatomyResult);
    expect(content).toBeNull();
  });
});
