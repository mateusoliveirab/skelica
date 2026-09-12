/**
 * Sentence segmentation for the semantic pass.
 *
 * `Intl.Segmenter` answers the *global* question "where does this sentence end?" and does it
 * correctly for abbreviations ("e.g.", "Dr."), ellipses and all three supported languages,
 * with no dictionary and no dependency. It is deliberately NOT used for regex span expansion
 * in `anatomyParser` — see the note on `expandToSentenceEnd` there: a span needs a *local*
 * answer, and the segmenter's long sentences made spans swallow the prompt.
 */

export interface Sentence {
  text: string;
  start: number;
  end: number;
}

/** Sentences shorter than this carry no usable signal and are skipped by callers. */
export const MIN_SENTENCE_LENGTH = 10;

function fallbackSplit(text: string): Sentence[] {
  const out: Sentence[] = [];
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    if ('.!?\n'.includes(text[i])) {
      out.push({ text: text.slice(start, i + 1), start, end: i + 1 });
      start = i + 1;
    }
  }
  if (start < text.length) out.push({ text: text.slice(start), start, end: text.length });
  return out;
}

/**
 * Splits text into sentences with real character offsets.
 *
 * The offsets matter: the semantic classifier returns one score set per sentence, and the
 * parser maps them back by exact text. Splitting on a regex (the previous approach,
 * `text.split(/([.!?\n]+)/)`) produced fragments that kept separator tokens as separate
 * "sentences" and dropped every other element.
 */
export function splitSentences(text: string): Sentence[] {
  if (!text) return [];

  let parts: Sentence[];

  if (typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function') {
    const segmenter = new Intl.Segmenter(undefined, { granularity: 'sentence' });
    parts = [];
    for (const part of segmenter.segment(text)) {
      parts.push({ text: part.segment, start: part.index, end: part.index + part.segment.length });
    }
  } else {
    parts = fallbackSplit(text);
  }

  return parts.filter((sentence) => sentence.text.trim().length > 0);
}

/**
 * Sentences worth sending to the classifier, keyed by their trimmed text.
 * Trimming is what the classifier receives and what the parser looks up, so both sides agree.
 */
export function meaningfulSentences(text: string): Array<{ key: string; text: string }> {
  return splitSentences(text)
    .map((sentence) => sentence.text.trim())
    .filter((sentence) => sentence.length > MIN_SENTENCE_LENGTH)
    .map((sentence) => ({ key: sentence, text: sentence }));
}
