import OpenAI from 'openai';
import { RateLimiter } from './rateLimiter';
import { LLMApiError } from './errors';
import { COMPONENT_TYPES, buildSystemPrompt, toSuggestionsApplied, type StructuredOptimizeResponse } from './schema';

export type OptimizeResult = {
  optimizedPrompt: string;
  suggestionsApplied: Array<{
    component: string;
    suggestedImprovement: string;
  }>;
};

/** Verify against OpenAI's current model lineup before changing — see ADR-0002. */
export const DEFAULT_MODEL = 'gpt-4o';

export class OpenAIClient {
  private client: OpenAI;
  private rateLimiter: RateLimiter;
  private model: string;

  constructor(apiKey: string, model: string = DEFAULT_MODEL) {
    this.client = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true // Required for client-side usage
    });
    this.rateLimiter = new RateLimiter();
    this.model = model;
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

      const systemPrompt = buildSystemPrompt(suggestions, 'a prompt engineering expert');

      const response = await this.client.chat.completions.create(
        {
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 2000,
          response_format: {
            type: 'json_schema',
            json_schema: {
              name: 'optimize_result',
              strict: true,
              schema: {
                type: 'object',
                properties: {
                  optimizedPrompt: { type: 'string' },
                  componentsForSuggestions: {
                    type: 'array',
                    items: { type: 'string', enum: COMPONENT_TYPES as unknown as string[] },
                  },
                },
                required: ['optimizedPrompt', 'componentsForSuggestions'],
                additionalProperties: false,
              },
            },
          },
        },
        { signal: controller.signal as AbortSignal }
      );

      const rawContent = response.choices[0]?.message?.content;
      const parsed = rawContent ? (JSON.parse(rawContent) as StructuredOptimizeResponse) : undefined;

      return {
        optimizedPrompt: parsed?.optimizedPrompt || prompt,
        suggestionsApplied: toSuggestionsApplied(parsed, suggestions),
      };
    } catch (error) {
      throw this.handleError(error);
    } finally {
      clearTimeout(timeoutId);
    }
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
