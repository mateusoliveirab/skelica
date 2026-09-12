/**
 * SemanticClassifier - embedding-similarity classification of prompt components (ADR-0001)
 * Offloads Transformers.js inference to a Web Worker to prevent UI blocking.
 * The worker already returns scores keyed by component id (see core/worker.ts) — no
 * label-text-to-component mapping is needed here, which also removes the risk of a
 * language's labels silently missing from that mapping.
 */

export type SemanticComponents = Record<string, number>;

// Internal state
let worker: Worker | null = null;
let progressCallback: ((progress: number) => void) | null = null;
type SemanticScores = Record<string, number>;

/**
 * The worker replies with either a single score set (a string was passed) or an array of them
 * (an array was passed). Callers know which they asked for, so the transport stays untyped and
 * each caller narrows the result.
 */
interface PendingRequest {
  resolve: (value: SemanticScores | SemanticScores[]) => void;
  reject: (error: Error) => void;
}

/** Shape of the messages `core/worker.ts` posts back. */
type WorkerMessage =
  | { type: 'progress'; payload: { status?: string; progress?: number } }
  | { id: string; type: 'result'; payload: SemanticScores | SemanticScores[] }
  | { id: string; type: 'error'; payload: string };
const messageCallbacks = new Map<string, PendingRequest>();
let nextMessageId = 0;

export function setModelProgressCallback(callback: (progress: number) => void) {
  progressCallback = callback;
}

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
    
    worker.addEventListener('message', (event: MessageEvent<WorkerMessage>) => {
      const message = event.data;

      if (message.type === 'progress') {
        const { status, progress } = message.payload;
        if (status === 'progress' && progress !== undefined && progressCallback) {
          progressCallback(progress);
        }
        if (status === 'done' && progressCallback) {
          progressCallback(100);
        }
        return;
      }

      if (messageCallbacks.has(message.id)) {
        const { resolve, reject } = messageCallbacks.get(message.id)!;
        messageCallbacks.delete(message.id);

        if (message.type === 'error') {
          reject(new Error(message.payload));
        } else {
          resolve(message.payload);
        }
      }
    });

    // Initialize the pipeline
    const id = `init_${nextMessageId++}`;
    worker.postMessage({ id, type: 'init' });
  }
  return worker;
}

/**
 * Send a classification request to the worker
 */
function classifyWithWorker(
  texts: string[],
  language: 'en' | 'pt' | 'es'
): Promise<SemanticScores[]> {
  return new Promise((resolve, reject) => {
    try {
      const w = getWorker();
      const id = `msg_${nextMessageId++}`;
      messageCallbacks.set(id, {
        // The worker echoes an array for an array request; the caller knows its own shape.
        resolve: (value) => resolve(value as SemanticScores[]),
        reject,
      });
      w.postMessage({ id, type: 'classify', payload: texts, language });
    } catch (e) {
      reject(e);
    }
  });
}

/**
 * Internal sentence-level cache to avoid redundant AI calls
 */
const sentenceCache = new Map<string, SemanticComponents>();

/**
 * Enhanced implementation with sentence-level caching and worker offloading
 */
async function performClassification(
  input: string | string[], 
  language: 'en' | 'pt' | 'es' = 'en'
): Promise<SemanticComponents | SemanticComponents[]> {
  const inputs = Array.isArray(input) ? input : [input];
  if (inputs.length === 0) return [];

  const results: SemanticComponents[] = new Array(inputs.length);
  const toProcess: { text: string; index: number }[] = [];

  // 1. Check cache first
  inputs.forEach((text, i) => {
    const cacheKey = `${language}:${text.trim()}`;
    if (sentenceCache.has(cacheKey)) {
      results[i] = sentenceCache.get(cacheKey)!;
    } else {
      toProcess.push({ text: text.trim(), index: i });
    }
  });

  // 2. Process only new sentences in batch via Worker
  if (toProcess.length > 0) {
    const batchTexts = toProcess.map(p => p.text);

    // Offload to worker instead of blocking main thread.
    // The worker returns one Record<component, similarityScore> per input text already.
    const outputs = await classifyWithWorker(batchTexts, language) as SemanticComponents[];

    outputs.forEach((scores: SemanticComponents, i: number) => {
      const originalIndex = toProcess[i].index;
      results[originalIndex] = scores;
      sentenceCache.set(`${language}:${toProcess[i].text}`, scores);
    });
  }

  return Array.isArray(input) ? results : results[0];
}

/**
 * Starts loading the model without classifying anything, and resolves when it is ready.
 *
 * This exists so the app can pay the ~140 MiB download *after* the user has already seen a
 * result, in the background, instead of blocking the first analysis. Rejects if the model
 * cannot be loaded (offline, blocked, out of memory).
 */
export function warmUp(): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    try {
      const w = getWorker();
      const id = `warmup_${nextMessageId++}`;
      messageCallbacks.set(id, {
        resolve: () => resolve(),
        reject: (error) => reject(error),
      });
      w.postMessage({ id, type: 'init' });
    } catch (error) {
      reject(error instanceof Error ? error : new Error(String(error)));
    }
  });
}

/**
 * classifyComponents
 */
export const classifyComponents = performClassification;
