/**
 * Demo script to showcase the Scorer functionality
 * Run with: npx tsx src/core/__tests__/scorer-demo.ts
 */

import { Scorer } from '../scorer';

const scorer = new Scorer();

console.log('=== Skelica Scorer Demo ===\n');

// Test 1: Simple prompt
console.log('Test 1: Simple Prompt');
console.log('Prompt: "Write code."\n');
const result1 = scorer.score('Write code.');
console.log(`Overall Score: ${(result1.overall.score * 100).toFixed(1)}%`);
console.log(`Grade: ${result1.overall.grade}`);
console.log(`Label: ${result1.overall.label}`);
console.log(`Analysis Time: ${result1.analysisTimeMs}ms`);
console.log('\nDimension Scores:');
result1.dimensions.forEach(dim => {
  console.log(`  ${dim.dimension}: ${(dim.score * 100).toFixed(1)}% (${dim.grade})`);
});
console.log('\nRecommendations:');
result1.metadata.recommendations.forEach((rec, i) => {
  console.log(`  ${i + 1}. ${rec}`);
});

console.log('\n' + '='.repeat(60) + '\n');

// Test 2: Complete prompt
console.log('Test 2: Complete Prompt');
const completePrompt = `You are a senior Python developer with expertise in algorithms.

Write a function that implements the quicksort algorithm to sort a list of integers.

Constraints:
- Do not use built-in sort functions
- Time complexity must be O(n log n) average case
- Include proper error handling
- Limit to 50 lines of code

Output format: JSON with the following structure:
\`\`\`json
{
  "code": "function implementation here",
  "explanation": "brief explanation of the algorithm",
  "complexity": "time and space complexity analysis"
}
\`\`\`

Example output:
\`\`\`json
{
  "code": "def quicksort(arr): ...",
  "explanation": "Quicksort uses divide-and-conquer...",
  "complexity": "Time: O(n log n) average, Space: O(log n)"
}
\`\`\``;

console.log('Prompt: (see above)\n');
const result2 = scorer.score(completePrompt);
console.log(`Overall Score: ${(result2.overall.score * 100).toFixed(1)}%`);
console.log(`Grade: ${result2.overall.grade}`);
console.log(`Label: ${result2.overall.label}`);
console.log(`Analysis Time: ${result2.analysisTimeMs}ms`);
console.log('\nDimension Scores:');
result2.dimensions.forEach(dim => {
  console.log(`  ${dim.dimension}: ${(dim.score * 100).toFixed(1)}% (${dim.grade})`);
});
console.log('\nRecommendations:');
const recs2 = result2.metadata.recommendations;
if (recs2.length > 0) {
  recs2.forEach((rec, i) => {
    console.log(`  ${i + 1}. ${rec}`);
  });
} else {
  console.log('  None - This is an excellent prompt!');
}

console.log('\n' + '='.repeat(60) + '\n');

// Test 3: Comparison
console.log('Test 3: Score Comparison');
console.log(`Simple prompt score: ${(result1.overall.score * 100).toFixed(1)}%`);
console.log(`Complete prompt score: ${(result2.overall.score * 100).toFixed(1)}%`);
console.log(`Improvement: ${((result2.overall.score - result1.overall.score) * 100).toFixed(1)}%`);
console.log('\nLowest dimension in complete prompt:', result2.lowestDimension?.dimension);
console.log('Highest dimension in complete prompt:', result2.highestDimension?.dimension);
