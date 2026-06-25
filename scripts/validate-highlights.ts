/**
 * Validate highlight spans for 2 prompts - check for cut-off or misinterpretation.
 * Run: npx tsx scripts/validate-highlights.ts
 */

import { getAnatomyParser } from '../frontend/src/core/anatomyParser';
import { convertAnatomyToAnalyzeResponse } from '../frontend/src/adapters/anatomyAdapter';

const PROMPTS = [
  {
    id: 'S1-bad',
    text: "hi so i was thinking, my company is growing and my boss said i need to do a presentation but i've never done one properly, can you help me? maybe like 10 slides? i don't know what you think?",
  },
  {
    id: 'S10-good',
    text: "You are a nutritionist. Create a 5-day meal plan for a vegetarian woman, 35 years old, training 3x per week, with lactose intolerance. Each day must include breakfast, lunch, and dinner. No supplements. Format as a table: Day | Meal | Dish | Calories.",
  },
];

const parser = getAnatomyParser();

for (const { id, text } of PROMPTS) {
  console.log(`\n=== ${id} ===\n`);
  console.log('Full text length:', text.length);
  console.log('Text:', text.slice(0, 80) + (text.length > 80 ? '...' : ''));

  const anatomy = parser.parse(text);
  const analysis = convertAnatomyToAnalyzeResponse(anatomy);

  const present = analysis.components.filter(
    (c) => c.presence.present && c.start != null && c.end != null
  );

  console.log('\nHighlighted spans:');
  let hasError = false;
  for (const c of present) {
    const start = c.start!;
    const end = c.end!;
    const extracted = text.slice(start, end);
    const expected = analysis.prompt.slice(start, end);

    if (extracted !== expected) {
      console.error(`  [ERROR] ${c.component}: text mismatch`);
      hasError = true;
    }
    if (start < 0 || end > text.length || start >= end) {
      console.error(`  [ERROR] ${c.component}: invalid range [${start}, ${end}]`);
      hasError = true;
    }

    const preview = extracted.length > 50 ? extracted.slice(0, 50) + '...' : extracted;
    console.log(`  ${c.component}: [${start}, ${end}) → "${preview.replace(/\n/g, ' ')}"`);
  }

  // Reconstruct full text from segments (same logic as AnatomyView highlightText)
  const sorted = [...present].sort((a, b) => a.start! - b.start!);
  const filtered: typeof sorted = [];
  for (const m of sorted) {
    const overlaps = filtered.some((f) => m.start! < f.end! && m.end! > f.start!);
    if (!overlaps) filtered.push(m);
  }
  let reconstructed = '';
  let lastEnd = 0;
  for (const m of filtered.sort((a, b) => a.start! - b.start!)) {
    if (m.start! > lastEnd) reconstructed += text.slice(lastEnd, m.start!);
    reconstructed += text.slice(m.start!, m.end!);
    lastEnd = m.end!;
  }
  if (lastEnd < text.length) reconstructed += text.slice(lastEnd);

  if (reconstructed !== text) {
    console.error('\n  [ERROR] Reconstructed text differs from original!');
    console.error('  Original length:', text.length, 'Reconstructed:', reconstructed.length);
  } else {
    console.log('\n  ✓ Reconstructed text matches original (no gaps/overlaps)');
  }
}

console.log('\n=== Done ===\n');
