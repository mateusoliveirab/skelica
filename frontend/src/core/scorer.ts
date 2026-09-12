/**
 * Scorer - Port of backend/app/core/scorer.py
 * Implements 8-dimension scoring for prompt quality assessment
 */

import { v4 as uuidv4 } from 'uuid';
import type { DimensionScore, OverallScore, ScoreResult } from '../types/score';
import { calculateGrade, calculateLabel } from '../types/score';

// Weight configuration matching Python backend
const WEIGHT_CONFIG = {
  clarity: 0.15,
  specificity: 0.12,
  completeness: 0.15,
  structure: 0.10,
  effectiveness: 0.12,
  actionability: 0.12,
  accuracy: 0.12,
  relevance: 0.12,
} as const;

// Anti-pattern definitions
interface AntiPattern {
  patternId: string;
  name: string;
  description: string;
  regexPattern: RegExp | null;
  /** When true, the anti-pattern fires when the pattern is NOT found */
  invertMatch?: boolean;
  severity: number;
  suggestedFix: string;
}

const ANTI_PATTERNS: AntiPattern[] = [
  {
    patternId: 'AP001',
    name: 'Vague Role Definition',
    description: 'Role is undefined or ambiguously stated',
    // Matches when role keywords ARE present; invertMatch means anti-pattern fires when NOT found
    regexPattern: /you\s+are|act\s+as|your\s+role|as\s+a/i,
    invertMatch: true,
    severity: 0.7,
    suggestedFix: "Add explicit role definition: 'You are a [specific expert role]...'",
  },
  {
    patternId: 'AP002',
    name: 'Missing Output Format',
    description: 'No clear specification of expected output format',
    regexPattern: null,
    severity: 0.5,
    suggestedFix: "Specify output format: 'Output the result as [format]...'",
  },
  {
    patternId: 'AP003',
    name: 'Contradictory Instructions',
    description: 'Instructions that conflict with each other',
    regexPattern: null,
    severity: 0.9,
    suggestedFix: 'Review and resolve conflicting instructions',
  },
  {
    patternId: 'AP004',
    name: 'Open-Ended Without Scope',
    description: 'Very broad request without boundaries or scope',
    // Trigger: broad request keywords present AND no scope-limiting keywords
    regexPattern: /\b(?:tell me everything|write about|discuss)\b/i,
    severity: 0.6,
    suggestedFix: 'Add scope limitations and specific focus areas',
  },
  {
    patternId: 'AP005',
    name: 'Missing Examples',
    description: 'Complex task without illustrative examples',
    regexPattern: null,
    severity: 0.4,
    suggestedFix: 'Add 1-2 examples demonstrating expected output',
  },
  {
    patternId: 'AP006',
    name: 'Ambiguous Quantifiers',
    description: "Vague terms like 'some', 'few', 'several' without definition",
    regexPattern: /\b(some|few|several|many|a lot)\b/i,
    severity: 0.3,
    suggestedFix: 'Replace with specific numbers or ranges',
  },
  {
    patternId: 'AP007',
    name: 'Missing Constraints',
    description: 'No explicit constraints or limitations mentioned',
    regexPattern: null,
    severity: 0.5,
    suggestedFix: "Add explicit constraints: 'Do not include...' or 'Limit to...'",
  },
];

// Static analysis result interface
export interface StaticAnalysis {
  tokenCount: {
    total: number;
    words: number;
    sentences: number;
  };
  structureElements: {
    hasSections: boolean;
    hasBulletPoints: boolean;
    hasNumberedList: boolean;
    hasCodeBlocks: boolean;
    paragraphCount: number;
  };
  formatIndicators: {
    formatsDetected: Record<string, boolean>;
    hasExplicitFormat: boolean;
    primaryFormat: string | null;
  };
  constraintIndicators: {
    negativeConstraints: string[];
    limits: string[];
    hasConstraints: boolean;
  };
  antiPatternMatches: Array<{
    patternId: string;
    name: string;
    severity: number;
    suggestedFix: string;
  }>;
  roleIndicators: {
    hasRole: boolean;
    detectedRoles: string[];
  };
  exampleIndicators: {
    hasExamples: boolean;
    exampleCount: number;
  };
}

/**
 * StaticAnalyzer - Analyzes prompt structure without LLM
 */
/** Confidence above which a detected component counts as present. */
const COMPONENT_PRESENT_THRESHOLD = 0.5;

/**
 * Which components the parser detected. Language-independent, unlike the keyword indicators
 * on `StaticAnalysis`, and therefore the right input for a score that must be fair across
 * languages.
 */
interface ComponentPresence {
  role: boolean;
  context: boolean;
  instruction: boolean;
  constraint: boolean;
  example: boolean;
  format: boolean;
  audience: boolean;
  tone: boolean;
}

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

export class StaticAnalyzer {
  analyze(prompt: string): StaticAnalysis {
    // Handle null/undefined input
    const normalizedPrompt = prompt ?? '';
    return {
      tokenCount: this._countTokens(normalizedPrompt),
      structureElements: this._detectStructure(normalizedPrompt),
      formatIndicators: this._detectFormatRequirements(normalizedPrompt),
      constraintIndicators: this._detectConstraints(normalizedPrompt),
      antiPatternMatches: this._matchAntiPatterns(normalizedPrompt),
      roleIndicators: this._detectRole(normalizedPrompt),
      exampleIndicators: this._detectExamples(normalizedPrompt),
    };
  }

  private _countTokens(prompt: string): StaticAnalysis['tokenCount'] {
    const words = prompt.split(/\s+/).filter(w => w.length > 0).length;
    const sentences = prompt.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
    
    return {
      total: Math.floor(prompt.length / 4), // Rough token estimate
      words,
      sentences,
    };
  }

  private _detectStructure(prompt: string): StaticAnalysis['structureElements'] {
    return {
      hasSections: /^#{1,3}\s+/m.test(prompt),
      hasBulletPoints: /^\s*[-*]\s+/m.test(prompt),
      hasNumberedList: /^\s*\d+\.\s+/m.test(prompt),
      hasCodeBlocks: /```[\s\S]*?```/.test(prompt),
      paragraphCount: prompt.split(/\n\n/).filter(p => p.trim().length > 0).length,
    };
  }

  private _detectFormatRequirements(prompt: string): StaticAnalysis['formatIndicators'] {
    const formatPatterns: Record<string, RegExp> = {
      json: /\b(?:json|JSON)\b/i,
      list: /\b(?:list|bullet\s*points?|enumerate)\b/i,
      table: /\b(?:table|tabular|columns?)\b/i,
      markdown: /\b(?:markdown|\.md)\b/i,
      code: /\b(?:code|function|script|program)\b/i,
    };

    const formatsDetected: Record<string, boolean> = {};
    for (const [format, pattern] of Object.entries(formatPatterns)) {
      formatsDetected[format] = pattern.test(prompt);
    }

    const hasExplicitFormat = Object.values(formatsDetected).some(v => v);
    const primaryFormat = Object.entries(formatsDetected).find(([, detected]) => detected)?.[0] || null;

    return {
      formatsDetected,
      hasExplicitFormat,
      primaryFormat,
    };
  }

  private _detectConstraints(prompt: string): StaticAnalysis['constraintIndicators'] {
    const negativePatterns = [
      /(?:do\s+not|don't|avoid|never|must\s+not)\s+\w+/gi,
      /(?:no|without)\s+\w+/gi,
    ];

    const limitPatterns = [
      /(?:limit|maximum|max)\s+(?:to\s+)?(\d+)/gi,
      /(\d+)\s+(?:words?|sentences?|paragraphs?)/gi,
    ];

    const negativeConstraints: string[] = [];
    for (const pattern of negativePatterns) {
      const matches = prompt.match(pattern);
      if (matches) negativeConstraints.push(...matches);
    }

    const limits: string[] = [];
    for (const pattern of limitPatterns) {
      const matches = prompt.match(pattern);
      if (matches) limits.push(...matches);
    }

    return {
      negativeConstraints,
      limits,
      hasConstraints: negativeConstraints.length > 0 || limits.length > 0,
    };
  }

  private _detectRole(prompt: string): StaticAnalysis['roleIndicators'] {
    const rolePatterns = [
      /(?:you\s+are|act\s+as)\s+(?:a\s+)?([^.,\n]+)/gi,
      /(?:as\s+a\s+)([^.,\n]+)/gi,
    ];

    const detectedRoles: string[] = [];
    for (const pattern of rolePatterns) {
      const matches = [...prompt.matchAll(pattern)];
      detectedRoles.push(...matches.map(m => m[1].trim()));
    }

    return {
      hasRole: detectedRoles.length > 0,
      detectedRoles,
    };
  }

  private _detectExamples(prompt: string): StaticAnalysis['exampleIndicators'] {
    const examplePatterns = [
      /(?:example|sample|e\.g\.)[:\s]/gi,
      /```[\s\S]*?```/g,
    ];

    let exampleCount = 0;
    for (const pattern of examplePatterns) {
      const matches = prompt.match(pattern);
      if (matches) exampleCount += matches.length;
    }

    return {
      hasExamples: exampleCount > 0,
      exampleCount,
    };
  }

  private _matchAntiPatterns(prompt: string): StaticAnalysis['antiPatternMatches'] {
    const matches: StaticAnalysis['antiPatternMatches'] = [];

    // Scope-limiting keywords for AP004 — checked separately to avoid lookahead backtracking
    const scopeLimiters = /\bin\s+\d+|limited\s+to|focusing\s+on/i;

    for (const ap of ANTI_PATTERNS) {
      if (!ap.regexPattern) continue;

      const found = ap.regexPattern.test(prompt);
      // invertMatch: anti-pattern fires when the pattern is NOT found
      let triggered = ap.invertMatch ? !found : found;

      // AP004 extra check: only trigger if no scope-limiting keywords are present
      if (ap.patternId === 'AP004' && triggered) {
        triggered = !scopeLimiters.test(prompt);
      }

      if (triggered) {
        matches.push({
          patternId: ap.patternId,
          name: ap.name,
          severity: ap.severity,
          suggestedFix: ap.suggestedFix,
        });
      }
    }

    return matches;
  }
}

/**
 * Scorer - Main scoring class with 8-dimension analysis
 */
export class Scorer {
  private staticAnalyzer: StaticAnalyzer;

  constructor() {
    this.staticAnalyzer = new StaticAnalyzer();
  }

  /**
   * Score a prompt across all dimensions.
   * @param detectedComponents - Optional map of component → confidence (0-1) from the semantic classifier.
   *   When provided, overrides the regex-based heuristics for the `completeness` dimension.
   */
  score(prompt: string, detectedComponents: Record<string, number> = {}): ScoreResult {
    const startTime = performance.now();
    // Handle null/undefined input
    const normalizedPrompt = prompt ?? '';
    const staticAnalysis = this.staticAnalyzer.analyze(normalizedPrompt);
    const dimensions = this._calculateDimensions(normalizedPrompt, staticAnalysis, detectedComponents);
    const overall = this._calculateOverall(dimensions);
    const recommendations = this._generateRecommendations(dimensions, staticAnalysis);
    const endTime = performance.now();

    return {
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      metadata: { recommendations },
      promptId: uuidv4(),
      overall,
      dimensions,
      scoringVersion: '1.0.0',
      analysisTimeMs: Math.round(endTime - startTime),
      comparedPrompts: [],
      historicalScores: [],
      // Computed fields
      dimensionCount: dimensions.length,
      averageDimensionScore: dimensions.length > 0 ? dimensions.reduce((sum, d) => sum + d.score, 0) / dimensions.length : 0,
      lowestDimension: dimensions.length > 0 ? dimensions.reduce((min, d) => (d.score < min.score ? d : min)) : undefined,
      highestDimension: dimensions.length > 0 ? dimensions.reduce((max, d) => (d.score > max.score ? d : max)) : undefined,
    };
  }

  private _calculateDimensions(prompt: string, staticAnalysis: StaticAnalysis, detectedComponents: Record<string, number> = {}): DimensionScore[] {
    const dimensions: DimensionScore[] = [];
    // Resolved once: every dimension reads presence from the parser's language-independent
    // detection instead of from English keyword lists.
    const presence = this._presence(detectedComponents);

    // Clarity
    const clarityScore = this._scoreClarity(staticAnalysis, presence);
    dimensions.push({
      dimension: 'clarity',
      score: clarityScore,
      weight: WEIGHT_CONFIG.clarity,
      maxScore: 1.0,
      minScore: 0.0,
      issues: this._getClarityIssues(staticAnalysis, presence),
      strengths: [],
      improvementActions: [],
      weightedScore: clarityScore * WEIGHT_CONFIG.clarity,
      percentage: clarityScore * 100,
      grade: calculateGrade(clarityScore),
    });

    // Specificity
    const specificityScore = this._scoreSpecificity(prompt, staticAnalysis, presence);
    dimensions.push({
      dimension: 'specificity',
      score: specificityScore,
      weight: WEIGHT_CONFIG.specificity,
      maxScore: 1.0,
      minScore: 0.0,
      issues: [],
      strengths: [],
      improvementActions: [],
      weightedScore: specificityScore * WEIGHT_CONFIG.specificity,
      percentage: specificityScore * 100,
      grade: calculateGrade(specificityScore),
    });

    // Completeness
    const completenessScore = this._scoreCompleteness(staticAnalysis, presence);
    dimensions.push({
      dimension: 'completeness',
      score: completenessScore,
      weight: WEIGHT_CONFIG.completeness,
      maxScore: 1.0,
      minScore: 0.0,
      issues: [],
      strengths: [],
      improvementActions: [],
      weightedScore: completenessScore * WEIGHT_CONFIG.completeness,
      percentage: completenessScore * 100,
      grade: calculateGrade(completenessScore),
    });

    // Structure
    const structureScore = this._scoreStructure(staticAnalysis);
    dimensions.push({
      dimension: 'structure',
      score: structureScore,
      weight: WEIGHT_CONFIG.structure,
      maxScore: 1.0,
      minScore: 0.0,
      issues: [],
      strengths: [],
      improvementActions: [],
      weightedScore: structureScore * WEIGHT_CONFIG.structure,
      percentage: structureScore * 100,
      grade: calculateGrade(structureScore),
    });

    // Effectiveness
    const effectivenessScore = this._scoreEffectiveness(staticAnalysis, presence);
    dimensions.push({
      dimension: 'effectiveness',
      score: effectivenessScore,
      weight: WEIGHT_CONFIG.effectiveness,
      maxScore: 1.0,
      minScore: 0.0,
      issues: [],
      strengths: [],
      improvementActions: [],
      weightedScore: effectivenessScore * WEIGHT_CONFIG.effectiveness,
      percentage: effectivenessScore * 100,
      grade: calculateGrade(effectivenessScore),
    });

    // Actionability
    const actionabilityScore = this._scoreActionability(prompt, staticAnalysis, presence);
    dimensions.push({
      dimension: 'actionability',
      score: actionabilityScore,
      weight: WEIGHT_CONFIG.actionability,
      maxScore: 1.0,
      minScore: 0.0,
      issues: [],
      strengths: [],
      improvementActions: [],
      weightedScore: actionabilityScore * WEIGHT_CONFIG.actionability,
      percentage: actionabilityScore * 100,
      grade: calculateGrade(actionabilityScore),
    });

    // Accuracy
    const accuracyScore = this._scoreAccuracy(staticAnalysis, presence);
    dimensions.push({
      dimension: 'accuracy',
      score: accuracyScore,
      weight: WEIGHT_CONFIG.accuracy,
      maxScore: 1.0,
      minScore: 0.0,
      issues: [],
      strengths: [],
      improvementActions: [],
      weightedScore: accuracyScore * WEIGHT_CONFIG.accuracy,
      percentage: accuracyScore * 100,
      grade: calculateGrade(accuracyScore),
    });

    // Relevance
    const relevanceScore = this._scoreRelevance(prompt, staticAnalysis, presence);
    dimensions.push({
      dimension: 'relevance',
      score: relevanceScore,
      weight: WEIGHT_CONFIG.relevance,
      maxScore: 1.0,
      minScore: 0.0,
      issues: [],
      strengths: [],
      improvementActions: [],
      weightedScore: relevanceScore * WEIGHT_CONFIG.relevance,
      percentage: relevanceScore * 100,
      grade: calculateGrade(relevanceScore),
    });

    return dimensions;
  }

  /**
   * Component presence derived from the parser's detection.
   *
   * The dimensions below used to infer presence from English keyword lists
   * (`roleIndicators`, `formatIndicators`, ...), which is why a Portuguese prompt scored
   * ~0.22 lower than an English prompt the dataset rates the same. Detected components are
   * the same signal in every language — see engine-invariants.test.ts — so they replace the
   * lexical proxies. `null` means the caller supplied no component map and the legacy
   * heuristics are used.
   */
  private _presence(detected: Record<string, number>): ComponentPresence | null {
    if (Object.keys(detected).length === 0) return null;

    const above = (type: string) => (detected[type] ?? 0) > COMPONENT_PRESENT_THRESHOLD;

    return {
      role: above('role'),
      context: above('context'),
      instruction: above('instruction'),
      // A prohibition ("Do not use X") constrains the output as much as a positive rule,
      // and the parser reports it as its own component type.
      constraint: above('constraint') || above('negative_constraint'),
      example: above('example'),
      format: above('format'),
      audience: above('audience'),
      tone: above('tone'),
    };
  }

  private _scoreClarity(analysis: StaticAnalysis, presence: ComponentPresence | null): number {
    const words = analysis.tokenCount.words;
    let score = 0.2;

    if (words < 5) score -= 0.15;
    else if (words >= 100) score += 0.3;
    else if (words >= 20) score += 0.25;
    else if (words >= 10) score += 0.15;

    const hasRole = presence ? presence.role : analysis.roleIndicators.hasRole;
    score += hasRole ? 0.2 : -0.1;

    if (analysis.structureElements.hasSections) score += 0.15;
    else if (analysis.tokenCount.sentences >= 5) score += 0.1;

    // Vagueness is read from the component signal instead of a word list: a prompt that sets
    // neither background nor any boundary is vague in any language.
    const hasContext = presence ? presence.context : analysis.constraintIndicators.hasConstraints;
    const hasBoundary = presence
      ? presence.constraint || presence.format
      : analysis.formatIndicators.hasExplicitFormat;
    if (!hasContext && !hasBoundary) score -= 0.1;

    return clamp01(score);
  }

  private _scoreSpecificity(prompt: string, analysis: StaticAnalysis, presence: ComponentPresence | null): number {
    const words = analysis.tokenCount.words;
    let score = 0.2;

    if (words < 5) score -= 0.15;

    const hasFormat = presence ? presence.format : analysis.formatIndicators.hasExplicitFormat;
    if (hasFormat) score += 0.25;

    const hasConstraints = presence ? presence.constraint : analysis.constraintIndicators.hasConstraints;
    if (hasConstraints) score += 0.2;

    // Concrete numbers are a language-independent specificity signal.
    const numbers = (prompt.match(/\d+/g) || []).length;
    score += Math.min(numbers * 0.05, 0.25);

    return clamp01(score);
  }

  private _scoreCompleteness(analysis: StaticAnalysis, presence: ComponentPresence | null): number {
    const words = analysis.tokenCount.words;
    let score = 0.1;

    if (words < 5) score -= 0.1;

    if (presence) {
      const weights: Array<[keyof ComponentPresence, number]> = [
        ['role', 0.2],
        ['context', 0.1],
        ['instruction', 0.2],
        ['constraint', 0.15],
        ['example', 0.15],
        ['format', 0.15],
        ['audience', 0.05],
        ['tone', 0.05],
      ];

      let componentsPresent = 0;
      for (const [type, weight] of weights) {
        if (presence[type]) {
          score += weight;
          componentsPresent++;
        }
      }

      if (componentsPresent >= 6) score += 0.1;
      else if (componentsPresent >= 4) score += 0.05;

      return clamp01(score);
    }

    // Fallback for callers that supply no component map.
    let componentsPresent = 0;

    if (analysis.roleIndicators.hasRole) {
      score += 0.2;
      componentsPresent++;
    }

    if (analysis.formatIndicators.hasExplicitFormat) {
      score += 0.15;
      componentsPresent++;
    }

    if (analysis.constraintIndicators.hasConstraints) {
      score += 0.15;
      componentsPresent++;
    }

    if (analysis.exampleIndicators.hasExamples) {
      score += 0.2;
      componentsPresent++;
    }

    if (analysis.structureElements.paragraphCount >= 2 || words >= 100) {
      score += 0.1;
    }

    if (componentsPresent >= 4) {
      score += 0.2;
    } else if (componentsPresent >= 3) {
      score += 0.1;
    }

    return clamp01(score);
  }

  private _scoreStructure(analysis: StaticAnalysis): number {
    const words = analysis.tokenCount.words;
    const sentences = analysis.tokenCount.sentences;
    let score = 0.1;

    if (words < 5) {
      score -= 0.1;
    }

    const structure = analysis.structureElements;

    if (structure.hasSections) score += 0.25;
    if (structure.hasBulletPoints) score += 0.2;
    if (structure.hasNumberedList) score += 0.2;
    if (structure.hasCodeBlocks) score += 0.15;

    if (structure.paragraphCount >= 3) {
      score += 0.2;
    } else if (structure.paragraphCount === 2) {
      score += 0.15;
    } else if (structure.paragraphCount === 1) {
      if (words >= 150 && sentences >= 8) {
        score += 0.25;
      } else if (words >= 100 && sentences >= 6) {
        score += 0.2;
      } else if (words >= 50 && sentences >= 4) {
        score += 0.15;
      } else {
        score += 0.05;
      }
    }

    return clamp01(score);
  }

  private _scoreEffectiveness(analysis: StaticAnalysis, presence: ComponentPresence | null): number {
    const words = analysis.tokenCount.words;
    let score = 0.2;

    if (words < 5) score -= 0.15;
    else if (words >= 20) score += 0.15;
    else if (words >= 10) score += 0.1;

    const has = (type: keyof ComponentPresence, fallback: boolean) =>
      presence ? presence[type] : fallback;

    if (has('role', analysis.roleIndicators.hasRole)) score += 0.2;
    if (has('format', analysis.formatIndicators.hasExplicitFormat)) score += 0.15;
    if (has('constraint', analysis.constraintIndicators.hasConstraints)) score += 0.15;
    if (has('example', analysis.exampleIndicators.hasExamples)) score += 0.15;

    if (analysis.structureElements.hasSections || analysis.structureElements.hasBulletPoints) {
      score += 0.1;
    }

    return clamp01(score);
  }

  private _scoreActionability(prompt: string, analysis: StaticAnalysis, presence: ComponentPresence | null): number {
    const words = analysis.tokenCount.words;
    let score = 0.2;

    if (words < 5) score -= 0.15;

    if (presence) {
      // A detected instruction is the language-independent evidence that the prompt asks for
      // something. The old English verb list scored Portuguese prompts as if they contained
      // no task at all.
      if (presence.instruction) score += 0.3;
    } else {
      const actionVerbs = (
        prompt.match(/\b(write|create|generate|analyze|explain|list|describe|implement|design|build)\b/gi) || []
      ).length;
      score += Math.min(actionVerbs * 0.15, 0.4);
    }

    const numbers = (prompt.match(/\d+/g) || []).length;
    score += Math.min(numbers * 0.05, 0.15);

    const hasExample = presence ? presence.example : analysis.exampleIndicators.hasExamples;
    if (hasExample) score += 0.15;

    return clamp01(score);
  }

  private _scoreAccuracy(analysis: StaticAnalysis, presence: ComponentPresence | null): number {
    const words = analysis.tokenCount.words;
    let score = 0.2;

    if (words < 5) score -= 0.1;
    else if (words >= 20) score += 0.2;
    else if (words >= 10) score += 0.1;

    const has = (type: keyof ComponentPresence, fallback: boolean) =>
      presence ? presence[type] : fallback;

    if (has('role', analysis.roleIndicators.hasRole)) score += 0.2;
    if (has('example', analysis.exampleIndicators.hasExamples)) score += 0.2;
    if (has('constraint', analysis.constraintIndicators.hasConstraints)) score += 0.15;

    return clamp01(score);
  }

  private _scoreRelevance(prompt: string, analysis: StaticAnalysis, presence: ComponentPresence | null): number {
    const words = analysis.tokenCount.words;
    let score = 0.2;

    if (words < 5) score -= 0.1;
    else if (words >= 15) score += 0.15;

    if (presence) {
      if (presence.role) score += 0.2;
      if (presence.instruction) score += 0.2;
      if (presence.context) score += 0.15;
    } else {
      if (analysis.roleIndicators.hasRole) score += 0.2;
      if (analysis.formatIndicators.hasExplicitFormat) score += 0.15;

      const domainKeywords = (
        prompt.match(/\b(api|database|server|client|user|system|data|function|class|method)\b/gi) || []
      ).length;
      score += Math.min(domainKeywords * 0.1, 0.25);
    }

    return clamp01(score);
  }

  private _getClarityIssues(analysis: StaticAnalysis, presence: ComponentPresence | null): string[] {
    const issues: string[] = [];

    const hasRole = presence ? presence.role : analysis.roleIndicators.hasRole;
    if (!hasRole) issues.push('Missing role definition');

    const hasFormat = presence ? presence.format : analysis.formatIndicators.hasExplicitFormat;
    if (!hasFormat) issues.push('No output format specified');

    const hasConstraints = presence ? presence.constraint : analysis.constraintIndicators.hasConstraints;
    if (!hasConstraints) issues.push('No constraints defined');

    return issues;
  }

  private _calculateOverall(dimensions: DimensionScore[]): OverallScore {
    const totalWeight = dimensions.reduce((sum, d) => sum + d.weight, 0);
    const weightedSum = dimensions.reduce((sum, d) => sum + d.score * d.weight, 0);
    const overallScore = totalWeight > 0 ? weightedSum / totalWeight : 0;

    // Calculate grade and label from numeric score
    const grade = calculateGrade(overallScore);
    const label = calculateLabel(overallScore);

    return {
      score: overallScore,
      weightedAverage: overallScore,
      calculationMethod: 'weighted_average',
      confidence: 1.0,
      improvementPotential: Math.max(0, 1.0 - overallScore),
      label,
      grade,
      percentage: overallScore * 100,
    };
  }

  /**
   * Generate recommendations based on low-scoring dimensions and anti-patterns
   */
  private _generateRecommendations(
    dimensions: DimensionScore[],
    staticAnalysis: StaticAnalysis
  ): string[] {
    const recommendations: string[] = [];

    // Add recommendations for low-scoring dimensions (< 0.6)
    for (const dimension of dimensions) {
      if (dimension.score < 0.6) {
        const percentage = Math.round(dimension.score * 100);
        recommendations.push(
          `Improve ${dimension.dimension}: Your prompt scored ${percentage}% on ${dimension.dimension}. ${this._getDimensionRecommendation(dimension.dimension)}`
        );
      }
    }

    // Add recommendations from anti-pattern matches
    for (const apMatch of staticAnalysis.antiPatternMatches) {
      recommendations.push(`Fix: ${apMatch.name} - ${apMatch.suggestedFix}`);
    }

    // Add specific component recommendations
    if (!staticAnalysis.roleIndicators.hasRole) {
      recommendations.push("Add a clear role definition to establish the AI's expertise and perspective");
    }

    if (!staticAnalysis.formatIndicators.hasExplicitFormat) {
      recommendations.push('Specify the desired output format (e.g., JSON, list, table, markdown)');
    }

    if (!staticAnalysis.constraintIndicators.hasConstraints) {
      recommendations.push('Add explicit constraints to guide the response boundaries');
    }

    if (!staticAnalysis.exampleIndicators.hasExamples && staticAnalysis.tokenCount.words > 20) {
      recommendations.push('Consider adding examples to clarify expected output');
    }

    return recommendations;
  }

  /**
   * Get specific recommendation for a dimension
   */
  private _getDimensionRecommendation(dimension: string): string {
    const recommendations: Record<string, string> = {
      clarity: 'Use clear, unambiguous language and define the role explicitly.',
      specificity: 'Add specific details, numbers, and constraints to make the request more precise.',
      completeness: 'Include all necessary components: role, context, instructions, constraints, and format.',
      structure: 'Organize your prompt with sections, bullet points, or numbered lists.',
      effectiveness: 'Ensure your prompt has clear goals, constraints, and examples to guide the response.',
      actionability: 'Use action verbs and provide clear, executable instructions.',
      accuracy: 'Ensure all information is correct and provide examples for validation.',
      relevance: 'Focus on domain-specific terminology and relevant context.',
    };

    return recommendations[dimension] || 'Review and improve this aspect of your prompt.';
  }
}
