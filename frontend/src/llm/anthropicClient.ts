import Anthropic from '@anthropic-ai/sdk';
import type { OptimizeResult } from './openaiClient';
import { RateLimiter } from './rateLimiter';
import { LLMApiError } from './errors';
import { COMPONENT_TYPES, buildSystemPrompt, toSuggestionsApplied, type StructuredOptimizeResponse } from './schema';

const TOOL_NAME = 'submit_optimization';

/** Current Claude model as of this session — see ADR-0002. */
export const DEFAULT_MODEL = 'claude-sonnet-5';

export class AnthropicClient {
  private client: Anthropic;
  private rateLimiter: RateLimiter;
  private model: string;

  constructor(apiKey: string, model: string = DEFAULT_MODEL) {
    this.client = new Anthropic({
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
        'anthropic'
      );
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      this.rateLimiter.recordRequest();

      const systemPrompt = buildSystemPrompt(suggestions, 'a prompt engineering expert specializing in Claude prompts');

      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 2000,
        system: systemPrompt,
        tools: [{
          name: TOOL_NAME,
          description: 'Submit the optimized prompt and the component classification for each addressed issue, in order.',
          input_schema: {
            type: 'object',
            properties: {
              optimizedPrompt: { type: 'string' },
              componentsForSuggestions: {
                type: 'array',
                items: { type: 'string', enum: COMPONENT_TYPES as unknown as string[] },
              },
            },
            required: ['optimizedPrompt', 'componentsForSuggestions'],
          },
        }],
        tool_choice: { type: 'tool', name: TOOL_NAME },
        messages: [{
          role: 'user',
          content: `Improve this prompt:\n\n${prompt}`
        }]
      }, { signal: controller.signal });

      const toolBlock = response.content.find(
        (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
      );
      const parsed = toolBlock?.input as StructuredOptimizeResponse | undefined;

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
