# LLM Integration

This directory contains direct integrations with LLM provider APIs:

- `openaiClient.ts` - OpenAI API client for prompt optimization
- `anthropicClient.ts` - Anthropic API client for prompt optimization
- `factory.ts` - Factory for instantiating the correct LLM client
- `base.ts` - Base interfaces and types for LLM clients

These clients communicate directly with LLM APIs from the browser using user-provided API keys.
