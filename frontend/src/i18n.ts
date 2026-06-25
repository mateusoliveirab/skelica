// Unified English baseline for Skelica
export type Translations = Record<string, string>;

const EN: Translations = {
  // General navigation
  home: "Home",
  about: "About",
  view_component_details: "View component details",
  hero_subtitle: "Skelica dissects your prompts to reveal what's strong and what needs sharpening.",
  anatomy_header: "Prompt Anatomy",
  prompt_anatomy: "Prompt Anatomy",
  get_started: "Get Started",
  back: "Back",
  try_now: "Try Now",
  about_headline: "Prompts excellence is the difference between magic and mediocrity",

  // Components & UI
  components_detected: "components detected",
  loading_model: "Loading semantic intelligence...",
  first_load_notice: "This happens only the first time and makes the analysis much more precise.",
  settings: "Settings",
  anatomy_section_title: "Anatomy",
  enter_prompt_notice: "Enter a prompt to see its anatomy...",
  component_checklist_title: "Component Checklist",
  negative_constraint_title: "Negative Constraints (Don'ts)",
  anatomy_coverage: "Anatomy Coverage",

  // Benefits
  benefit_precision_title: "Surgical Precision",
  benefit_precision_desc: "Identify exactly what’s missing to get 3x better AI responses.",
  benefit_token_title: "Token Efficiency",
  benefit_token_desc: "No more wasted tokens on vague instructions. Every word counts.",
  benefit_clarity_title: "Clarity of Task",
  benefit_clarity_desc: "Understand prompt anatomy and develop prompt-engineering intuition.",
  benefit_results_title: "Immediate Results",
  benefit_results_desc: "Optimize prompts and see instant improvements in AI outcomes.",

  // FAQ
  faq_title: "FAQ",
  faq_question_0: "How does it work?",
  faq_answer_0: "Paste your prompt and Skelica analyzes its structure — identifying role definition, context, constraints, examples, and formatting.",
  faq_question_1: "What makes a good prompt?",
  faq_answer_1: "Clear intent, sufficient context, clearly defined constraints, and defined output expectations. Skelica detects these elements and shows where your prompt needs sharpening.",
  faq_question_2: "Are my data private?",
  faq_answer_2: "Your prompts are analyzed in real-time and are not stored or used to train models. Your content stays private.",
  faq_question_3: "Who is this for?",
  faq_answer_3: "Anyone using AI — developers, marketers, writers, researchers, students, business analysts.",
  faq_question_4: "How accurate is the scoring?",
  faq_answer_4: "The scoring engine reflects patterns learned from high-performance prompts. It’s data-driven; not magic.",
  faq_question_5: "Can I optimize my prompts?",
  faq_answer_5: "Yes. Skelica suggests concrete improvements; add context, clarify instructions, tighten constraints.",
  faq_question_6: "What components does it detect?",
  faq_answer_6: "Role, task clarity, context depth, constraints, examples, formatting, tone, and refinement hooks.",
  faq_question_7: "Is it free?",
  faq_answer_7: "A generous free tier; upgrades unlock more features.",

  // PromptInput component
  prompt_placeholder: "Paste your prompt here to analyze its anatomy...",
  characters: "characters",
  copied: "Copied!",
  copy: "Copy",
  analyze: "Analyze",
  analyzing: "Analyzing...",
  press_enter_to_analyze: "Press Enter to analyze",

  // ScoreCard component
  recommendations: "Recommendations",
  score_excellent: "Excellent",
  score_good: "Good",
  score_fair: "Fair",
  score_poor: "Needs improvement",
  quality_score: "Quality Score",
  dimensions: "dimensions",
  improvements: "improvements",

  // AIButtons component
  missing_components_intro: "Based on Skelica analysis, this prompt is missing the following components:",
  open_claude: "Open Claude",
  open_chatgpt: "Open ChatGPT",
  copy_prompt: "Copy prompt",

  // Error Boundary
  error_boundary_title: "Something went wrong",
  error_boundary_message: "An unexpected error occurred in the application structure.",
  error_boundary_retry: "Try again"
};

// Force English as per user request to unify the project
export function setLocale(_locale: string) { /* Ignore locale changes for now */ }
export function getLocale() { return 'en'; }

export function t(key: string): string {
  return EN[key] ?? key;
}
