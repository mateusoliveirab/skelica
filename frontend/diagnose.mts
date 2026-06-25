import { getAnatomyParser } from './src/core/anatomyParser';
import { Scorer } from './src/core/scorer';
import data from './src/data/validation-prompts.json' with { type: 'json' };

const parser = getAnatomyParser();
const scorer = new Scorer();
const prompts = (data.prompts as any[]).filter((p: any) => p.section === '5' || p.section === '6');

for (const p of prompts) {
  const res = parser.parse(p.text);
  const detected = res.components.map((c: any) => c.componentType);
  const score = scorer.score(p.text).overall.score;
  const issues: string[] = [];

  for (const [key, exp] of Object.entries(p.expected as Record<string,string>)) {
    const has = detected.includes(key);
    if (exp === 'present' && !has) issues.push(`${key}:MISS`);
    if (exp === 'absent' && has) issues.push(`${key}:FP`);
  }
  if (score < p.scoreRange.min) issues.push(`score:${score.toFixed(3)}<${p.scoreRange.min}`);
  if (score > p.scoreRange.max) issues.push(`score:${score.toFixed(3)}>${p.scoreRange.max}`);

  const status = issues.length ? '✗' : '✓';
  console.log(`${status} ${p.id.padEnd(3)} [${score.toFixed(3)}] det:[${detected.join(',')}] ${issues.join(' | ')}`);
}
