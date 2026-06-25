import type { PromptComponent } from '../api/types';

/**
 * Component information interface
 */
export interface ComponentInfo {
  id: PromptComponent;
  name: string;
  description: string;
  importance: number;
  best_practices: string[];
  examples: string[];
}

/**
 * Detailed information about each prompt anatomy component
 * Ported from backend/app/api/routes.py
 */
export const componentInfo: ComponentInfo[] = [
  {
    id: 'role',
    name: 'Role Definition',
    description: 'Defines who the AI should act as',
    importance: 0.9,
    best_practices: [
      'Be specific about expertise level',
      'Include relevant domain'
    ],
    examples: [
      'You are a senior Python developer',
      'Act as a marketing strategist'
    ]
  },
  {
    id: 'context',
    name: 'Context',
    description: 'Background information for the task',
    importance: 0.8,
    best_practices: [
      'Provide relevant background',
      'Include constraints early'
    ],
    examples: [
      'Given that we\'re building a healthcare app...',
      'In the context of a startup...'
    ]
  },
  {
    id: 'instruction',
    name: 'Instruction',
    description: 'The main task to perform',
    importance: 1.0,
    best_practices: [
      'Be specific and actionable',
      'Use clear verbs'
    ],
    examples: [
      'Write a function that...',
      'Analyze the following data...'
    ]
  },
  {
    id: 'example',
    name: 'Examples',
    description: 'Sample inputs and outputs',
    importance: 0.6,
    best_practices: [
      'Provide 2-3 examples',
      'Show edge cases'
    ],
    examples: [
      'Example input: [1,2,3] -> Output: [3,2,1]'
    ]
  },
  {
    id: 'constraint',
    name: 'Constraints',
    description: 'Limitations and boundaries',
    importance: 0.7,
    best_practices: [
      'Be explicit about what NOT to do',
      'Set clear limits'
    ],
    examples: [
      'Do not use external libraries',
      'Limit to 500 words'
    ]
  },
  {
    id: 'output_format',
    name: 'Output Format',
    description: 'Expected output structure',
    importance: 0.8,
    best_practices: [
      'Specify exact format',
      'Include structure requirements'
    ],
    examples: [
      'Output as JSON',
      'Format as markdown table'
    ]
  },
  {
    id: 'audience',
    name: 'Target Audience',
    description: 'Who the output is intended for',
    importance: 0.6,
    best_practices: [
      'Specify expertise level',
      'Consider audience needs'
    ],
    examples: [
      'For beginners with no coding experience',
      'For technical stakeholders'
    ]
  },
  {
    id: 'tone',
    name: 'Tone/Style',
    description: 'The communication style to use',
    importance: 0.5,
    best_practices: [
      'Match tone to audience',
      'Be consistent throughout'
    ],
    examples: [
      'Use a professional and formal tone',
      'Write in a casual, friendly manner'
    ]
  }
];

/**
 * Get component info by ID
 */
export function getComponentInfo(id: PromptComponent): ComponentInfo | undefined {
  return componentInfo.find(c => c.id === id);
}

/**
 * Get all component IDs
 */
export function getAllComponentIds(): PromptComponent[] {
  return componentInfo.map(c => c.id);
}

/**
 * Get components sorted by importance
 */
export function getComponentsByImportance(): ComponentInfo[] {
  return [...componentInfo].sort((a, b) => b.importance - a.importance);
}
