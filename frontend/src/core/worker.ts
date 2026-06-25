import { pipeline } from '@huggingface/transformers';

const LABELS_EN = [
  'role definition',
  'background context',
  'task instruction',
  'constraint or rule',
  'negative constraint',
  'example',
  'output_format',
  'target audience',
  'tone or style',
];

const LABELS_PT = [
  'definição de papel ou persona',
  'contexto ou informações de fundo',
  'instrução ou comando de tarefa',
  'restrição ou regra',
  'restrição negativa ou o que evitar',
  'exemplo ou amostra',
  'formato de saída',
  'público-alvo',
  'tom ou estilo de escrita',
];

// Use the singleton pattern to only load the pipeline once.
let classifierPromise: Promise<any> | null = null;

// Listen for messages from the main thread
self.addEventListener('message', async (event) => {
  const { id, type, payload, language } = event.data;

  if (type === 'init') {
    if (!classifierPromise) {
      classifierPromise = pipeline('zero-shot-classification', 'Xenova/mobilebert-uncased-mnli', {
        dtype: 'q4',
        progress_callback: (info: any) => {
          self.postMessage({ type: 'progress', payload: info });
        }
      });
    }
    await classifierPromise;
    self.postMessage({ id, type: 'init_done' });
    return;
  }

  if (type === 'classify') {
    try {
      const classifier = await classifierPromise;
      if (!classifier) {
        throw new Error("Classifier not initialized");
      }

      const labels = language === 'pt' ? LABELS_PT : LABELS_EN;
      const results = await classifier(payload, labels, { multi_label: true });
      
      self.postMessage({ id, type: 'result', payload: results });
    } catch (error) {
      self.postMessage({ id, type: 'error', payload: (error as Error).message });
    }
  }
});
