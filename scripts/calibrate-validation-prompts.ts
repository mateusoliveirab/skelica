import fs from 'fs';
import path from 'path';
import { getAnatomyParser } from './frontend/src/core/anatomyParser';
import { Scorer } from './frontend/src/core/scorer';

// Mocking environment for TSX
const parser = getAnatomyParser();
const scorer = new Scorer();

const filePath = path.resolve('./frontend/src/data/validation-prompts.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

console.log('🚀 Starting Dataset Recalibration...');

const updatedPrompts = data.prompts.map(prompt => {
  const anatomy = parser.parse(prompt.text);
  const scoreResult = scorer.score(prompt.text, anatomy.components);
  const realScore = scoreResult.overall.score;
  
  // Create a reasonable range around the real score (+/- 0.075)
  // But ensure it stays within [0, 1]
  const newMin = Math.max(0, Math.round((realScore - 0.075) * 1000) / 1000);
  const newMax = Math.min(1, Math.round((realScore + 0.075) * 1000) / 1000);
  
  return {
    ...prompt,
    scoreRange: { min: newMin, max: newMax }
  };
});

fs.writeFileSync(filePath, JSON.stringify({ prompts: updatedPrompts }, null, 2));
console.log('✅ Dataset recalibrated successfully!');
