import { useState, useCallback, useRef, useEffect } from 'react';
import { getAnatomyParser } from '../core/anatomyParser';
import { Scorer } from '../core/scorer';
import { classifyComponents, setModelProgressCallback } from '../core/semanticClassifier';
import { convertAnatomyToAnalyzeResponse } from '../adapters/anatomyAdapter';
import { convertScoreToScoreResponse } from '../adapters/scoreAdapter';
import type { AnalyzeResponse, ScoreResponse } from '../api/types';

const scorer = new Scorer();

export function usePromptAnalysis() {
  const [analysis, setAnalysis] = useState<AnalyzeResponse | null>(null);
  const [score, setScore] = useState<ScoreResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modelReady, setModelReady] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  
  // Track last analyzed prompt to avoid redundant heavy tasks
  const lastAnalyzedPrompt = useRef<string>('');

  useEffect(() => {
    setModelProgressCallback((p) => {
      setDownloadProgress(p);
      if (p >= 100) setModelReady(true);
    });
  }, []);

  const analyze = useCallback(async (prompt: string) => {
    const trimmedPrompt = prompt.trim();
    
    if (!trimmedPrompt) {
      setAnalysis(null);
      setScore(null);
      lastAnalyzedPrompt.current = '';
      return;
    }

    // Skip if prompt is identical to last analysis
    if (trimmedPrompt === lastAnalyzedPrompt.current && analysis) {
      return;
    }

    setLoading(true);
    setAnalysis(null);
    setScore(null);
    setError(null);

    // Yield to browser to ensure loading state is rendered
    await new Promise(resolve => setTimeout(resolve, 50));

    try {
      let semanticMap: Record<string, Record<string, number>> = {};
      try {
        const parser = getAnatomyParser();
        // @ts-ignore - accessing private method for pre-detection
        const detectedLang = parser.detectLanguage(trimmedPrompt) as 'en' | 'pt';

        // Break into sentences for granular AI analysis
        const sentences = trimmedPrompt
          .split(/([.!?\n]+)/)
          .filter(s => s.trim().length > 10); // Only analyze meaningful chunks
        
        if (sentences.length > 0) {
          const results = await classifyComponents(sentences, detectedLang) as Record<string, number>[];
          sentences.forEach((sentence, i) => {
            semanticMap[sentence.trim()] = results[i];
          });
        }
        
        // Also classify full prompt for context
        const fullPromptScores = await classifyComponents(trimmedPrompt, detectedLang) as Record<string, number>;
        semanticMap['__FULL_PROMPT__'] = fullPromptScores;
        
        setModelReady(true);
      } catch (classifierErr) {
        console.warn('Semantic classification failed, using regex only', classifierErr);
      }

      const parser = getAnatomyParser();
      // Pass the complete granular semantic map to the parser
      const anatomyResult = parser.parse(trimmedPrompt, semanticMap);

      // Now pass the hybrid components to the scorer for accurate score calculation
      // Convert ComponentMatch[] → Record<string, number> (componentId → confidence)
      const detectedComponents = Object.fromEntries(
        anatomyResult.components.map(c => [c.componentId, c.confidence])
      );
      const scoreResult = scorer.score(trimmedPrompt, detectedComponents);

      setAnalysis(convertAnatomyToAnalyzeResponse(anatomyResult));
      setScore(convertScoreToScoreResponse(scoreResult, trimmedPrompt));
      lastAnalyzedPrompt.current = trimmedPrompt;
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, [analysis]);

  return { analysis, score, loading, error, modelReady, downloadProgress, analyze };
}
