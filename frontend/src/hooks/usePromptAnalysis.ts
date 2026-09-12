import { useState, useCallback, useRef, useEffect } from 'react';
import { getAnatomyParser } from '../core/anatomyParser';
import { Scorer } from '../core/scorer';
import { classifyComponents, setModelProgressCallback, warmUp } from '../core/semanticClassifier';
import { meaningfulSentences } from '../core/segmentation';
import { convertAnatomyToAnalyzeResponse } from '../adapters/anatomyAdapter';
import { convertScoreToScoreResponse } from '../adapters/scoreAdapter';
import { t } from '../i18n';
import type { AnalyzeResponse, ScoreResponse } from '../api/types';

const scorer = new Scorer();

/** The model is ~140 MiB; the pass itself is fast, so this is a generous failure guard. */
export const SEMANTIC_TIMEOUT_MS = 180_000;

/**
 * - `idle`    — not started (no analysis yet, or auto-load withheld on a metered connection)
 * - `loading` — the model is downloading / initialising
 * - `ready`   — loaded; analyses are being refined
 * - `failed`  — could not load; the regex result stands
 */
export type SemanticStatus = 'idle' | 'loading' | 'ready' | 'failed';

interface ConnectionInfo {
  saveData?: boolean;
}

function prefersNoBackgroundDownload(): boolean {
  const connection = (navigator as Navigator & { connection?: ConnectionInfo }).connection;
  return connection?.saveData === true;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('semantic-timeout')), ms);
    promise.then(
      (value) => { clearTimeout(timer); resolve(value); },
      (err) => { clearTimeout(timer); reject(err); },
    );
  });
}

export function usePromptAnalysis() {
  const [analysis, setAnalysis] = useState<AnalyzeResponse | null>(null);
  const [score, setScore] = useState<ScoreResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [refining, setRefining] = useState(false);
  const [semanticStatus, setSemanticStatus] = useState<SemanticStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);

  /** Invalidates in-flight semantic passes when a newer analysis supersedes them. */
  const generation = useRef(0);
  /** The prompt currently on screen, so the model can refine it the moment it is ready. */
  const currentPrompt = useRef('');
  /** Auto-load is attempted at most once; failures must not retry on every keystroke. */
  const warmUpAttempted = useRef(false);

  useEffect(() => {
    setModelProgressCallback((p) => {
      setDownloadProgress(p);
      if (p >= 100) setSemanticStatus('ready');
    });
  }, []);

  /**
   * Fast path — pure client-side regex + scoring. No network, no model, no cost.
   * Synchronous on purpose: the result should be on screen in the same tick as the click.
   */
  const runStatic = useCallback((text: string) => {
    const parser = getAnatomyParser();
    const anatomyResult = parser.parse(text);
    // The scorer looks components up by *type* ('role', 'constraint', …).
    // componentId is a fresh UUID, so keying by it silently zeroed the
    // completeness dimension — never use componentId here.
    const detectedComponents = Object.fromEntries(
      anatomyResult.components.map((c) => [c.componentType, c.confidence])
    );
    const scoreResult = scorer.score(text, detectedComponents);

    setAnalysis(convertAnatomyToAnalyzeResponse(anatomyResult));
    setScore(convertScoreToScoreResponse(scoreResult, text));
  }, []);

  /** Semantic pass — the authoritative detector once the model is loaded. */
  const runSemantic = useCallback(async (text: string, gen: number) => {
    setRefining(true);

    try {
      const parser = getAnatomyParser();
      const language = parser.detectLanguage(text) as 'en' | 'pt' | 'es';

      // Same segmentation the parser uses to look sentences back up — a mismatch would make
      // every lookup miss and silently fall back to whole-prompt scores.
      const sentences = meaningfulSentences(text);

      const semanticMap: Record<string, Record<string, number>> = {};

      if (sentences.length > 0) {
        const results = (await withTimeout(
          classifyComponents(sentences.map((s) => s.text), language),
          SEMANTIC_TIMEOUT_MS
        )) as Record<string, number>[];
        sentences.forEach((sentence, i) => {
          semanticMap[sentence.key] = results[i];
        });
      }

      semanticMap['__FULL_PROMPT__'] = (await withTimeout(
        classifyComponents(text, language),
        SEMANTIC_TIMEOUT_MS
      )) as Record<string, number>;

      // A newer analysis superseded this one.
      if (gen !== generation.current) return;

      setSemanticStatus('ready');

      const anatomyResult = parser.parse(text, semanticMap);
      const detectedComponents = Object.fromEntries(
        anatomyResult.components.map((c) => [c.componentType, c.confidence])
      );
      const scoreResult = scorer.score(text, detectedComponents);

      setAnalysis(convertAnatomyToAnalyzeResponse(anatomyResult));
      setScore(convertScoreToScoreResponse(scoreResult, text));
    } catch {
      if (gen !== generation.current) return;
      setSemanticStatus('failed');
      // The regex result stays on screen — degradation is silent by design.
    } finally {
      if (gen === generation.current) setRefining(false);
    }
  }, []);

  /**
   * Loads the model in the background, then refines whatever is on screen.
   *
   * Deliberately not part of `analyze()`: blocking the first result on a ~140 MiB download is
   * what previously made the app look broken on a cold visit. The user always sees a result
   * first; semantics arrive afterwards and take over.
   */
  const startSemantic = useCallback(() => {
    if (warmUpAttempted.current) return;
    warmUpAttempted.current = true;
    setSemanticStatus('loading');

    // Deferred through a resolved promise so that even a synchronous failure (missing
    // worker, blocked module) becomes a rejection instead of propagating out of analyze().
    // The pattern result must survive whatever the semantic layer does.
    void Promise.resolve()
      .then(() => warmUp())
      .then(() => {
        setSemanticStatus('ready');
        const text = currentPrompt.current;
        if (!text) return;
        const gen = generation.current + 1;
        generation.current = gen;
        return runSemantic(text, gen);
      })
      .catch(() => setSemanticStatus('failed'));
  }, [runSemantic]);

  const analyze = useCallback(
    (prompt: string) => {
      const text = prompt.trim();
      const gen = generation.current + 1;
      generation.current = gen;

      if (!text) {
        currentPrompt.current = '';
        setAnalysis(null);
        setScore(null);
        setError(null);
        setRefining(false);
        return;
      }

      setLoading(true);
      setError(null);
      setRefining(false);

      try {
        runStatic(text);
        currentPrompt.current = text;
      } catch (err) {
        setError(err instanceof Error ? err.message : t('error_generic'));
      } finally {
        setLoading(false);
      }

      if (semanticStatus === 'ready') {
        void runSemantic(text, gen);
        return;
      }

      // First analysis is done and the user has seen value — now it is worth paying the
      // download. Skipped on metered connections; `enableSemantic()` lets those users opt in.
      if (semanticStatus === 'idle' && !prefersNoBackgroundDownload()) {
        startSemantic();
      }
    },
    [runStatic, runSemantic, startSemantic, semanticStatus]
  );

  /** Manual opt-in, for users whose connection asked us not to download in the background. */
  const enableSemantic = useCallback(() => {
    startSemantic();
  }, [startSemantic]);

  return {
    analysis,
    score,
    loading,
    refining,
    semanticStatus,
    error,
    downloadProgress,
    analyze,
    enableSemantic,
  };
}
