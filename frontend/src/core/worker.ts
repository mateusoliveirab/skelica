import { pipeline } from '@huggingface/transformers';

/**
 * ADR-0001: multilingual sentence-embedding classifier, replacing the
 * English-only zero-shot NLI model (mobilebert-uncased-mnli).
 *
 * Label representation is validated empirically (see ADR-0001) to matter far
 * more than model choice: a single short description per component scores
 * ~20-33% top-1 accuracy (barely above chance for 9 classes), because
 * pragmatic/discourse categories like "role" vs "audience" or "constraint" vs
 * "negative_constraint" sit too close together in embedding space when
 * described abstractly. Averaging 3 concrete exemplar sentences per component
 * into one centroid embedding raised that to ~96% on the validation probes.
 */
const MODEL_ID = 'Xenova/multilingual-e5-small';

export type SupportedLanguage = 'en' | 'pt' | 'es';

const EXEMPLARS: Record<SupportedLanguage, Record<string, string[]>> = {
  en: {
    role: ['You are a senior backend engineer.', 'Act as an expert copywriter.', 'You are a helpful and knowledgeable assistant.'],
    context: ['Our company sells outdoor gear to customers in North America.', 'The following is a chapter from a fantasy novel.', 'We are migrating a legacy PHP app to a modern stack.'],
    instruction: ['Write a function that sorts a list of numbers.', 'Summarize the following article in three sentences.', 'Translate this paragraph into French.'],
    constraint: ['The response must be under 200 words.', 'Use only information from the provided document.', 'The code must run on Python 3.10 or later.'],
    negative_constraint: ['Do not include any explanations or commentary.', 'Never mention competitor brand names.', 'Avoid technical jargon.'],
    example: ['For example, input: [3,1,2] output: [1,2,3].', 'Here is a sample response: "Thank you for reaching out."', 'e.g. "The weather today is sunny and warm."'],
    format: ['Respond in valid JSON with keys "title" and "body".', 'Return the answer as a bulleted list.', 'Format the output as a markdown table.'],
    audience: ['This is intended for absolute beginners with no coding background.', 'The reader is a busy executive with limited time.', 'Write for a technical audience of senior engineers.'],
    tone: ['Keep the tone professional and concise.', 'Use a warm, friendly, conversational voice.', 'The tone should be formal and academic.'],
  },
  pt: {
    role: ['Você é um engenheiro de backend sênior.', 'Atue como um redator publicitário especialista.', 'Você é um assistente prestativo e conhecedor.'],
    context: ['Nossa empresa vende equipamentos outdoor para clientes no Brasil.', 'O texto a seguir é um capítulo de um romance de fantasia.', 'Estamos migrando um sistema legado em PHP para uma stack moderna.'],
    instruction: ['Escreva uma função que ordene uma lista de números.', 'Resuma o artigo a seguir em três frases.', 'Traduza este parágrafo para o francês.'],
    constraint: ['A resposta deve ter no máximo 200 palavras.', 'Use apenas informações do documento fornecido.', 'O código deve rodar em Python 3.10 ou superior.'],
    negative_constraint: ['Não inclua explicações ou comentários.', 'Nunca mencione nomes de marcas concorrentes.', 'Evite jargão técnico.'],
    example: ['Por exemplo, entrada: [3,1,2] saída: [1,2,3].', 'Aqui está uma resposta de amostra: "Obrigado por entrar em contato."', 'ex.: "O tempo hoje está ensolarado e quente."'],
    format: ['Responda em JSON válido com as chaves "titulo" e "corpo".', 'Retorne a resposta como uma lista com marcadores.', 'Formate a saída como uma tabela em markdown.'],
    audience: ['Isto é destinado a iniciantes absolutos sem experiência em programação.', 'O leitor é um executivo ocupado com tempo limitado.', 'Escreva para um público técnico de engenheiros sênior.'],
    tone: ['Mantenha o tom profissional e conciso.', 'Use uma voz calorosa, amigável e conversacional.', 'O tom deve ser formal e acadêmico.'],
  },
  es: {
    role: ['Eres un ingeniero de backend senior.', 'Actúa como un redactor publicitario experto.', 'Eres un asistente útil y conocedor.'],
    context: ['Nuestra empresa vende equipos para actividades al aire libre en Latinoamérica.', 'El siguiente es un capítulo de una novela de fantasía.', 'Estamos migrando una aplicación PHP heredada a una pila moderna.'],
    instruction: ['Escribe una función que ordene una lista de números.', 'Resume el siguiente artículo en tres frases.', 'Traduce este párrafo al francés.'],
    constraint: ['La respuesta debe tener menos de 200 palabras.', 'Usa solo información del documento proporcionado.', 'El código debe ejecutarse en Python 3.10 o superior.'],
    negative_constraint: ['No incluyas explicaciones ni comentarios.', 'Nunca menciones nombres de marcas competidoras.', 'Evita la jerga técnica.'],
    example: ['Por ejemplo, entrada: [3,1,2] salida: [1,2,3].', 'Aquí hay una respuesta de muestra: "Gracias por contactarnos."', 'p. ej. "El clima hoy está soleado y cálido."'],
    format: ['Responde en JSON válido con las claves "titulo" y "cuerpo".', 'Devuelve la respuesta como una lista con viñetas.', 'Formatea la salida como una tabla en markdown.'],
    audience: ['Esto está destinado a principiantes absolutos sin experiencia en programación.', 'El lector es un ejecutivo ocupado con poco tiempo.', 'Escribe para un público técnico de ingenieros senior.'],
    tone: ['Mantén un tono profesional y conciso.', 'Usa una voz cálida, amigable y conversacional.', 'El tono debe ser formal y académico.'],
  },
};

type FeatureExtractor = (
  texts: string[],
  options: { pooling: 'mean'; normalize: boolean }
) => Promise<{ tolist(): number[][] }>;

let extractorPromise: Promise<FeatureExtractor> | null = null;
const centroidCache = new Map<SupportedLanguage, { keys: string[]; vectors: number[][] }>();

function dot(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += a[i] * b[i];
  return sum;
}

function normalize(v: number[]): number[] {
  const norm = Math.sqrt(dot(v, v)) || 1;
  return v.map((x) => x / norm);
}

function average(vectors: number[][]): number[] {
  const out = new Array(vectors[0].length).fill(0);
  for (const v of vectors) for (let i = 0; i < v.length; i++) out[i] += v[i];
  return out.map((x) => x / vectors.length);
}

async function loadExtractor(): Promise<FeatureExtractor> {
  if (extractorPromise) return extractorPromise;

  const onProgress = (info: unknown) => self.postMessage({ type: 'progress', payload: info });

  extractorPromise = (async () => {
    // device: 'auto' resolves to the runtime's supportedDevices list in priority order
    // (webgpu first when the browser exposes it, wasm otherwise) — verified against
    // @huggingface/transformers 4.2.0's web build (src/backends/onnx.js
    // deviceToExecutionProviders: `case "auto": return supportedDevices`). No manual
    // navigator.gpu feature-detection or try/catch fallback needed.
    return (await pipeline('feature-extraction', MODEL_ID, {
      device: 'auto',
      dtype: 'q8',
      progress_callback: onProgress,
    })) as unknown as FeatureExtractor;
  })();

  return extractorPromise;
}

async function getCentroids(language: SupportedLanguage, extractor: FeatureExtractor) {
  const cached = centroidCache.get(language);
  if (cached) return cached;

  const exemplars = EXEMPLARS[language] ?? EXEMPLARS.en;
  const keys = Object.keys(exemplars);
  const vectors: number[][] = [];
  for (const key of keys) {
    const inputs = exemplars[key].map((s) => `query: ${s}`);
    const output = await extractor(inputs, { pooling: 'mean', normalize: true });
    vectors.push(normalize(average(output.tolist())));
  }

  const entry = { keys, vectors };
  centroidCache.set(language, entry);
  return entry;
}

function toSupportedLanguage(language: unknown): SupportedLanguage {
  return language === 'pt' || language === 'es' ? language : 'en';
}

self.addEventListener('message', async (event) => {
  const { id, type, payload, language } = event.data;
  const lang = toSupportedLanguage(language);

  if (type === 'init') {
    try {
      const extractor = await loadExtractor();
      await getCentroids(lang, extractor);
      self.postMessage({ id, type: 'init_done' });
    } catch (error) {
      self.postMessage({ id, type: 'error', payload: (error as Error).message });
    }
    return;
  }

  if (type === 'classify') {
    try {
      const extractor = await loadExtractor();
      const { keys, vectors: centroids } = await getCentroids(lang, extractor);

      const texts: string[] = Array.isArray(payload) ? payload : [payload];
      const prefixed = texts.map((t) => `query: ${t}`);
      const output = await extractor(prefixed, { pooling: 'mean', normalize: true });
      const sentenceVectors = output.tolist();

      // Both sides are L2-normalized, so dot product == cosine similarity.
      const results = sentenceVectors.map((vec: number[]) => {
        const scores: Record<string, number> = {};
        keys.forEach((key, i) => {
          scores[key] = dot(vec, centroids[i]);
        });
        return scores;
      });

      self.postMessage({ id, type: 'result', payload: results });
    } catch (error) {
      self.postMessage({ id, type: 'error', payload: (error as Error).message });
    }
  }
});
