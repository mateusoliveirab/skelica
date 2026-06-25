/**
 * Integration tests for LLM Client Factory
 */

import { describe, it, expect, vi } from 'vitest';
import { LLMClientFactory } from '../factory';
import { LLMConfigurationError } from '../errors';
import { OpenAIClient } from '../openaiClient';
import { AnthropicClient } from '../anthropicClient';

// Mock the client modules
vi.mock('../openaiClient', () => ({
  OpenAIClient: vi.fn(),
  OpenAIError: class OpenAIError extends Error {
    statusCode: number;
    constructor(message: string, statusCode: number) {
      super(message);
      this.name = 'OpenAIError';
      this.statusCode = statusCode;
    }
  },
  RateLimiter: vi.fn()
}));

vi.mock('../anthropicClient', () => ({
  AnthropicClient: vi.fn(),
  AnthropicError: class AnthropicError extends Error {
    statusCode: number;
    constructor(message: string, statusCode: number) {
      super(message);
      this.name = 'AnthropicError';
      this.statusCode = statusCode;
    }
  }
}));

describe('LLMClientFactory', () => {
  describe('createClient', () => {
    it('should create OpenAI client with valid key', async () => {
      const apiKey = 'sk-test-key-123';
      await LLMClientFactory.createClient('openai', apiKey);

      expect(OpenAIClient).toHaveBeenCalledWith(apiKey);
    });

    it('should create Anthropic client with valid key', async () => {
      const apiKey = 'sk-ant-test-key-123';
      await LLMClientFactory.createClient('anthropic', apiKey);

      expect(AnthropicClient).toHaveBeenCalledWith(apiKey);
    });

    it('should throw LLMConfigurationError for missing OpenAI key', async () => {
      try {
        await LLMClientFactory.createClient('openai');
        expect.fail('Should have thrown LLMConfigurationError');
      } catch (error) {
        expect(error).toBeInstanceOf(LLMConfigurationError);
        const configError = error as LLMConfigurationError;
        expect(configError.provider).toBe('openai');
        expect(configError.message).toContain('not configured');
      }
    });

    it('should throw LLMConfigurationError for missing Anthropic key', async () => {
      try {
        await LLMClientFactory.createClient('anthropic');
        expect.fail('Should have thrown LLMConfigurationError');
      } catch (error) {
        expect(error).toBeInstanceOf(LLMConfigurationError);
        const configError = error as LLMConfigurationError;
        expect(configError.provider).toBe('anthropic');
        expect(configError.message).toContain('not configured');
      }
    });

    it('should throw LLMConfigurationError for empty string key', async () => {
      try {
        await LLMClientFactory.createClient('openai', '');
        expect.fail('Should have thrown LLMConfigurationError');
      } catch (error) {
        expect(error).toBeInstanceOf(LLMConfigurationError);
      }

      try {
        await LLMClientFactory.createClient('anthropic', '   ');
        expect.fail('Should have thrown LLMConfigurationError');
      } catch (error) {
        expect(error).toBeInstanceOf(LLMConfigurationError);
      }
    });

    it('should throw LLMConfigurationError for whitespace-only key', async () => {
      try {
        await LLMClientFactory.createClient('openai', '   \t\n  ');
        expect.fail('Should have thrown LLMConfigurationError');
      } catch (error) {
        expect(error).toBeInstanceOf(LLMConfigurationError);
      }
    });
  });

  describe('isConfigured', () => {
    it('should return true for valid OpenAI key', () => {
      expect(LLMClientFactory.isConfigured('openai', 'sk-test-key')).toBe(true);
    });

    it('should return true for valid Anthropic key', () => {
      expect(LLMClientFactory.isConfigured('anthropic', 'sk-ant-test-key')).toBe(true);
    });

    it('should return false for undefined key', () => {
      expect(LLMClientFactory.isConfigured('openai', undefined)).toBe(false);
      expect(LLMClientFactory.isConfigured('anthropic', undefined)).toBe(false);
    });

    it('should return false for empty string key', () => {
      expect(LLMClientFactory.isConfigured('openai', '')).toBe(false);
      expect(LLMClientFactory.isConfigured('anthropic', '')).toBe(false);
    });

    it('should return false for whitespace-only key', () => {
      expect(LLMClientFactory.isConfigured('openai', '   ')).toBe(false);
      expect(LLMClientFactory.isConfigured('anthropic', '  \t\n  ')).toBe(false);
    });
  });

  describe('validateApiKey', () => {
    describe('OpenAI keys', () => {
      it('should validate correct OpenAI key format', () => {
        expect(LLMClientFactory.validateApiKey('openai', 'sk-test-key-123')).toBe(true);
        expect(LLMClientFactory.validateApiKey('openai', 'sk-proj-abc123')).toBe(true);
        expect(LLMClientFactory.validateApiKey('openai', 'sk-1234567890')).toBe(true);
      });

      it('should reject OpenAI keys without sk- prefix', () => {
        expect(LLMClientFactory.validateApiKey('openai', 'test-key-123')).toBe(false);
        expect(LLMClientFactory.validateApiKey('openai', 'openai-key-123')).toBe(false);
        expect(LLMClientFactory.validateApiKey('openai', 'sk_test_key')).toBe(false);
      });

      it('should reject empty OpenAI keys', () => {
        expect(LLMClientFactory.validateApiKey('openai', '')).toBe(false);
        expect(LLMClientFactory.validateApiKey('openai', '   ')).toBe(false);
      });

      it('should reject Anthropic key format for OpenAI', () => {
        expect(LLMClientFactory.validateApiKey('openai', 'sk-ant-test-key')).toBe(false);
      });
    });

    describe('Anthropic keys', () => {
      it('should validate correct Anthropic key format', () => {
        expect(LLMClientFactory.validateApiKey('anthropic', 'sk-ant-test-key-123')).toBe(true);
        expect(LLMClientFactory.validateApiKey('anthropic', 'sk-ant-api03-abc123')).toBe(true);
        expect(LLMClientFactory.validateApiKey('anthropic', 'sk-ant-1234567890')).toBe(true);
      });

      it('should reject Anthropic keys without sk-ant- prefix', () => {
        expect(LLMClientFactory.validateApiKey('anthropic', 'test-key-123')).toBe(false);
        expect(LLMClientFactory.validateApiKey('anthropic', 'anthropic-key-123')).toBe(false);
        expect(LLMClientFactory.validateApiKey('anthropic', 'sk_ant_test_key')).toBe(false);
      });

      it('should reject empty Anthropic keys', () => {
        expect(LLMClientFactory.validateApiKey('anthropic', '')).toBe(false);
        expect(LLMClientFactory.validateApiKey('anthropic', '   ')).toBe(false);
      });

      it('should reject OpenAI key format for Anthropic', () => {
        expect(LLMClientFactory.validateApiKey('anthropic', 'sk-test-key')).toBe(false);
      });
    });

    describe('Edge cases', () => {
      it('should handle keys with special characters', () => {
        expect(LLMClientFactory.validateApiKey('openai', 'sk-test_key-123')).toBe(true);
        expect(LLMClientFactory.validateApiKey('anthropic', 'sk-ant-test_key-123')).toBe(true);
      });

      it('should handle very long keys', () => {
        const longOpenAIKey = 'sk-' + 'a'.repeat(100);
        const longAnthropicKey = 'sk-ant-' + 'a'.repeat(100);
        
        expect(LLMClientFactory.validateApiKey('openai', longOpenAIKey)).toBe(true);
        expect(LLMClientFactory.validateApiKey('anthropic', longAnthropicKey)).toBe(true);
      });

      it('should handle keys with only prefix', () => {
        expect(LLMClientFactory.validateApiKey('openai', 'sk-')).toBe(true);
        expect(LLMClientFactory.validateApiKey('anthropic', 'sk-ant-')).toBe(true);
      });

      it('should be case-sensitive', () => {
        expect(LLMClientFactory.validateApiKey('openai', 'SK-test-key')).toBe(false);
        expect(LLMClientFactory.validateApiKey('anthropic', 'SK-ANT-test-key')).toBe(false);
      });
    });
  });

  describe('LLMConfigurationError', () => {
    it('should create error with correct properties', () => {
      const error = new LLMConfigurationError('openai', 'Test error');

      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('LLMConfigurationError');
      expect(error.message).toBe('Test error');
      expect(error.provider).toBe('openai');
    });

    it('should be throwable and catchable', () => {
      expect(() => {
        throw new LLMConfigurationError('anthropic', 'Test');
      }).toThrow(LLMConfigurationError);

      try {
        throw new LLMConfigurationError('anthropic', 'Test');
      } catch (error) {
        expect(error).toBeInstanceOf(LLMConfigurationError);
        expect((error as LLMConfigurationError).provider).toBe('anthropic');
      }
    });
  });

  describe('Integration scenarios', () => {
    it('should validate before creating client', async () => {
      const validOpenAIKey = 'sk-test-key';
      const validAnthropicKey = 'sk-ant-test-key';

      // Valid keys should pass validation and create clients
      expect(LLMClientFactory.validateApiKey('openai', validOpenAIKey)).toBe(true);
      const openaiClient = await LLMClientFactory.createClient('openai', validOpenAIKey);
      expect(openaiClient).toBeDefined();

      expect(LLMClientFactory.validateApiKey('anthropic', validAnthropicKey)).toBe(true);
      const anthropicClient = await LLMClientFactory.createClient('anthropic', validAnthropicKey);
      expect(anthropicClient).toBeDefined();
    });

    it('should handle workflow: check configured -> validate -> create', async () => {
      const apiKey = 'sk-test-key';

      // Step 1: Check if configured
      const isConfigured = LLMClientFactory.isConfigured('openai', apiKey);
      expect(isConfigured).toBe(true);

      // Step 2: Validate format
      const isValid = LLMClientFactory.validateApiKey('openai', apiKey);
      expect(isValid).toBe(true);

      // Step 3: Create client
      const client = await LLMClientFactory.createClient('openai', apiKey);
      expect(client).toBeDefined();
    });

    it('should handle workflow with invalid key', async () => {
      const invalidKey = 'invalid-key';

      // Step 1: Check if configured (passes - key exists)
      const isConfigured = LLMClientFactory.isConfigured('openai', invalidKey);
      expect(isConfigured).toBe(true);

      // Step 2: Validate format (fails - wrong format)
      const isValid = LLMClientFactory.validateApiKey('openai', invalidKey);
      expect(isValid).toBe(false);

      // Step 3: Create client (succeeds - factory doesn't validate format)
      // Note: Factory only checks if key exists, not format
      const client = await LLMClientFactory.createClient('openai', invalidKey);
      expect(client).toBeDefined();
    });

    it('should handle workflow with missing key', async () => {
      // Step 1: Check if configured (fails)
      const isConfigured = LLMClientFactory.isConfigured('openai', undefined);
      expect(isConfigured).toBe(false);

      // Step 2: Skip validation (no key to validate)

      // Step 3: Create client (fails)
      try {
        await LLMClientFactory.createClient('openai', undefined);
        expect.fail('Should have thrown LLMConfigurationError');
      } catch (error) {
        expect(error).toBeInstanceOf(LLMConfigurationError);
      }
    });
  });
});
