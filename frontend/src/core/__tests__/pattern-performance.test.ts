/**
 * Performance benchmarks for pattern pre-compilation and caching
 * Run with: npm run test -- pattern-performance.test.ts --run
 */

import { describe, it, expect } from 'vitest';
import { AnatomyParser } from '../anatomyParser';

describe('Pattern Performance Benchmarks', () => {
  const testPrompts = [
    'You are a senior developer. Write a function that sorts numbers.',
    'Você é um desenvolvedor sênior. Escreva uma função que ordena números.',
    'Eres un desarrollador senior. Escribe una función que ordene números.',
    `You are an expert software architect.

Context: We are building a microservices platform for e-commerce.

Task: Design a scalable authentication service.

Constraints:
- Must support OAuth2 and JWT
- Should handle 10,000 requests per second
- Must be cloud-native

Output format: JSON with architecture diagram and component descriptions.`,
  ];

  it('should parse prompts quickly with pre-compiled patterns', () => {
    const parser = new AnatomyParser();
    const iterations = 1000;
    const times: number[] = [];

    // Warm-up
    for (let i = 0; i < 10; i++) {
      parser.parse(testPrompts[0]);
    }

    // Benchmark
    for (let i = 0; i < iterations; i++) {
      const prompt = testPrompts[i % testPrompts.length];
      const start = performance.now();
      parser.parse(prompt);
      const duration = performance.now() - start;
      times.push(duration);
    }

    const avgTime = times.reduce((sum, t) => sum + t, 0) / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    const medianTime = times.sort((a, b) => a - b)[Math.floor(times.length / 2)];

    console.log('\n=== Pattern Performance Benchmark ===');
    console.log(`Iterations: ${iterations}`);
    console.log(`Average time: ${avgTime.toFixed(3)}ms`);
    console.log(`Median time: ${medianTime.toFixed(3)}ms`);
    console.log(`Min time: ${minTime.toFixed(3)}ms`);
    console.log(`Max time: ${maxTime.toFixed(3)}ms`);
    console.log(`Throughput: ${(1000 / avgTime).toFixed(0)} parses/second`);
    console.log('=====================================\n');

    // Performance assertions
    expect(avgTime).toBeLessThan(10); // Should average < 10ms
    expect(medianTime).toBeLessThan(8); // Median should be even better
  });

  it('should maintain consistent performance across multiple parses', () => {
    const parser = new AnatomyParser();
    const iterations = 500;
    const batchSize = 100;
    const batchAverages: number[] = [];

    for (let batch = 0; batch < iterations / batchSize; batch++) {
      const batchTimes: number[] = [];
      
      for (let i = 0; i < batchSize; i++) {
        const prompt = testPrompts[i % testPrompts.length];
        const start = performance.now();
        parser.parse(prompt);
        const duration = performance.now() - start;
        batchTimes.push(duration);
      }

      const batchAvg = batchTimes.reduce((sum, t) => sum + t, 0) / batchTimes.length;
      batchAverages.push(batchAvg);
    }

    const firstBatchAvg = batchAverages[0];
    const lastBatchAvg = batchAverages[batchAverages.length - 1];
    const overallAvg = batchAverages.reduce((sum, t) => sum + t, 0) / batchAverages.length;

    console.log('\n=== Performance Consistency ===');
    console.log(`First batch average: ${firstBatchAvg.toFixed(3)}ms`);
    console.log(`Last batch average: ${lastBatchAvg.toFixed(3)}ms`);
    console.log(`Overall average: ${overallAvg.toFixed(3)}ms`);
    console.log(`Performance variance: ${((lastBatchAvg / firstBatchAvg - 1) * 100).toFixed(1)}%`);
    console.log('===============================\n');

    // Performance should not degrade significantly
    expect(lastBatchAvg).toBeLessThan(firstBatchAvg * 1.3); // Max 30% variance
  });

  it('should handle multilingual prompts efficiently', () => {
    const parser = new AnatomyParser();
    const iterations = 300;
    const languageTimes: Record<string, number[]> = {
      en: [],
      pt: [],
      es: [],
    };

    for (let i = 0; i < iterations; i++) {
      for (let j = 0; j < testPrompts.length; j++) {
        const prompt = testPrompts[j];
        const start = performance.now();
        const result = parser.parse(prompt);
        const duration = performance.now() - start;
        
        const lang = result.metadata.detectedLanguage || 'en';
        if (languageTimes[lang]) {
          languageTimes[lang].push(duration);
        }
      }
    }

    console.log('\n=== Multilingual Performance ===');
    for (const [lang, times] of Object.entries(languageTimes)) {
      if (times.length > 0) {
        const avg = times.reduce((sum, t) => sum + t, 0) / times.length;
        console.log(`${lang.toUpperCase()}: ${avg.toFixed(3)}ms average (${times.length} samples)`);
        expect(avg).toBeLessThan(10);
      }
    }
    console.log('================================\n');
  });

  it('should handle long prompts efficiently', () => {
    const parser = new AnatomyParser();
    const longPrompt = `You are a senior software architect with 15 years of experience.

Context: We are building a large-scale distributed system for processing financial transactions.
The system needs to handle millions of transactions per day with high reliability and security.

Task: Design a comprehensive architecture for the transaction processing system.

Requirements:
- Must support real-time processing
- Must be fault-tolerant and highly available
- Must comply with financial regulations
- Must support multiple currencies
- Must provide audit trails
- Must integrate with existing banking systems

Constraints:
- Maximum latency: 100ms per transaction
- Must handle 10,000 transactions per second
- Must maintain 99.99% uptime
- Must support horizontal scaling
- Must use cloud-native technologies
- Must implement proper security measures

Output format: Provide a detailed architecture document in JSON format with the following sections:
- System overview
- Component diagram
- Data flow
- Technology stack
- Security measures
- Scalability strategy
- Deployment architecture
- Monitoring and alerting

Example output structure:
{
  "overview": "...",
  "components": [...],
  "dataFlow": "...",
  "technologies": [...],
  "security": {...},
  "scalability": {...},
  "deployment": {...},
  "monitoring": {...}
}`;

    const iterations = 100;
    const times: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      parser.parse(longPrompt);
      const duration = performance.now() - start;
      times.push(duration);
    }

    const avgTime = times.reduce((sum, t) => sum + t, 0) / times.length;
    const maxTime = Math.max(...times);

    console.log('\n=== Long Prompt Performance ===');
    console.log(`Prompt length: ${longPrompt.length} characters`);
    console.log(`Average time: ${avgTime.toFixed(3)}ms`);
    console.log(`Max time: ${maxTime.toFixed(3)}ms`);
    console.log('===============================\n');

    // Long prompts should still be reasonably fast
    expect(avgTime).toBeLessThan(20); // < 20ms for long prompts
  });
});
