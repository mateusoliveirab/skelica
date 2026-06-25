/**
 * Run all prompts found in the project through the analyzer
 * Usage: npx tsx scripts/run-all-prompts.ts
 */

import { getAnatomyParser } from '../frontend/src/core/anatomyParser';
import { Scorer } from '../frontend/src/core/scorer';

// Prompts from validation-prompts.json
import validationData from '../frontend/src/data/validation-prompts.json';

// Additional prompts from docs/testing/prompt.md, docs/testing/cases.md, templates
const additionalPrompts = [
  {
    id: 'test-full',
    label: 'docs/testing/prompt.md — Full ML prompt',
    text: `You are a senior Python developer with 10 years of experience in data engineering and machine learning. Your expertise includes building scalable data pipelines and optimizing ML models for production.

Given that we're building a real-time recommendation system for an e-commerce platform with 1 million daily active users, you need to design a solution that handles high throughput and low latency requirements.

Your task is to write a Python function that processes user interaction data and generates personalized product recommendations. The function should accept a user_id and return a ranked list of product IDs with confidence scores.

Do not use external recommendation libraries like Surprise or LightFM. Limit the response to 100 lines of code. Do not include any database connection code.

Example input: user_id = "user_12345"
Example output: {"recommendations": [{"product_id": "prod_001", "score": 0.95}, {"product_id": "prod_002", "score": 0.87}]}

Output the result as a valid JSON object with the following structure:
{
  "function_name": "string",
  "code": "string containing the full Python code",
  "complexity": "O(n) notation",
  "dependencies": ["list of required packages"]
}`,
  },
  {
    id: 'test-simple',
    label: 'docs/testing/prompt.md — Simple',
    text: 'You are a data analyst. Given that the dataset contains sales data from 2023, analyze the monthly trends. Your task is to create a summary report. Do not include raw data in the output. Example: "January: $50k revenue". Output as markdown table.',
  },
  { id: 'tc-001', label: 'TEST_CASES — You are a Python expert', text: 'You are a Python expert' },
  { id: 'tc-002', label: 'TEST_CASES — Act as architect', text: 'Act as a senior software architect' },
  {
    id: 'tc-004',
    label: 'TEST_CASES — Given that healthcare',
    text: 'Given that we are building a healthcare app for elderly patients',
  },
  { id: 'tpl-sw', label: 'Template — Software Engineer (filled)', text: 'You are a senior software engineer with 10+ years of experience in Python. Write a sorting function\n\nConstraints:\n- No external libraries\n\nOutput format: JSON' },
  { id: 'tpl-data', label: 'Template — Data Analyst (filled)', text: 'You are an expert data analyst. Analyze the following data: sales.csv\n\nProvide insights in markdown format.' },
];

const parser = getAnatomyParser();
const scorer = new Scorer();
const components = ['role', 'context', 'instruction', 'example', 'constraint', 'format'] as const;

function runPrompt(id: string, label: string, text: string) {
  const anatomy = parser.parse(text);
  const scoreResult = scorer.score(text);
  const detected = new Set(anatomy.components.map((c) => c.componentType));
  return {
    id,
    label,
    score: scoreResult.overall.score,
    grade: scoreResult.overall.grade,
    detected: Object.fromEntries(components.map((c) => [c, detected.has(c)])),
  };
}

console.log('\n=== VALIDATION PROMPTS (from validation-prompts.json) ===\n');

for (const p of validationData.prompts as Array<{ id: string; label: string; text: string }>) {
  const r = runPrompt(p.id, p.label, p.text);
  const det = Object.entries(r.detected).map(([k, v]) => (v ? '✓' : '-')).join(' ');
  console.log(`${r.id.padEnd(4)} | ${r.score.toFixed(3)} | ${r.grade} | ${det} | ${r.label}`);
}

console.log('\n=== ADDITIONAL PROMPTS (docs/testing/prompt.md, cases.md, templates) ===\n');

for (const p of additionalPrompts) {
  const r = runPrompt(p.id, p.label, p.text);
  const det = Object.entries(r.detected).map(([k, v]) => (v ? '✓' : '-')).join(' ');
  console.log(`${r.id.padEnd(12)} | ${r.score.toFixed(3)} | ${r.grade} | ${det} | ${r.label}`);
}

console.log('\n=== DONE ===\n');
