import Anthropic from '@anthropic-ai/sdk';
import type { OptimizeResult } from './openaiClient';
import { RateLimiter } from './rateLimiter';
import { LLMApiError } from './errors';

export class AnthropicClient {
  private client: Anthropic;
  private rateLimiter: RateLimiter;

  constructor(apiKey: string) {
    this.client = new Anthropic({
      apiKey,
      dangerouslyAllowBrowser: true // Required for client-side usage
    });
    this.rateLimiter = new RateLimiter();
  }

  async optimizePrompt(
    prompt: string,
    suggestions: string[]
  ): Promise<OptimizeResult> {
    // Check rate limiting
    if (!this.rateLimiter.canMakeRequest()) {
      throw new LLMApiError(
        'Rate limit exceeded. Please wait before making another request.',
        429,
        'anthropic'
      );
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      this.rateLimiter.recordRequest();

      const systemPrompt = `You are a prompt engineering expert specializing in Claude prompts.
Improve the following prompt by addressing these issues: ${suggestions.join(', ')}

Provide only the improved prompt without explanations or additional commentary.`;

      const response = await this.client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2000,
        system: systemPrompt,
        messages: [{
          role: 'user',
          content: `Improve this prompt:\n\n${prompt}`
        }]
      }, { signal: controller.signal });

      const optimizedPrompt = response.content[0]?.type === 'text'
        ? response.content[0].text
        : prompt;

      return {
        optimizedPrompt,
        suggestionsApplied: suggestions.map(s => ({
          component: this.extractComponent(s),
          suggestedImprovement: s
        }))
      };
    } catch (error) {
      throw this.handleError(error);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private extractComponent(suggestion: string): string {
    // Extract component type from suggestion text
    const componentMatch = suggestion.match(/\b(role|context|instruction|constraint|example|format|audience|tone)\b/i);
    return componentMatch ? componentMatch[1].toLowerCase() : 'general';
  }

  private handleError(error: unknown): LLMApiError {
    if (error instanceof Error && error.name === 'AbortError') {
      return new LLMApiError('Request timed out after 30 seconds', 408, 'anthropic');
    }

    if (error instanceof Anthropic.APIError) {
      return new LLMApiError(
        error.message,
        error.status || 500,
        'anthropic'
      );
    }

    if (error instanceof Error) {
      return new LLMApiError(error.message, 500, 'anthropic');
    }

    return new LLMApiError('Unknown error occurred', 500, 'anthropic');
  }
}

