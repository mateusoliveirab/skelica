// @vitest-environment jsdom
/**
 * Tests for usePromptAnalysis hook
 * Verifies that the hook correctly uses local AnatomyParser and Scorer
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { usePromptAnalysis } from '../usePromptAnalysis';

// Mock semantic classifier to avoid real model execution in tests
vi.mock('../../core/semanticClassifier', () => ({
  classifyComponents: vi.fn().mockResolvedValue({
    role: 0.8,
    instruction: 0.9,
    context: 0.7,
  }),
  setModelProgressCallback: vi.fn(),
  preloadModel: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../api', () => ({
  api: {
    analyze: vi.fn().mockImplementation(async (prompt: string, _signal?: AbortSignal) => ({
      prompt,
      components: [
        {
          component: 'role',
          presence: { present: true, content: prompt, quality_score: 0.8 },
          importance: 0.9,
          description: 'Role definition',
        },
      ],
      overall_score: 0.75,
      summary: 'Good prompt structure',
      created_at: new Date().toISOString(),
    })),
    score: vi.fn().mockImplementation(async (prompt: string, _detailed?: boolean, _signal?: AbortSignal) => ({
      prompt,
      overall_score: 0.75,
      component_scores: null,
      grade: 'B',
      recommendations: ['Add more context'],
    })),
  },
}));

describe('usePromptAnalysis', () => {
  beforeEach(() => {
    // Reset any state between tests
  });

  it('should initialize with null analysis and score', () => {
    const { result } = renderHook(() => usePromptAnalysis());

    expect(result.current.analysis).toBeNull();
    expect(result.current.score).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should analyze a simple prompt', async () => {
    const { result } = renderHook(() => usePromptAnalysis());

    const testPrompt = 'You are a senior developer. Write a function to sort numbers.';

    // Call analyze
    await act(async () => {
      await result.current.analyze(testPrompt);
    });

    // Verify analysis result
    expect(result.current.analysis).not.toBeNull();
    expect(result.current.analysis?.prompt).toBe(testPrompt);
    expect(result.current.analysis?.components).toBeDefined();
    expect(Array.isArray(result.current.analysis?.components)).toBe(true);

    // Verify score result
    expect(result.current.score).not.toBeNull();
    expect(result.current.score?.prompt).toBe(testPrompt);
    expect(result.current.score?.overall_score).toBeGreaterThanOrEqual(0);
    expect(result.current.score?.overall_score).toBeLessThanOrEqual(1);
    expect(result.current.score?.grade).toBeDefined();
  });

  it('should detect role component', async () => {
    const { result } = renderHook(() => usePromptAnalysis());

    const testPrompt = 'You are a senior Python developer with 10 years of experience.';

    await act(async () => {
      await result.current.analyze(testPrompt);
    });

    // Check that role component was detected
    const roleComponent = result.current.analysis?.components.find(
      (c) => c.component === 'role'
    );

    expect(roleComponent).toBeDefined();
    expect(roleComponent?.presence.present).toBe(true);
  });

  it('should handle empty prompt', async () => {
    const { result } = renderHook(() => usePromptAnalysis());

    result.current.analyze('');

    // Should not trigger analysis for empty prompt
    expect(result.current.analysis).toBeNull();
    expect(result.current.score).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('should handle whitespace-only prompt', async () => {
    const { result } = renderHook(() => usePromptAnalysis());

    result.current.analyze('   \n  \t  ');

    // Should not trigger analysis for whitespace-only prompt
    expect(result.current.analysis).toBeNull();
    expect(result.current.score).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('should maintain same interface as before', async () => {
    const { result } = renderHook(() => usePromptAnalysis());

    // Verify the hook returns the expected interface
    expect(result.current).toHaveProperty('analysis');
    expect(result.current).toHaveProperty('score');
    expect(result.current).toHaveProperty('loading');
    expect(result.current).toHaveProperty('error');
    expect(result.current).toHaveProperty('analyze');
    expect(typeof result.current.analyze).toBe('function');
  });

  it('should return AnalyzeResponse format', async () => {
    const { result } = renderHook(() => usePromptAnalysis());

    const testPrompt = 'You are an expert. Write code.';

    await act(async () => {
      await result.current.analyze(testPrompt);
    });

    // Verify AnalyzeResponse structure
    expect(result.current.analysis).toMatchObject({
      prompt: expect.any(String),
      components: expect.any(Array),
      overall_score: expect.any(Number),
      summary: expect.any(String),
    });

    // Verify each component has the expected structure
    if (result.current.analysis?.components.length) {
      const component = result.current.analysis.components[0];
      expect(component).toMatchObject({
        component: expect.any(String),
        presence: expect.objectContaining({
          present: expect.any(Boolean),
          quality_score: expect.any(Number),
        }),
        importance: expect.any(Number),
        description: expect.any(String),
      });
    }
  });

  it('should return ScoreResponse format', async () => {
    const { result } = renderHook(() => usePromptAnalysis());

    const testPrompt = 'You are an expert. Write code.';

    await act(async () => {
      await result.current.analyze(testPrompt);
    });

    // Verify ScoreResponse structure
    expect(result.current.score).toMatchObject({
      prompt: expect.any(String),
      overall_score: expect.any(Number),
      grade: expect.any(String),
      recommendations: expect.any(String),
    });
  });
});
