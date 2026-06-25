import type { Template } from '../api/types';

/**
 * Professional prompt templates organized by category
 * Ported from backend/app/api/routes.py
 */
export const templates: Template[] = [
  {
    id: 'tpl_software_engineer',
    name: 'Software Engineer',
    category: 'coding',
    description: 'Expert code generation and review template',
    template: 'You are a senior software engineer with 10+ years of experience in {language}. {task}\n\nConstraints:\n- {constraints}\n\nOutput format: {format}',
    components: ['role', 'instruction', 'constraint', 'output_format'],
    use_cases: ['Code generation', 'Code review', 'Debugging']
  },
  {
    id: 'tpl_data_analyst',
    name: 'Data Analyst',
    category: 'analysis',
    description: 'Data analysis and visualization template',
    template: 'You are an expert data analyst. Analyze the following data: {data}\n\nProvide insights in {format} format.',
    components: ['role', 'context', 'output_format'],
    use_cases: ['Data analysis', 'Report generation', 'Insights extraction']
  },
  {
    id: 'tpl_technical_writer',
    name: 'Technical Writer',
    category: 'writing',
    description: 'Documentation and technical writing template',
    template: 'You are a technical writer specializing in {domain}. Write documentation for: {topic}\n\nAudience: {audience}\n\nFormat: {format}',
    components: ['role', 'context', 'audience', 'output_format'],
    use_cases: ['Documentation', 'API guides', 'Tutorials']
  },
  {
    id: 'tpl_product_manager',
    name: 'Product Manager',
    category: 'business',
    description: 'Product strategy and analysis template',
    template: 'You are a product manager at a {company_type}. {task}\n\nConsider: {factors}\n\nDeliverable: {deliverable}',
    components: ['role', 'context', 'instruction'],
    use_cases: ['PRD writing', 'Feature analysis', 'Roadmap planning']
  }
];

/**
 * Get all available template categories
 */
export function getTemplateCategories(): string[] {
  return Array.from(new Set(templates.map(t => t.category)));
}

/**
 * Filter templates by category
 */
export function getTemplatesByCategory(category: string): Template[] {
  return templates.filter(t => t.category === category);
}

/**
 * Search templates by name or description
 */
export function searchTemplates(query: string): Template[] {
  const searchLower = query.toLowerCase();
  return templates.filter(t => 
    t.name.toLowerCase().includes(searchLower) || 
    t.description.toLowerCase().includes(searchLower)
  );
}

/**
 * Get template by ID
 */
export function getTemplateById(id: string): Template | undefined {
  return templates.find(t => t.id === id);
}
