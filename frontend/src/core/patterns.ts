/**
 * PatternLoader - Manages multilingual regex patterns for prompt anatomy detection
 * Converted from backend/app/core/pattern_loader.py
 */

import { englishPatterns } from './patterns/english';
import { portuguesePatterns } from './patterns/portuguese';
import { spanishPatterns } from './patterns/spanish';

export type PromptComponentType =
  | 'role'
  | 'context'
  | 'instruction'
  | 'constraint'
  | 'example'
  | 'format'
  | 'audience'
  | 'tone';

export type Language = 'en' | 'pt' | 'es';

export interface PatternMap {
  [key: string]: RegExp[];
}

export interface LanguagePatterns {
  [language: string]: {
    [componentType: string]: RegExp[];
  };
}

/**
 * Compiled pattern cache entry
 */
interface CompiledPatternCache {
  [language: string]: {
    [componentType: string]: RegExp[];
  };
}

/**
 * PatternLoader class manages loading and accessing multilingual patterns
 * Implements pre-compilation and caching for optimal performance
 */
export class PatternLoader {
  private patterns: LanguagePatterns;
  private compiledCache: CompiledPatternCache;
  private readonly fallbackLanguage: Language = 'en';
  private readonly supportedLanguages: Language[] = ['en', 'pt', 'es'];

  constructor() {
    this.patterns = this.loadPatterns();
    this.compiledCache = {};
    this.preCompileAllPatterns();
  }

  /**
   * Load all patterns from language-specific modules
   */
  private loadPatterns(): LanguagePatterns {
    return {
      en: englishPatterns,
      pt: portuguesePatterns,
      es: spanishPatterns,
    };
  }

  /**
   * Pre-compile all regex patterns with global flag for matchAll
   * This ensures patterns are compiled once during initialization
   * and cached for reuse across all parse operations
   */
  private preCompileAllPatterns(): void {
    const startTime = performance.now();
    let totalPatterns = 0;

    for (const [language, componentPatterns] of Object.entries(this.patterns)) {
      this.compiledCache[language] = {};

      for (const [componentType, patternList] of Object.entries(componentPatterns)) {
        this.compiledCache[language][componentType] = patternList.map((pattern) => {
          // Ensure pattern has global flag for matchAll
          if (pattern.global) {
            return pattern;
          }
          // Create new RegExp with global flag added
          return new RegExp(pattern.source, pattern.flags + 'g');
        });
        totalPatterns += patternList.length;
      }
    }

    const duration = performance.now() - startTime;
    if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) console.log(
      `[PatternLoader] Pre-compiled ${totalPatterns} patterns across ${this.supportedLanguages.length} languages in ${duration.toFixed(2)}ms`
    );
  }

  /**
   * Get pre-compiled patterns for a specific language
   * Falls back to English if language is not supported
   * Returns cached compiled patterns for optimal performance
   */
  getPatternsForLanguage(language: string): PatternMap {
    const normalizedLang = language.toLowerCase().substring(0, 2) as Language;
    
    if (this.compiledCache[normalizedLang]) {
      return this.compiledCache[normalizedLang] as PatternMap;
    }
    
    return this.compiledCache[this.fallbackLanguage] as PatternMap;
  }

  /**
   * Get pre-compiled patterns for a specific component type in a specific language
   * Returns cached compiled patterns for optimal performance
   */
  getPatternsForComponent(
    language: string,
    componentType: PromptComponentType
  ): RegExp[] {
    const languagePatterns = this.getPatternsForLanguage(language);
    return languagePatterns[componentType] || [];
  }

  /**
   * Get all supported languages
   */
  getSupportedLanguages(): Language[] {
    return this.supportedLanguages;
  }

  /**
   * Check if a language is supported
   */
  isLanguageSupported(language: string): boolean {
    const normalizedLang = language.toLowerCase().substring(0, 2);
    return this.supportedLanguages.includes(normalizedLang as Language);
  }

  /**
   * Get the fallback language
   */
  getFallbackLanguage(): Language {
    return this.fallbackLanguage;
  }

  /**
   * Get all component types
   */
  getComponentTypes(): PromptComponentType[] {
    return [
      'role',
      'context',
      'instruction',
      'constraint',
      'example',
      'format',
      'audience',
      'tone',
    ];
  }
}

/**
 * Singleton instance for global access
 */
let patternLoaderInstance: PatternLoader | null = null;

/**
 * Get the singleton PatternLoader instance
 */
export function getPatternLoader(): PatternLoader {
  if (!patternLoaderInstance) {
    patternLoaderInstance = new PatternLoader();
  }
  return patternLoaderInstance;
}

/**
 * Get default patterns (English)
 */
export function getDefaultPatterns(): PatternMap {
  return getPatternLoader().getPatternsForLanguage('en');
}
