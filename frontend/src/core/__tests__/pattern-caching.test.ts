/**
 * Tests for pattern pre-compilation and caching
 * Verifies that patterns are compiled once and reused across parse operations
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PatternLoader, getPatternLoader } from '../patterns';
import { AnatomyParser } from '../anatomyParser';

describe('Pattern Pre-compilation and Caching', () => {
  describe('PatternLoader', () => {
    it('should pre-compile patterns on initialization', () => {
      const consoleSpy = vi.spyOn(console, 'log');
      
      const _loader = new PatternLoader();

      // Should log pre-compilation message
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[PatternLoader] Pre-compiled')
      );
      
      consoleSpy.mockRestore();
    });

    it('should return pre-compiled patterns with global flag', () => {
      const loader = new PatternLoader();
      const patterns = loader.getPatternsForLanguage('en');
      
      // Check that all patterns have global flag
      for (const [_componentType, patternList] of Object.entries(patterns)) {
        for (const pattern of patternList) {
          expect(pattern.global).toBe(true);
        }
      }
    });

    it('should cache patterns for all supported languages', () => {
      const loader = new PatternLoader();
      
      const enPatterns = loader.getPatternsForLanguage('en');
      const ptPatterns = loader.getPatternsForLanguage('pt');
      const esPatterns = loader.getPatternsForLanguage('es');
      
      // All should return pattern objects
      expect(enPatterns).toBeDefined();
      expect(ptPatterns).toBeDefined();
      expect(esPatterns).toBeDefined();
      
      // Should have component types
      expect(Object.keys(enPatterns).length).toBeGreaterThan(0);
      expect(Object.keys(ptPatterns).length).toBeGreaterThan(0);
      expect(Object.keys(esPatterns).length).toBeGreaterThan(0);
    });

    it('should return same cached instance on repeated calls', () => {
      const loader = new PatternLoader();
      
      const patterns1 = loader.getPatternsForLanguage('en');
      const patterns2 = loader.getPatternsForLanguage('en');
      
      // Should return exact same object reference (cached)
      expect(patterns1).toBe(patterns2);
    });

    it('should return cached patterns for specific component types', () => {
      const loader = new PatternLoader();
      
      const rolePatterns1 = loader.getPatternsForComponent('en', 'role');
      const rolePatterns2 = loader.getPatternsForComponent('en', 'role');
      
      // Should return same array reference (cached)
      expect(rolePatterns1).toBe(rolePatterns2);
      
      // All patterns should have global flag
      for (const pattern of rolePatterns1) {
        expect(pattern.global).toBe(true);
      }
    });

    it('should fallback to English for unsupported languages', () => {
      const loader = new PatternLoader();
      
      const enPatterns = loader.getPatternsForLanguage('en');
      const unknownPatterns = loader.getPatternsForLanguage('fr');
      
      // Should return same cached English patterns
      expect(unknownPatterns).toBe(enPatterns);
    });
  });

  describe('AnatomyParser with cached patterns', () => {
    let parser: AnatomyParser;

    beforeEach(() => {
      parser = new AnatomyParser();
    });

    it('should use pre-compiled patterns without recompilation', () => {
      const prompt = 'You are a senior developer. Write a function that sorts numbers.';
      
      // Parse multiple times
      const result1 = parser.parse(prompt);
      const result2 = parser.parse(prompt);
      const result3 = parser.parse(prompt);
      
      // All should succeed and detect components
      expect(result1.components.length).toBeGreaterThan(0);
      expect(result2.components.length).toBeGreaterThan(0);
      expect(result3.components.length).toBeGreaterThan(0);
      
      // Should detect same components
      expect(result1.components.length).toBe(result2.components.length);
      expect(result2.components.length).toBe(result3.components.length);
    });

    it('should handle multilingual prompts with cached patterns', () => {
      const enPrompt = 'You are a developer. Write code.';
      const ptPrompt = 'Você é um desenvolvedor sênior. Escreva código em Python.';
      const esPrompt = 'Eres un desarrollador senior. Escribe código en Python.';
      
      const enResult = parser.parse(enPrompt);
      const ptResult = parser.parse(ptPrompt);
      const esResult = parser.parse(esPrompt);
      
      // All should detect components
      expect(enResult.components.length).toBeGreaterThan(0);
      expect(ptResult.components.length).toBeGreaterThan(0);
      expect(esResult.components.length).toBeGreaterThan(0);
      
      // Should detect role in all (instruction detection may vary)
      expect(enResult.components.some(c => c.componentType === 'role')).toBe(true);
      expect(ptResult.components.some(c => c.componentType === 'role')).toBe(true);
      expect(esResult.components.some(c => c.componentType === 'role')).toBe(true);
    });

    it('should maintain performance across multiple parses', () => {
      const prompt = 'You are an expert. Analyze this data. Output as JSON. Do not use external APIs.';
      
      const iterations = 100;
      const times: number[] = [];
      
      for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        parser.parse(prompt);
        const duration = performance.now() - start;
        times.push(duration);
      }
      
      // Calculate average time
      const avgTime = times.reduce((sum, t) => sum + t, 0) / times.length;
      
      // Should be fast (< 10ms average for typical prompts)
      expect(avgTime).toBeLessThan(10);
      
      // Performance should be consistent (no degradation)
      const firstHalf = times.slice(0, iterations / 2);
      const secondHalf = times.slice(iterations / 2);
      const firstAvg = firstHalf.reduce((sum, t) => sum + t, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((sum, t) => sum + t, 0) / secondHalf.length;
      
      // Second half should not be significantly slower (within 200% variance)
      expect(secondAvg).toBeLessThan(firstAvg * 3);
    });
  });

  describe('Singleton pattern loader', () => {
    it('should return same instance from getPatternLoader', () => {
      const loader1 = getPatternLoader();
      const loader2 = getPatternLoader();
      
      // Should be same instance
      expect(loader1).toBe(loader2);
    });

    it('should share cached patterns across parser instances', () => {
      const parser1 = new AnatomyParser();
      const parser2 = new AnatomyParser();
      
      const prompt = 'You are a developer.';
      
      const result1 = parser1.parse(prompt);
      const result2 = parser2.parse(prompt);
      
      // Both should detect same components
      expect(result1.components.length).toBe(result2.components.length);
    });
  });

  describe('Pattern compilation verification', () => {
    it('should not create new RegExp instances during parse', () => {
      const loader = new PatternLoader();
      const patterns = loader.getPatternsForLanguage('en');
      
      // Get reference to first role pattern
      const rolePatterns = patterns['role'];
      const firstPattern = rolePatterns[0];
      
      // Parse a prompt
      const parser = new AnatomyParser(loader);
      parser.parse('You are a developer.');
      
      // Get patterns again
      const patternsAfter = loader.getPatternsForLanguage('en');
      const rolePatternsAfter = patternsAfter['role'];
      const firstPatternAfter = rolePatternsAfter[0];
      
      // Should be exact same RegExp instance (not recreated)
      expect(firstPattern).toBe(firstPatternAfter);
    });

    it('should handle patterns with existing global flag', () => {
      const loader = new PatternLoader();
      const patterns = loader.getPatternsForLanguage('en');
      
      // All patterns should have global flag
      for (const [_componentType, patternList] of Object.entries(patterns)) {
        for (const pattern of patternList) {
          expect(pattern.global).toBe(true);
          
          // Should not have duplicate 'g' flags
          const flagCount = (pattern.flags.match(/g/g) || []).length;
          expect(flagCount).toBe(1);
        }
      }
    });
  });
});
