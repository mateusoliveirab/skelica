export type PromptComponent = 
  | 'role' 
  | 'context' 
  | 'instruction' 
  | 'example' 
  | 'constraint' 
  | 'negative_constraint'
  | 'output_format' 
  | 'audience' 
  | 'tone';

export interface ComponentPresence {
  present: boolean;
  content: string | null;
  quality_score: number;
  suggestions?: string[];
  start?: number;
  end?: number;
}

export interface AnalysisResult {
  component: PromptComponent;
  presence: ComponentPresence;
  importance: number;
  description: string;
  start?: number;
  end?: number;
}

export interface AnalyzeResponse {
  prompt: string;
  components: AnalysisResult[];
  overall_score: number;
  summary: string;
  created_at: string;
}

export interface ComponentScore {
  component: PromptComponent;
  score: number;
  weight: number;
  weighted_score: number;
}

export interface ScoreResponse {
  prompt: string;
  overall_score: number;
  component_scores: ComponentScore[] | null;
  grade: string;
  recommendations: string;
}

export interface Template {
  id: string;
  name: string;
  category: string;
  description: string;
  template: string;
  components: PromptComponent[];
  use_cases: string[];
}

export interface TemplatesResponse {
  templates: Template[];
  total: number;
  categories: string[];
}

export interface OptimizeResponse {
  original_prompt: string;
  optimized_prompt: string;
  improvements: string[];
  components_added: PromptComponent[];
  provider_used: string;
}

export const COMPONENT_COLORS: Record<PromptComponent, string> = {
  role: '#3B82F6',
  context: '#8B5CF6',
  instruction: '#F97316',
  example: '#22C55E',
  constraint: '#EF4444',
  negative_constraint: '#B91C1C', // Darker Red for "Don'ts"
  output_format: '#06B6D4',
  audience: '#EC4899',
  tone: '#F59E0B',
};

export const COMPONENT_LABELS: Record<PromptComponent, string> = {
  role: 'Role / Persona',
  context: 'Context',
  instruction: 'Instruction',
  example: 'Examples',
  constraint: 'Constraints',
  negative_constraint: 'Negative Constraints',
  output_format: 'Output Format',
  audience: 'Target Audience',
  tone: 'Tone / Style',
};

export const COMPONENT_DESCRIPTIONS: Record<PromptComponent, string> = {
  role: 'Defines who the AI should act as (e.g., "You are a UX expert"). This sets the expertise and vocabulary.',
  context: 'Provides background and current scenario (e.g., "We are launching a new app"). Helps the AI understand the "why".',
  instruction: 'The direct command of what must be done (e.g., "Write an email"). It is the heart of the prompt.',
  example: 'Demonstrates the expected response pattern. Drastically reduces AI ambiguity and errors.',
  constraint: 'Rules and limits the AI must respect (e.g., "Must be under 200 words").',
  negative_constraint: 'Explicitly defines what the AI should NOT do (e.g., "Do not use jargon", "Avoid mentioning competitors").',
  output_format: 'Determines how the response should be organized visually (e.g., "Table", "JSON", "Markdown").',
  audience: 'Identifies who the response is being written for, adjusting technical complexity.',
  tone: 'Defines the emotional style and voice of the writing (e.g., "Formal tone", "Enthusiastic", "Persuasive").',
};
