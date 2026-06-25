export class LLMError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LLMError';
  }
}

export class LLMApiError extends LLMError {
  public statusCode: number;
  public provider: string;

  constructor(message: string, statusCode: number, provider: string) {
    super(message);
    this.name = 'LLMApiError';
    this.statusCode = statusCode;
    this.provider = provider;
  }
}

export class LLMConfigurationError extends LLMError {
  public provider: string;

  constructor(provider: string, message: string) {
    super(message);
    this.name = 'LLMConfigurationError';
    this.provider = provider;
  }
}

// Legacy aliases for backward compatibility during transition
export const OpenAIError = LLMApiError;
export const AnthropicError = LLMApiError;
