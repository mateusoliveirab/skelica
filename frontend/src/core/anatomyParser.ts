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
import { splitSentences, MIN_SENTENCE_LENGTH } from './segmentation';

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
 * A pattern match before overlap resolution. Matches from every language are collected into
 * one list and resolved together, so this is the shared currency between `collectMatches`
 * and `resolveOverlaps`.
 */
interface RawComponentMatch {
  componentType: PromptComponentType;
  content: string;
  start: number;
  end: number;
  priority: number;
  length: number;
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
 * Semantic-classifier confidence bands (cosine similarity against exemplar centroids).
 *
 * They overlap by construction — neutral filler can score ~0.89 against a label while true
 * positives start around 0.88 — so the two bands encode how costly each mistake is:
 * filling a gap wrongly is recoverable, contradicting a regex match is not.
 */
const SEMANTIC_FILL = 0.90;
const SEMANTIC_OVERRIDE = 0.93;

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

      // Detect language — a hint for which pattern set is authoritative, never a filter.
      const detectedLang = this.detectLanguage(promptText);

      // Extract components via Regex, filling gaps from the other languages.
      const parsedComponents = this.extractWithLanguageFallback(promptText, detectedLang);

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
   * Detect the language of the prompt so the right pattern set is used.
   *
   * A wrong guess is expensive: the parser loads one pattern set, so misreading a Portuguese
   * prompt as English (or vice versa) yields **zero components** rather than a partial result.
   *
   * Two traps this implementation avoids:
   *  1. `\b` is ASCII-only in JavaScript (`\w` is [A-Za-z0-9_]), so `/\bvocê\b/` can never
   *     match — every accented marker would be silently dead. Word lookups run against a
   *     diacritic-stripped copy; accents are counted separately on the original text.
   *  2. English-ambiguous tokens ("do", "no", "com", "email") must not count as Portuguese
   *     evidence, or ordinary English prompts classify as Portuguese. Tokens shared between
   *     Portuguese and Spanish are counted separately as "Iberian" and never decide pt vs es.
   */
  detectLanguage(text: string): string {
    if (!text || text.trim().length < 5) {
      return 'en';
    }

    const lowerText = text.toLowerCase();
    // Diacritics removed so word-boundary matching works at all (see trap 1 above).
    const ascii = lowerText.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const count = (regex: RegExp, source: string = ascii) => source.match(regex)?.length ?? 0;

    // Portuguese-only, accent-stripped, not valid English or Spanish words.
    const ptOnly =
      /\b(voce|voces|nao|tambem|funcao|funcoes|sao|estao|sera|serao|ate|escreve|escreva|escrever|escreveu|faca|faz|fazer|fez|crie|cria|criar|gere|gera|gerar|redija|sugira|sugere|analise|analisa|preciso|precisa|temos|tenho|muito|pouco|erro|processo|profissional|vaga|avaliar|funcionarios|funcionario|depois|proposta|pra|pro|pelo|pela|num|numa|amanha|dados|uma|desenvolvedor|tem|vai|foi|foram|acao|acoes|entao|padrao|opcao|opcoes|informacao|atencao|coracao|orgao)\b/g;

    // Spanish-only, accent-stripped, not valid English or Portuguese words.
    const esOnly =
      /\b(usted|ustedes|tambien|funcion|funciones|articulo|experto|escriba|escribe|escribir|haz|hacer|genere|redacte|sugiera|analice|necesito|necesitamos|tenemos|manana|vacaciones|desarrollador|mucho|poco|hasta|datos|eres|tiene|puede|puedes|debe|debes|espanol|nino|senor|senal)\b/g;

    // Shared by Portuguese and Spanish but not English words. Cannot discriminate pt vs es,
    // but does prove the text is not English.
    const iberian =
      /\b(sobre|entre|desde|numeros|numero|codigo|codigos|publico|empresa|sistema|problema|problemas|cliente|clientes|especialista|explica|explique|etapas|elabore|profesional|metodos|metodo|nativos|nativo|ordena|importante)\b/g;

    const enMarkers =
      /\b(the|you|your|yours|this|that|these|those|with|from|about|should|could|would|will|are|is|was|were|have|has|write|create|make|explain|summarize|list|analyze|do|does|not|use|using|example|tone|audience|output|format|step|steps|code|function|and|for|but|what|when|how|which)\b/g;

    // ã/õ/ç are Portuguese-exclusive among {pt, es, en}; ñ/¿/¡ are Spanish-exclusive.
    const ptChars = count(/[ãõç]/g, lowerText);
    const esChars = count(/[ñ¿¡]/g, lowerText);
    const sharedAccents = count(/[áéíóúâêôà]/g, lowerText);

    const iberianWords = count(iberian);
    const ptWords = count(ptOnly);
    const esWords = count(esOnly);
    // Accent bonuses require at least one language-specific word. Otherwise a single "ñ" or
    // "é" mentioned inside an English prompt ("...and ñ characters") would flip the language
    // and cost the entire analysis.
    const ptScore = ptWords * 2 + (ptWords > 0 ? ptChars * 2 : 0);
    const esScore = esWords * 2 + (esWords > 0 ? esChars * 2 : 0);
    // Shared accents only count as Iberian evidence once a shared word is present, so a lone
    // accented loanword ("résumé") in an English prompt cannot flip the language.
    const iberianScore = iberianWords * 2 + (iberianWords > 0 ? sharedAccents : 0);
    const enScore = count(enMarkers);

    if (ptScore > esScore) return 'pt';
    if (esScore > ptScore) return 'es';
    if (iberianScore === 0) return 'en';
    // Only shared pt/es evidence so far — English must be clearly stronger to win.
    return enScore > iberianScore ? 'en' : 'pt';
  }

  /**
   * Detect components using the patterns of *all* supported languages, with the detected
   * language only breaking ties.
   *
   * WHY: the three pattern sets are hand-maintained and have drifted apart (en 151 regexes,
   * pt 131, es 92). Loading only one of them meant a Portuguese prompt was scored with a
   * visibly poorer detector than an English one, and a language misdetection could collapse
   * the result to zero components. Both are structural, not incidental.
   *
   * An earlier attempt only filled component *types* the leading language had missed. That
   * left the outcome language-dependent in 51 of 83 validation prompts and still produced
   * zero components in a few cases, because a single match made of one language's span blocks
   * every other type from the same region. Collecting every language's matches and resolving
   * overlaps once makes the result nearly independent of which language was guessed: the
   * guess now only decides which of two competing matches wins.
   */
  private extractWithLanguageFallback(text: string, primaryLang: string): ParsedComponent[] {
    const languages = this.patternLoader.getSupportedLanguages();
    // Leading language first: for equal priority and equal start, the sort below is stable,
    // so its match is considered first and wins the overlap.
    const ordered = [primaryLang, ...languages.filter((lang) => lang !== primaryLang)];

    const allMatches: RawComponentMatch[] = [];
    let headersCollected = false;

    for (const lang of ordered) {
      const patterns = this.patternLoader.getPatternsForLanguage(lang);
      // Header sections are language-agnostic — collect them once.
      allMatches.push(...this.collectMatches(text, patterns, !headersCollected));
      headersCollected = true;
    }

    return this.resolveOverlaps(allMatches);
  }

  /**
   * Collect raw, unresolved pattern matches for the given patterns.
   * @param includeHeaders - header sections are language-agnostic and relatively expensive,
   *   so a multi-language pass collects them only once.
   */
  private collectMatches(text: string, patterns: PatternMap, includeHeaders: boolean): RawComponentMatch[] {
    // First: detect header sections (high confidence)
    const headerComponents = includeHeaders ? this.extractHeaderSections(text) : [];

    const allMatches: RawComponentMatch[] = [];

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

    // Second: find traditional pattern matches.
    //
    // Collected in two passes because expansion must not cross text another pattern already
    // claimed. Expanding "Resposta objetiva" to the end of its sentence used to swallow the
    // following "em tópicos" format match, which was then rejected as an overlap and the
    // component disappeared. A span may grow into unclaimed text, never into a neighbour.
    const rawSpans: Array<{
      componentType: string;
      matchStart: number;
      matchEnd: number;
    }> = [];

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
            const matchStart = match.index ?? 0;
            rawSpans.push({
              componentType: compType,
              matchStart,
              matchEnd: matchStart + raw.length,
            });
          }
        } catch (error) {
          if (import.meta.env.DEV) console.warn(`Regex error for ${compType} pattern:`, error);
          continue;
        }
      }
    }

    for (const { componentType: compType, matchStart, matchEnd } of rawSpans) {
      // Nearest neighbour boundaries: expansion may reach them but not pass them.
      let lowerBound = 0;
      let upperBound = text.length;
      for (const other of rawSpans) {
        if (other === undefined) continue;
        if (other.matchEnd <= matchStart && other.matchEnd > lowerBound) {
          lowerBound = other.matchEnd;
        }
        if (other.matchStart >= matchEnd && other.matchStart < upperBound) {
          upperBound = other.matchStart;
        }
      }

      let start = matchStart;
      let end = matchEnd;

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

      // Never grow into a neighbour's claimed span.
      start = Math.max(start, lowerBound);
      end = Math.min(end, upperBound);

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

    return allMatches;
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
   * Expand to the end of the current sentence, never crossing a line break.
   *
   * NOTE ON `Intl.Segmenter`: this was rewritten to use real sentence segmentation and then
   * reverted, on measurement. Segmenter answers a *global* question ("where does this sentence
   * end?"), but a span needs a *local* answer ("how far should this match reach?"). For
   * informal prompts that the segmenter reads as one long sentence, the span ballooned across
   * the whole prompt, overlapped the role span, and the component was dropped — two prompts
   * regressed. The bounding lookahead below is what keeps a span from swallowing the document,
   * so this stays intentionally local. `splitSentences()` in `core/segmentation.ts` is the
   * right place for `Intl.Segmenter`, and is what the semantic pass uses.
   */
  private expandToSentenceEnd(text: string, end: number): number {
    const lookahead = 200;
    const chunk = text.substring(end, end + lookahead);

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
   * Expand to the start of the current sentence, bounded by the previous line break.
   * See the note on `expandToSentenceEnd` for why this is a local scan.
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
  private resolveOverlaps(allMatches: RawComponentMatch[]): ParsedComponent[] {
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
   * Refine the regex-derived components with the semantic classifier.
   *
   * FASE 2 — the semantic pass is the **authority**, not an add-on. The regex still runs first
   * because it is instant and free; this runs whenever the model is available and can correct
   * it. Rules, per sentence:
   *
   *  - **Agreement** (the regex already claimed this sentence with the same type): keep the
   *    regex span — it is usually tighter — and raise its confidence to the model's score.
   *  - **Override** (`score >= SEMANTIC_OVERRIDE` and the regex claim is contained in this
   *    sentence): the model is confident and the regex claim is local, so the model's type
   *    replaces it. This is what makes the semantic detector primary.
   *  - **Fill** (`SEMANTIC_FILL <= score`): the regex found nothing here, so add it.
   *  - Otherwise: ignore. Neutral filler text scores up to ~0.89 against these labels while
   *    true positives sit at 0.88-0.96, so the bands overlap and there is no clean cut. Adding
   *    is cheap to get wrong (the regex result stands); *contradicting* is not, which is why
   *    the override bar is deliberately higher than the fill bar.
   *
   * These thresholds are empirical and belong to the score-vs-quality experiment: until the
   * score is shown to predict real quality, tightening them is guesswork.
   */
  private enhanceWithGranularAI(
    text: string,
    existing: ParsedComponent[],
    sentenceMap: Record<string, Record<string, number>>
  ): void {
    // Segmentation must match the producer of `sentenceMap` (see core/segmentation.ts and
    // usePromptAnalysis). The previous `text.split(/([.!?\n]+)/)` kept the separators as their
    // own array entries, so half the "sentences" were punctuation and every real sentence had
    // to fall back to the whole-prompt scores.
    const sentences = splitSentences(text);

    for (const { text: rawSentence, start } of sentences) {
      const sentence = rawSentence.trim();
      if (sentence.length < MIN_SENTENCE_LENGTH) continue;

      const leading = rawSentence.length - rawSentence.trimStart().length;
      const spanStart = start + leading;
      const spanEnd = spanStart + sentence.length;

      const best = this._bestComponentFor(sentenceMap, sentence);
      if (!best) continue;

      const overlapping = existing.filter(
        (c) => spanStart < c.end && c.start < spanEnd
      );

      if (overlapping.length === 0) {
        if (best.score >= SEMANTIC_FILL) {
          existing.push({
            componentType: best.type,
            content: sentence,
            start: spanStart,
            end: spanEnd,
            confidence: best.score,
          });
        }
        continue;
      }

      const agreement = overlapping.find((c) => c.componentType === best.type);
      if (agreement) {
        agreement.confidence = Math.max(agreement.confidence, best.score);
        continue;
      }

      // A regex span that reaches beyond this sentence is making a broader claim; one
      // sentence's classification is not enough evidence to overturn it.
      const contained = overlapping.filter((c) => c.start >= spanStart && c.end <= spanEnd);
      if (contained.length === 0 || best.score < SEMANTIC_OVERRIDE) continue;

      for (const claimed of contained) {
        existing.splice(existing.indexOf(claimed), 1);
      }
      existing.push({
        componentType: best.type,
        content: sentence,
        start: spanStart,
        end: spanEnd,
        confidence: best.score,
      });
    }

    existing.sort((a, b) => a.start - b.start);
  }

  /** Highest-scoring component for a sentence, or null when nothing clears the floor. */
  private _bestComponentFor(
    sentenceMap: Record<string, Record<string, number>>,
    sentence: string
  ): { type: PromptComponentType; score: number } | null {
    // `sentenceMap` is keyed by component id already (see core/worker.ts), falling back to the
    // whole-prompt scores for sentences the producer skipped.
    const scores = sentenceMap[sentence] || sentenceMap['__FULL_PROMPT__'] || {};

    let type: PromptComponentType | null = null;
    let score = 0;

    for (const [componentType, value] of Object.entries(scores)) {
      if (value > score) {
        score = value;
        type = componentType as PromptComponentType;
      }
    }

    return type && score >= SEMANTIC_FILL ? { type, score } : null;
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
