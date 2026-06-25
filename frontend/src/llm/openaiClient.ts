import OpenAI from 'openai';
import { RateLimiter } from './rateLimiter';
import { LLMApiError } from './errors';

export type OptimizeResult = {
  optimizedPrompt: string;
  suggestionsApplied: Array<{
    component: string;
    suggestedImprovement: string;
  }>;
};

export class OpenAIClient {
  private client: OpenAI;
  private rateLimiter: RateLimiter;

  constructor(apiKey: string) {
    this.client = new OpenAI({
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
        'openai'
      );
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      this.rateLimiter.recordRequest();

      const systemPrompt = `You are a prompt engineering expert.
Improve the following prompt by addressing these issues: ${suggestions.join(', ')}

Provide only the improved prompt without explanations or additional commentary.`;

      const response = await this.client.chat.completions.create(
        {
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 2000,
        },
        { signal: controller.signal as AbortSignal }
      );

      const optimizedPrompt = response.choices[0]?.message?.content || prompt;

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
      return new LLMApiError('Request timed out after 30 seconds', 408, 'openai');
    }

    if (error instanceof OpenAI.APIError) {
      return new LLMApiError(
        error.message,
        error.status || 500,
        'openai'
      );
    }

    if (error instanceof Error) {
      return new LLMApiError(error.message, 500, 'openai');
    }

    return new LLMApiError('Unknown error occurred', 500, 'openai');
  }
}

