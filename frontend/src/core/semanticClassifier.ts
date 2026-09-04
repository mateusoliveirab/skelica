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
const messageCallbacks = new Map<string, { resolve: (val: any) => void; reject: (err: any) => void }>();
let nextMessageId = 0;

export function setModelProgressCallback(callback: (progress: number) => void) {
  progressCallback = callback;
}

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
    
    worker.addEventListener('message', (event) => {
      const { id, type, payload } = event.data;

      if (type === 'progress') {
        if (payload.status === 'progress' && payload.progress !== undefined && progressCallback) {
          progressCallback(payload.progress);
        }
        if (payload.status === 'done' && progressCallback) {
          progressCallback(100);
        }
        return;
      }

      if (id !== undefined && messageCallbacks.has(id)) {
        const { resolve, reject } = messageCallbacks.get(id)!;
        messageCallbacks.delete(id);
        
        if (type === 'error') {
          reject(new Error(payload));
        } else {
          resolve(payload);
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
function classifyWithWorker(texts: string[], language: 'en' | 'pt' | 'es'): Promise<any[]> {
  return new Promise((resolve, reject) => {
    try {
      const w = getWorker();
      const id = `msg_${nextMessageId++}`;
      messageCallbacks.set(id, { resolve, reject });
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
 * classifyComponents
 */
export const classifyComponents = performClassification;
