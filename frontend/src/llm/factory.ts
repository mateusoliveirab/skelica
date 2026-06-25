import type { OptimizeResult } from './openaiClient';
import { LLMConfigurationError } from './errors';

export { LLMConfigurationError };

export type LLMProvider = 'openai' | 'anthropic';

export type LLMClient = {
  optimizePrompt(prompt: string, suggestions: string[]): Promise<OptimizeResult>;
};

export class LLMClientFactory {
  static async createClient(provider: LLMProvider, apiKey?: string): Promise<LLMClient> {
    if (!apiKey || apiKey.trim() === '') {
      throw new LLMConfigurationError(
        provider,
        `API key for ${provider} is not configured. Please add your API key in settings.`
      );
    }

    if (provider === 'openai') {
      const { OpenAIClient } = await import('./openaiClient');
      return new OpenAIClient(apiKey);
    } else {
      const { AnthropicClient } = await import('./anthropicClient');
      return new AnthropicClient(apiKey);
    }
  }

  static isConfigured(_provider: LLMProvider, apiKey?: string): boolean {
    return !!apiKey && apiKey.trim() !== '';
  }

  static validateApiKey(provider: LLMProvider, apiKey: string): boolean {
    if (!apiKey || apiKey.trim() === '') {
      return false;
    }

    if (provider === 'openai') {
      // OpenAI keys start with 'sk-' but NOT 'sk-ant-'
      return apiKey.startsWith('sk-') && !apiKey.startsWith('sk-ant-');
    } else {
      // Anthropic keys start with 'sk-ant-'
      return apiKey.startsWith('sk-ant-');
    }
  }
}

