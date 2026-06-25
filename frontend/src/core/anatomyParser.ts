/**
 * AnatomyParser - Analyzes prompt text and extracts components
 * Ported from backend/app/core/anatomy_parser.py
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  AnatomyResult,
  HighlightedPhrase,
  PromptComponentType,
  HighlightType,
} from '../types/anatomy';
import { PatternLoader, getPatternLoader, type PatternMap } from './patterns';

/**
 * Internal parsed component structure
 */
interface ParsedComponent {
  componentType: PromptComponentType;
  content: string;
  start: number;
  end: number;
  confidence: number;
}

/**
 * Component priority for overlap resolution (lower = higher priority)
 */
const COMPONENT_PRIORITY: Record<string, number> = {
  role: 1,
  instruction: 2,
  context: 3,
  negative_constraint: 4,
  constraint: 5,
  example: 6,
  format: 7,
  audience: 8,
  tone: 9,
};

/**
 * Containment rules - which components can contain others
 */
const CONTAINMENT_ALLOWED: Record<string, string[]> = {
  instruction: ['format', 'constraint', 'negative_constraint', 'context', 'tone', 'audience', 'example'],
  context: ['constraint', 'negative_constraint', 'instruction', 'tone', 'audience', 'example'],
  constraint: ['instruction', 'tone', 'audience'],
  negative_constraint: ['instruction', 'tone', 'audience'],
  example: ['constraint', 'negative_constraint', 'tone', 'format'],
  format: [],
  role: ['audience', 'tone'],
  audience: [],
  tone: [],
};

/**
 * Component colors for highlighting
 */
const COMPONENT_COLORS: Record<string, string> = {
  role: '#3B82F6',        // Blue
  context: '#8B5CF6',     // Purple
  instruction: '#F97316', // Orange
  constraint: '#EF4444',  // Red
  negative_constraint: '#B91C1C', // Deep Red (Don'ts)
  example: '#22C55E',     // Green
  format: '#06B6D4',      // Cyan
  audience: '#EC4899',    // Pink
  tone: '#F59E0B',        // Amber
};

/**
 * Component tooltips for user-friendly descriptions
 */
const COMPONENT_TOOLTIPS: Record<string, string> = {
  role: 'Role Definition - Defines who the AI should act as',
  context: 'Context - Background information or scenario',
  instruction: 'Instruction - The main task or action to perform',
  constraint: 'Constraint - Rules, limitations, or requirements',
  negative_constraint: "Negative Constraint - Explicit things to avoid (Don'ts)",
  example: 'Example - Sample input/output or demonstration',
  format: 'Output Format - How the response should be structured',
  audience: 'Audience - Target audience for the response',
  tone: 'Tone - Style or voice of the response',
};

/**
 * Component type to highlight type mapping
 */
const COMPONENT_TO_HIGHLIGHT: Record<string, HighlightType> = {
  role: 'role',
  context: 'context',
  instruction: 'instruction',
  constraint: 'constraint',
  negative_constraint: 'negative_constraint',
  example: 'example',
  format: 'format',
  audience: 'audience',
  tone: 'tone',
};

/**
 * AnatomyParser class - main parser for prompt anatomy analysis
 */
export class AnatomyParser {
  private patternLoader: PatternLoader;

  constructor(patternLoader?: PatternLoader) {
    this.patternLoader = patternLoader || getPatternLoader();
  }

  /**
   * Main entry point - parse a prompt and return anatomy result
   */
  parse(promptText: string, sentenceSemanticMap?: Record<string, Record<string, number>>): AnatomyResult {
    const startTime = performance.now();

    try {
      if (!promptText || typeof promptText !== 'string') {
        return this.createEmptyResult(promptText || '');
      }

      // Detect language
      const detectedLang = this.detectLanguage(promptText);

      // Get patterns for detected language
      const patterns = this.patternLoader.getPatternsForLanguage(detectedLang);

      // Extract components via Regex
      const parsedComponents = this.extractComponents(promptText, patterns);

      // Enhance with Semantic AI if available
      if (sentenceSemanticMap) {
        this.enhanceWithGranularAI(promptText, parsedComponents, sentenceSemanticMap);
      }

      // Build highlights
      const highlighted = this.buildHighlights(parsedComponents);

      // Calculate scores
      const overallScore = this.calculateOverallScore(parsedComponents);
      const completeness = this.calculateCompleteness(parsedComponents);

      const analysisTime = performance.now() - startTime;

      return {
        id: uuidv4(),
        createdAt: new Date().toISOString(),
        metadata: { detectedLanguage: detectedLang },
        promptId: uuidv4(),
        rawText: promptText,
        anatomyVersion: '1.1.0',
        areas: [],
        components: parsedComponents.map((pc) => ({
          componentId: uuidv4(),
          componentType: pc.componentType,
          matchScore: pc.confidence,
          isExactMatch: true,
          matchedPatterns: [],
          confidence: pc.confidence,
          alternativeTypes: [],
          start: pc.start,
          end: pc.end,
        })),
        highlightedPhrases: highlighted,
        overallQualityScore: overallScore,
        completenessScore: completeness,
        analysisTimeMs: analysisTime,
        areaCount: 0,
        presentAreaCount: 0,
      };
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error parsing prompt:', error);
      return { ...this.createEmptyResult(promptText), parseError: true };
    }
  }

  /**
   * Detect language of the prompt text
   */
  private detectLanguage(text: string): string {
    if (!text || text.trim().length < 5) {
      return 'en';
    }

    const lowerText = text.toLowerCase();

    // Portuguese indicators (unique or very common in PT)
    const ptIndicators = [
      /\b(você|vocês|seu|sua|seus|suas|também|muito|fazer|escrever|escreva|faça|tente|use|exemplo|tom|estilo|público)\b/g,
      /\b(é|são|está|estão|foi|foram|será|serão|sênior|júnior|especialista|profissional|sistema|erro|problema)\b/g,
      /\b(para|com|por|sobre|entre|até|desde|desenvolvedor|função|números|artigo|código|email|e-mail|dre|lgpd)\b/g,
      /\b(não|sim|mais|menos|muito|pouco|bem|mal|pra|pro|pelo|pela|num|numa|preciso|tenho|temos|amanhã|férias|sexta-feira|tá|com|pode|que|ser|da|do|na|no)\b/g,
      /\b(cria|crie|gere|gera|redija|redija|elabore|elabora|sugira|sugere|analise|analisa|explica|explique)\b/g,
      /[ãõêéíóúç]/g, // Common Portuguese characters
    ];

    // Spanish indicators (unique or very common in ES)
    const esIndicators = [
      /\b(usted|ustedes|tú|su|sus|tambien|muy|hacer|escribir|escriba|escribe|haz|tente|use|ejemplo|tono|estilo|público)\b/g,
      /\b(es|son|está|están|fue|fueron|será|serán|senior|junior|experto|especialista|profesional|sistema|error|problema)\b/g,
      /\b(para|con|por|sobre|entre|hasta|desde|desarrollador|función|números|artículo|código|email|e-mail)\b/g,
      /\b(no|sí|más|menos|bien|mal|del|al|en|con|puede|que|ser)\b/g,
      /\b(crea|cree|genera|genere|escriba|escribe|sugiera|sugiere|analice|analiza)\b/g,
      /[ñáéíóú¿¡]/g, // Common Spanish characters
    ];

    // English indicators (unique or very common in EN)
    const enIndicators = [
      /\b(you|your|yours|also|very|make|write|do|does|try|use|example|tone|style|audience)\b/g,
      /\b(is|are|was|were|will|would|should|could|senior|junior|expert|professional)\b/g,
      /\b(the|a|an|this|that|these|those|developer|function|numbers|article|code|email|e-mail)\b/g,
      /\b(not|yes|more|less|very|well|bad|with|from|about|office)\b/g,
      /\b(create|generate|write|suggest|analyze|summarize|list)\b/g,
    ];

    const ptScore = ptIndicators.reduce((sum, regex) => sum + (lowerText.match(regex)?.length || 0), 0);
    const esScore = esIndicators.reduce((sum, regex) => sum + (lowerText.match(regex)?.length || 0), 0);
    const enScore = enIndicators.reduce((sum, regex) => sum + (lowerText.match(regex)?.length || 0), 0);

    // Bias towards Portuguese for prompts with Portuguese-only indicators
    const ptUniqueBonus = (lowerText.match(/\b(é|não|você|vocês|pelo|pela|pra|pro|uma|da|do|férias|amanhã|sexta-feira|tá|com|pode|na|no)\b/g)?.length || 0) * 5;
    const ptCharBonus = (lowerText.match(/[ãõç]/g)?.length || 0) * 3;
    const finalPtScore = ptScore + ptUniqueBonus + ptCharBonus;

    // Bias towards Spanish for Spanish-only characters or words
    const esUniqueBonus = (lowerText.match(/\b(es|no|usted|ustedes|una|del|al|mañana|puede)\b/g)?.length || 0) * 5;
    const esCharBonus = (lowerText.match(/[ñ¿¡]/g)?.length || 0) * 3;
    const finalEsScore = esScore + esUniqueBonus + esCharBonus;

    if (finalPtScore > finalEsScore && finalPtScore > enScore) {
      return 'pt';
    }
    if (finalEsScore > finalPtScore && finalEsScore > enScore) {
      return 'es';
    }
    return 'en';
  }

  /**
   * Extract components from text using regex patterns
   */
  private extractComponents(text: string, patterns: PatternMap): ParsedComponent[] {
    // First: detect header sections (high confidence)
    const headerComponents = this.extractHeaderSections(text);

    const allMatches: Array<{
      componentType: PromptComponentType;
      content: string;
      start: number;
      end: number;
      priority: number;
      length: number;
    }> = [];

    // Add header matches with high priority
    for (const hc of headerComponents) {
      allMatches.push({
        componentType: hc.componentType,
        content: hc.content,
        start: hc.start,
        end: hc.end,
        priority: 1,
        length: hc.end - hc.start,
      });
    }

    // Second: find traditional pattern matches
    for (const [compType, patternList] of Object.entries(patterns)) {
      for (const pattern of patternList) {
        try {
          // Use pre-compiled pattern directly (already has global flag)
          const matches = text.matchAll(pattern);
          
          for (const match of matches) {
            const raw = match[0];
            if (!raw || raw.trim().length < 3) {
              continue;
            }

            let start = match.index ?? 0;
            let end = start + raw.length;

            // Expand to sentence end (but be careful with role)
            if (compType !== 'role') {
              end = this.expandToSentenceEnd(text, end);
            } else {
              // For role, only expand to next comma or sentence end
              const nextComma = text.indexOf(',', end);
              const nextSentence = this.expandToSentenceEnd(text, end);
              if (nextComma !== -1 && nextComma < nextSentence && nextComma < end + 40) {
                end = nextComma;
              } else {
                end = nextSentence;
              }
            }

            // For constraints, expand to sentence start
            if (compType === 'constraint' || compType === 'negative_constraint') {
              start = this.expandToSentenceStart(text, start);
            }

            // For role, expand to include additional phrases
            if (compType === 'role') {
              end = this.expandRoleContent(text, start, end);
            }

            const content = text.substring(start, end).trim();
            if (!content || content.length < 3) {
              continue;
            }

            // Adjust start/end to match trimmed content
            const trimmedStart = start + (text.substring(start, end).length - text.substring(start, end).trimStart().length);
            const trimmedEnd = trimmedStart + content.length;

            const priority = COMPONENT_PRIORITY[compType] || 99;
            allMatches.push({
              componentType: compType as PromptComponentType,
              content,
              start: trimmedStart,
              end: trimmedEnd,
              priority,
              length: trimmedEnd - trimmedStart,
            });
          }
        } catch (error) {
          if (import.meta.env.DEV) console.warn(`Regex error for ${compType} pattern:`, error);
          continue;
        }
      }
    }

    // Sort by priority, then start position
    allMatches.sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      return a.start - b.start;
    });

    return this.resolveOverlaps(allMatches);
  }

  /**
   * Extract header sections (markdown-style headers)
   */
  private extractHeaderSections(text: string): ParsedComponent[] {
    const components: ParsedComponent[] = [];

    const headerPatterns: Record<string, PromptComponentType> = {
      '^##+\\s*(?:role|persona|who\\s+are\\s+you)\\b': 'role',
      '^##+\\s*(?:context|background|scenario|contextual\\s+information)\\b': 'context',
      '^##+\\s*(?:task|your\\s+task|objective|goal|instruction|request)\\b': 'instruction',
      '^##+\\s*(?:constraints?|requirements?|rules?|limitations?|guidelines)\\b': 'constraint',
      '^##+\\s*(?:negative\\s+constraints?|donts|what\\s+to\\s+avoid|avoid)\\b': 'negative_constraint',
      '^##+\\s*(?:examples?|sample|demonstration)\\b': 'example',
      '^##+\\s*(?:output\\s+format|format|response\\s+format|response\\s+structure|structure)\\b': 'format',
      '^##+\\s*(?:target\\s+)?audience\\b': 'audience',
      '^##+\\s*(?:tone|style|voice)\\b': 'tone',
    };

    for (const [pattern, compType] of Object.entries(headerPatterns)) {
      const regex = new RegExp(pattern, 'gmi');
      const matches = text.matchAll(regex);

      for (const match of matches) {
        const start = match.index ?? 0;
        const headerEnd = start + match[0].length;

        // Find end of section (next header or end of text)
        const sectionMatch = text.substring(headerEnd).match(/\n##+\s+\w/);
        let sectionEnd: number;
        if (sectionMatch && sectionMatch.index !== undefined) {
          sectionEnd = headerEnd + sectionMatch.index;
        } else {
          sectionEnd = Math.min(headerEnd + 1500, text.length);
        }

        // For role, expand to include additional phrases
        if (compType === 'role') {
          sectionEnd = this.expandRoleContent(text, start, sectionEnd);
        }

        const content = text.substring(start, sectionEnd).trim();

        // Adjust start/end to match trimmed content
        const trimmedStart = start + (text.substring(start, sectionEnd).length - text.substring(start, sectionEnd).trimStart().length);
        const trimmedEnd = trimmedStart + content.length;

        components.push({
          componentType: compType,
          content,
          start: trimmedStart,
          end: trimmedEnd,
          confidence: 0.95,
        });
      }
    }

    return components;
  }

  /**
   * Expand role content to include additional phrases
   */
  private expandRoleContent(text: string, start: number, initialEnd: number): number {
    const patternsToExpand = [
      /\nYou\s+have/i,
      /\nYou\s+specialize/i,
      /\nWith\s+\d+/i,
      /\n(?:I|we)\s+specialize/i,
      /\nYour\s+background/i,
      /\nYour\s+experience/i,
    ];

    for (const pattern of patternsToExpand) {
      const match = text.substring(initialEnd).match(pattern);
      if (match && match.index !== undefined) {
        if (match.index <= 1) {
          const searchStart = initialEnd + match.index;
          const chunk = text.substring(searchStart, searchStart + 300);
          for (let i = 0; i < chunk.length; i++) {
            if ('.!?'.includes(chunk[i])) {
              return searchStart + i + 1;
            }
          }
          return Math.min(searchStart + 300, text.length);
        } else {
          const newEnd = initialEnd + match.index;
          if (newEnd > start + 10) {
            return this.expandToSentenceEnd(text, newEnd);
          }
        }
      }
    }

    return initialEnd;
  }

  /**
   * Expand to the end of the current sentence
   */
  private expandToSentenceEnd(text: string, end: number): number {
    const maxLookahead = 200;
    const chunk = text.substring(end, end + maxLookahead);
    
    for (let i = 0; i < chunk.length; i++) {
      if ('.!?'.includes(chunk[i])) {
        return end + i + 1;
      }
      if (chunk[i] === '\n') {
        return end + i;
      }
    }
    
    return end;
  }

  /**
   * Expand to the start of the current sentence
   */
  private expandToSentenceStart(text: string, start: number): number {
    for (let i = start - 1; i >= 0; i--) {
      if ('.!?\n'.includes(text[i])) {
        let newStart = i + 1;
        while (newStart < start && /\s/.test(text[newStart])) {
          newStart++;
        }
        return newStart;
      }
    }
    
    let newStart = 0;
    while (newStart < start && /\s/.test(text[newStart])) {
      newStart++;
    }
    return newStart;
  }

  /**
   * Create an empty result for error cases
   */
  private createEmptyResult(promptText: string): AnatomyResult {
    return {
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      metadata: { detectedLanguage: 'en' },
      promptId: uuidv4(),
      rawText: promptText,
      anatomyVersion: '1.1.0',
      areas: [],
      components: [],
      highlightedPhrases: [],
      overallQualityScore: 0,
      completenessScore: 0,
      analysisTimeMs: 0,
      areaCount: 0,
      presentAreaCount: 0,
    };
  }

  /**
   * Resolve overlapping components based on priority and containment rules
   */
  private resolveOverlaps(
    allMatches: Array<{
      componentType: PromptComponentType;
      content: string;
      start: number;
      end: number;
      priority: number;
      length: number;
    }>
  ): ParsedComponent[] {
    // Sort by: priority (lower = better), start position, then prefer smaller matches (more specific)
    allMatches.sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      if (a.start !== b.start) return a.start - b.start;
      return a.length - b.length; // Prefer smaller, more specific matches
    });

    const components: ParsedComponent[] = [];
    const accepted: Array<{
      componentType: PromptComponentType;
      start: number;
      end: number;
    }> = [];

    for (const match of allMatches) {
      let isOverlapping = false;

      // First check overlap with SAME type - never allow
      for (const existing of accepted) {
        if (existing.componentType === match.componentType) {
          // Check if they overlap
          if (!(match.start >= existing.end || match.end <= existing.start)) {
            isOverlapping = true;
            break;
          }
        }
      }

      if (isOverlapping) {
        continue;
      }

      // Then check overlap with OTHER types
      for (const existing of accepted) {
        if (existing.componentType !== match.componentType) {
          // Check if they overlap
          if (!(match.start >= existing.end || match.end <= existing.start)) {
            // Check if the EXISTING component can contain the NEW component
            const allowed = CONTAINMENT_ALLOWED[existing.componentType] || [];
            if (!allowed.includes(match.componentType)) {
              isOverlapping = true;
            }
            break;
          }
        }
      }

      if (!isOverlapping) {
        components.push({
          componentType: match.componentType,
          content: match.content,
          start: match.start,
          end: match.end,
          confidence: 0.9,
        });
        accepted.push({
          componentType: match.componentType,
          start: match.start,
          end: match.end,
        });
      }
    }

    // Sort by start position for final output
    return components.sort((a, b) => a.start - b.start);
  }

  /**
   * Build highlighted phrases from detected components
   */
  private buildHighlights(components: ParsedComponent[]): HighlightedPhrase[] {
    const highlights: HighlightedPhrase[] = [];

    for (const comp of components) {
      try {
        const highlightType = COMPONENT_TO_HIGHLIGHT[comp.componentType] || 'instruction';
        const color = COMPONENT_COLORS[comp.componentType] || '#6B7280';
        const tooltip = COMPONENT_TOOLTIPS[comp.componentType] || comp.componentType;

        highlights.push({
          phraseId: uuidv4(),
          text: comp.content,
          highlightType,
          highlightColor: color,
          tooltip,
          priority: COMPONENT_PRIORITY[comp.componentType] || 99,
        });
      } catch (error) {
        if (import.meta.env.DEV) console.warn('Error building highlight:', error);
        continue;
      }
    }

    return highlights;
  }

  /**
   * Calculate overall quality score based on component coverage and quality
   */
  private calculateOverallScore(components: ParsedComponent[]): number {
    if (!components || components.length === 0) {
      return 0.0;
    }

    // Weighted expectations for essential components
    const weightedExpected: Record<string, number> = {
      instruction: 0.25,
      context: 0.15,
      role: 0.15,
      negative_constraint: 0.15, // NEW WEIGHT
      constraint: 0.10,
      format: 0.10,
      example: 0.10,
    };

    // Calculate coverage score based on found components
    const foundTypes = new Set(components.map((c) => c.componentType));
    let coverageScore = 0;
    for (const [compType, weight] of Object.entries(weightedExpected)) {
      if (foundTypes.has(compType as PromptComponentType)) {
        coverageScore += weight;
      }
    }

    // Bonus for optional but valuable components
    const bonusTypes = new Set(['audience', 'tone']);
    const bonusCount = Array.from(foundTypes).filter((t) => bonusTypes.has(t)).length;
    const bonus = Math.min(0.05, bonusCount * 0.03);

    // Average quality of detected components
    const qualityAvg = components.reduce((sum, c) => sum + c.confidence, 0) / components.length;

    // Final score: 70% coverage + 20% quality + 10% bonus
    return Math.min(1.0, coverageScore * 0.75 + qualityAvg * 0.20 + bonus);
  }

  /**
   * Calculate completeness score
   */
  private calculateCompleteness(components: ParsedComponent[]): number {
    const essential = new Set(['instruction']);
    const important = new Set(['role', 'context', 'format', 'constraint', 'negative_constraint']);
    const optional = new Set(['example', 'audience', 'tone']);

    const found = new Set(components.map((c) => c.componentType));

    const essentialScore = Array.from(essential).filter((t) => found.has(t as PromptComponentType)).length / Math.max(essential.size, 1);
    const importantScore = Array.from(important).filter((t) => found.has(t as PromptComponentType)).length / Math.max(important.size, 1);
    const optionalScore = Array.from(optional).filter((t) => found.has(t as PromptComponentType)).length / Math.max(optional.size, 1);

    return essentialScore * 0.40 + importantScore * 0.40 + optionalScore * 0.20;
  }

  /**
   * Use granular sentence map to fill gaps and resolve ambiguities
   */
  private enhanceWithGranularAI(
    text: string,
    existing: ParsedComponent[],
    sentenceMap: Record<string, Record<string, number>>
  ): void {
    const sentences = text.split(/([.!?\n]+)/);
    let currentPos = 0;

    for (let i = 0; i < sentences.length; i++) {
      const rawSentence = sentences[i];
      if (!rawSentence) continue;

      const start = currentPos;
      const end = currentPos + rawSentence.length;
      currentPos = end;

      const sentence = rawSentence.trim();
      if (sentence.length < 5) continue;

      // Check coverage
      const isCovered = existing.some(comp => 
        (start >= comp.start && start < comp.end) || 
        (end > comp.start && end <= comp.end)
      );

      if (!isCovered) {
        // Find best match in semantic scores for THIS specific sentence
        const scores = sentenceMap[sentence] || sentenceMap['__FULL_PROMPT__'] || {};
        
        const semanticToComponentMap: Record<string, PromptComponentType> = {
          'instruction': 'instruction',
          'context': 'context',
          'role': 'role',
          'constraint or rule': 'constraint', // Map from semantic labels
          'negative constraint': 'negative_constraint',
          'example': 'example',
          'output_format': 'format',
          'target audience': 'audience',
          'tone or style': 'tone'
        };

        let bestType: PromptComponentType | null = null;
        let bestScore = 0.60;

        for (const [semLabel, score] of Object.entries(scores)) {
          const compType = semanticToComponentMap[semLabel];
          if (compType && score > bestScore) {
            bestScore = score;
            bestType = compType;
          }
        }

        if (bestType) {
          existing.push({
            componentType: bestType,
            content: sentence,
            start: start + (rawSentence.length - rawSentence.trimStart().length),
            end: start + (rawSentence.length - rawSentence.trimStart().length) + sentence.length,
            confidence: bestScore,
          });
        }
      }
    }
    existing.sort((a, b) => a.start - b.start);
  }
}

/**
 * Create a singleton instance
 */
let parserInstance: AnatomyParser | null = null;

export function getAnatomyParser(): AnatomyParser {
  if (!parserInstance) {
    parserInstance = new AnatomyParser();
  }
  return parserInstance;
}
