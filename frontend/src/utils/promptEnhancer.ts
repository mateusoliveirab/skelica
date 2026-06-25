// Simple Prompt V2 enhancer: adds lightweight guidance to improve prompts for multi-LLM experiences
// This is intentionally lightweight and safe for client-side use.

export const RECOMMENDATIONS: string[] = [
  'Tom: direto, objetivo, útil.',
  'Formato: use bullets quando apropriado; inclua seções (Resumo, Instruções, Perguntas).',
  'Clareza: peça esclarecimentos se o prompt for ambíguo.',
  'Comprimento: mantenha o prompt final entre ~60-200 palavras para respostas rápidas.',
  'Privacidade: não inclua dados sensíveis ou PII no prompt.',
  'Estilo: ajuste o tom conforme o público (técnico, neutro, educacional).'
];

export function enhancePromptV2(basePrompt: string): string {
  const header = 'PROMPT V2 — diretrizes rápidas:';
  const guidance = RECOMMENDATIONS.map((r) => `- ${r}`).join('\n');
  // Estrutura simples que não modifica o conteúdo original do prompt, apenas anexa instruções
  return `${header}\n${guidance}\n\nPrompt original:\n${basePrompt}`;
}
