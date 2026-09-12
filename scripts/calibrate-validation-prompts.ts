/**
 * Re-baselines the golden dataset's `scoreRange` values against the current scorer.
 *
 * WHY THIS EXISTS
 * ---------------
 * `scoreRange` is a regression *tripwire*, not ground truth: it was generated from the
 * scorer's own output (see the dataset's `description`). Whenever the parser or scorer
 * changes on purpose, the tripwire must be re-baselined, otherwise it stays permanently red
 * and stops carrying any signal. The human-authored parts of the dataset — the `expected`
 * component presence per prompt — are ground truth and are NEVER touched here.
 *
 * WHAT THE PREVIOUS VERSION DID WRONG
 * -----------------------------------
 * 1. It called `scorer.score(text, anatomy.components)`, passing the components *array*.
 *    The scorer expects a map of componentType → confidence, so the array was keyed by
 *    indices and the completeness dimension silently collapsed to its floor. Every range it
 *    produced was calibrated against a broken score.
 * 2. It wrote `JSON.stringify({ prompts }, …)`, deleting `version`, `description`,
 *    `componentLegend` and `presenceValues` from the dataset.
 * 3. It reformatted the entire file, producing a whole-file diff that hides the real change.
 *
 * This version scores through the same path the app uses, keeps every other byte of the file
 * untouched, and reports the per-prompt delta so the change is reviewable.
 *
 * USAGE (from the repository root)
 *   npx tsx scripts/calibrate-validation-prompts.ts            # dry run (default, safe)
 *   npx tsx scripts/calibrate-validation-prompts.ts --apply    # write the file
 *
 * ⚠️  READ BEFORE USING --apply
 * Re-baselining copies whatever the scorer does today into the dataset as "expected".
 * That is correct for *drift* after an intentional change — and actively harmful when the
 * current scores are wrong, because it converts a real defect into a passing test.
 *
 * Known example at the time of writing: Portuguese prompts score ~0.22–0.25 lower than
 * English prompts the dataset rates in the same quality category (good/perfect), because the
 * scorer's per-dimension heuristics are English-centric. Re-baselining would enshrine that
 * bias instead of fixing it. Confirm the new scores are more correct — not merely current —
 * before applying.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getAnatomyParser } from '../frontend/src/core/anatomyParser';
import { Scorer } from '../frontend/src/core/scorer';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FILE_PATH = path.resolve(HERE, '../frontend/src/data/validation-prompts.json');

/** Same window the original calibration used. */
const WINDOW = 0.075;

// Dry run is the default: writing is opt-in, because a careless re-baseline silently
// turns currently-wrong scores into expected behaviour.
const dryRun = !process.argv.includes('--apply');

const parser = getAnatomyParser();
const scorer = new Scorer();

const raw = fs.readFileSync(FILE_PATH, 'utf8');
const data = JSON.parse(raw) as {
  prompts: Array<{
    id: string;
    text: string;
    scoreRange: { min: number; max: number };
  }>;
};

/**
 * Mirrors the app: componentType → confidence. Never key by componentId (a UUID).
 */
function detectedComponentMap(components: Array<{ componentType: string; confidence: number }>) {
  return Object.fromEntries(components.map((c) => [c.componentType, c.confidence]));
}

const round = (n: number) => Math.round(n * 1000) / 1000;

let lines = raw.split('\n');
let changed = 0;

for (const prompt of data.prompts) {
  const anatomy = parser.parse(prompt.text);
  const score = scorer.score(prompt.text, detectedComponentMap(anatomy.components)).overall.score;

  const min = Math.max(0, round(score - WINDOW));
  const max = Math.min(1, round(score + WINDOW));
  const { min: oldMin, max: oldMax } = prompt.scoreRange;

  if (oldMin === min && oldMax === max) continue;

  // Each prompt lives on its own line; rewrite only that line's scoreRange so the
  // rest of the file (metadata, notes, formatting) is preserved byte for byte.
  const escapedId = `"id":"${prompt.id}"`;
  const index = lines.findIndex((line) => line.includes(escapedId));
  if (index === -1) {
    console.warn(`⚠️  could not find a line for ${prompt.id}; skipping`);
    continue;
  }

  const before = lines[index];
  // Replace by index rather than regex: the stored JSON may format the same number
  // differently ("0.20" vs 0.2), which makes literal matching brittle.
  const marker = '"scoreRange":';
  const rangeStart = before.indexOf(marker);
  const rangeEnd = before.indexOf('}', rangeStart) + 1;

  if (rangeStart === -1 || rangeEnd === 0) {
    console.warn(`⚠️  no scoreRange field on the line for ${prompt.id}; skipping`);
    continue;
  }

  const after =
    before.slice(0, rangeStart) +
    `"scoreRange":{"min":${min},"max":${max}}` +
    before.slice(rangeEnd);

  if (after === before) {
    console.warn(`⚠️  scoreRange unchanged for ${prompt.id}; skipping`);
    continue;
  }

  lines[index] = after;
  changed++;
  console.log(
    `${prompt.id.padEnd(6)} score=${score.toFixed(3)}  ` +
      `[${oldMin}, ${oldMax}] -> [${min}, ${max}]`
  );
}

console.log(`\n${changed} of ${data.prompts.length} score ranges ${dryRun ? 'would change' : 'updated'}`);

if (!dryRun && changed > 0) {
  fs.writeFileSync(FILE_PATH, lines.join('\n'));
  console.log(`✅ ${path.relative(process.cwd(), FILE_PATH)} rewritten (metadata preserved)`);
} else if (dryRun) {
  console.log('(dry run — nothing written)');
}
