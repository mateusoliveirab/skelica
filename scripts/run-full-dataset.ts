/**
 * Run Full Prompt Validation Dataset through Skelica analyzer
 * Usage: npx tsx scripts/run-full-dataset.ts
 */

import { getAnatomyParser } from '../frontend/src/core/anatomyParser';
import { Scorer } from '../frontend/src/core/scorer';

const prompts: Array<{ id: string; section: string; text: string; expectedScore: string }> = [
  // Section 1 — Structured
  { id: 'S1', section: '1', text: "hi so i was thinking, my company is growing and my boss said i need to do a presentation but i've never done one properly, can you help me? maybe like 10 slides? i don't know what you think?", expectedScore: 'D-F' },
  { id: 'S2', section: '1', text: "My daughter loves dinosaurs since she watched a Netflix documentary, she has ADHD so she needs something dynamic, but anyway can you write a story for her? It can be short.", expectedScore: 'D-F' },
  { id: 'S3', section: '1', text: "I want a text that's formal but casual, long but summarized, technical but easy for beginners, about AI, machine learning, ChatGPT, Claude and the future of tech. Not too long. But complete. For my LinkedIn.", expectedScore: 'D-F' },
  { id: 'S4', section: '1', text: "Help me write an email to a client who went silent. It needs to be polite but make it clear that I'm waiting for a response.", expectedScore: 'C' },
  { id: 'S5', section: '1', text: "Explain how compound interest works in a simple way. I'm 20 years old and never studied finance.", expectedScore: 'C' },
  { id: 'S6', section: '1', text: "Create a workout plan for weight loss. I have access to a gym and can train 4 times a week.", expectedScore: 'C' },
  { id: 'S7', section: '1', text: "You are a financial advisor. A 28-year-old wants to start investing with $500/month. Suggest 3 investment strategies explaining the risk level of each one.", expectedScore: 'B-C' },
  { id: 'S8', section: '1', text: "You are a UX writer. Write 5 onboarding microcopy messages for a personal finance app targeting millennials. Each message should be under 15 words, friendly in tone, and displayed on the first-use screen. Format: numbered list.", expectedScore: 'A-B' },
  { id: 'S9', section: '1', text: 'Rewrite the sentence below to sound more confident and direct, without using passive voice. Like this: "Mistakes were made" → "We made mistakes". Now rewrite: "The report was submitted late by the team."', expectedScore: 'A-B' },
  { id: 'S10', section: '1', text: "You are a nutritionist. Create a 5-day meal plan for a vegetarian woman, 35 years old, training 3x per week, with lactose intolerance. Each day must include breakfast, lunch, and dinner. No supplements. Format as a table: Day | Meal | Dish | Calories.", expectedScore: 'A-B' },
  // Section 2 — Perfect
  { id: 'P1', section: '2', text: `You are a senior email marketing copywriter. A SaaS company is launching a new AI-powered project management tool targeting small business owners with 5–20 employees who struggle with team organization. Write 3 subject lines for a promotional email campaign. Like this example — Feature: "Smart Deadlines" → Subject line: "Never miss a deadline again (your team will thank you)". Each subject line must be under 10 words, create urgency, and avoid spam trigger words like "free" or "guaranteed". Format: numbered list with the subject line followed by a one-sentence explanation of why it works.`, expectedScore: 'A' },
  { id: 'P2', section: '2', text: `You are an experienced product manager and UX researcher with 10+ years working at B2B SaaS companies.

## Context
A fintech startup is preparing to launch a mobile budgeting app for freelancers in the US market. The target audience is self-employed professionals aged 25–40, with irregular income, who have little financial literacy and no accountant. The app has three core features:
- Automatic income categorization
- Tax reserve calculator (US-based, self-employment tax)
- Monthly spending reports

## Your Task
Create a complete onboarding flow for first-time users of this app. The onboarding must guide the user from account creation to their first dashboard view.

For each onboarding step, follow this structure:
- Step name
- Goal of this step
- Main screen copy (title + subtitle)
- Primary CTA button text
- One microcopy tip shown below the CTA

## Example
Step: "Connect your bank"
Goal: Reduce manual input friction
Title: "See your money in one place"
Subtitle: "We use bank-level encryption. Your credentials are never stored."
CTA: "Connect securely"
Tip: "Takes less than 2 minutes. You can skip this and add manually later."

## Constraints
- Maximum 5 onboarding steps
- All copy must be written at a 6th-grade reading level
- No financial jargon (avoid: "ledger", "reconcile", "liability", "gross income")
- Tone: warm, encouraging, never patronizing
- Each CTA must be action-oriented and start with a verb
- Do not include a paywall or premium upsell during onboarding

## Output Format
Return each step as a clearly labeled block using the structure from the example above. After all steps, add a short section called "Onboarding Rationale" (3–5 sentences) explaining the key UX decisions made.`, expectedScore: 'A' },
  { id: 'P3', section: '2', text: `You are a senior content strategist with 8+ years of experience in digital health and wellness brands.

## Context
A mental health startup is launching a new feature inside their app called "Daily Check-in" — a 2-minute guided journaling prompt sent every morning via push notification. The feature is brand new and this is the first batch of content being created for it. The app already has 200k active users and an NPS of 72.

## Target Audience
Adults aged 22–38, living in urban areas, who experience mild to moderate anxiety and are already somewhat familiar with therapy or self-help concepts. They are busy, skeptical of overly positive language, and respond better to honesty and validation than to motivational clichés.

## Tone and Style
Warm but grounded. Never toxic-positive. Write like a trusted friend who has done therapy, not like a wellness influencer. Short sentences. No exclamation marks. Avoid words like: "journey", "thrive", "empower", "transform".

## Your Task
Write 5 daily check-in prompts for the app's morning push notification. Each prompt should make the user pause, reflect, and feel seen — not pressured to perform or feel a certain way.

## Example
Good prompt: "What's one thing you're quietly dreading today? Just naming it can help."
Bad prompt: "Start your day with gratitude! What are you thankful for this morning? 🌟"

The good example works because it acknowledges difficulty without forcing positivity. The bad example fails because it uses an exclamation mark, an emoji, and assumes the user is in a good headspace.

## Constraints
- Each prompt must be between 10 and 20 words
- No emojis
- No exclamation marks
- No yes/no questions — all prompts must invite open reflection
- Do not repeat the same opening word across the 5 prompts

## Output Format
Return a numbered list with 5 prompts. After the list, add a short section called "Why These Work" with one sentence per prompt explaining the psychological intention behind it.`, expectedScore: 'A' },
  // Section 3 — Human-style
  { id: 'H1', section: '3', text: `hey so i'm trying to write a bio for my linkedin profile. i'm a UX designer with about 4 years of experience, i've worked mostly with fintech and healthtech startups. i want it to sound professional but not robotic, like i'm a real person. please keep it under 150 words and don't start with "I am" because everyone does that. something like how my last bio started with a question and it got a lot of profile views. can you write one for me?`, expectedScore: 'B-C' },
  { id: 'H2', section: '3', text: `i run a small etsy shop selling handmade candles and i want to write better product descriptions. my candles are soy-based, hand-poured, and i use essential oils only — no synthetic fragrance. my customers are usually women 25–45 who care about clean ingredients and aesthetic packaging.

right now my descriptions are super boring, just like "lavender soy candle, 8oz, burns up to 50 hours." i want something that feels more lifestyle-y and makes people actually want to buy it. but not over the top, i hate when it sounds fake. can you rewrite that description as an example of what i'm going for? keep it under 80 words.`, expectedScore: 'B' },
  { id: 'H3', section: '3', text: `can you help me prep for a job interview? i'm interviewing for a senior account executive role at a B2B SaaS company that sells HR software. i have 6 years in sales, mostly in tech, and i'm really good at enterprise deals but i struggle with behavioral questions, they always catch me off guard.

give me 5 practice questions that are likely to come up, and for each one write me an example answer using my background. keep the answers concise, like something i could actually say in 90 seconds. don't make them sound scripted, i want to sound natural.`, expectedScore: 'B-C' },
  { id: 'H4', section: '3', text: `i'm a nurse and i want to start a newsletter about healthcare from an insider perspective. my audience would be other nurses and maybe nursing students who are burnt out and need someone to just be real with them about the industry.

i want the tone to be honest and a little dark-humored — not unprofessional, but not corporate wellness BS either. think like a venting session with a colleague after a long shift.

can you write the first edition intro paragraph? just one paragraph, maybe 100–120 words. something that makes people feel like "ok this person gets it" right away.`, expectedScore: 'B' },
  { id: 'H5', section: '3', text: `my team keeps missing deadlines and i need to send an email addressing it without sounding like i'm attacking anyone. we're a remote team of 8 people, pretty flat hierarchy, i'm the lead but not technically their manager.

the last time someone brought this up in a meeting it got awkward so i want to do it over email this time. i want it to be direct but not passive aggressive, and i want to end with a clear next step — like scheduling a quick 30 min sync to align on how we handle this going forward.

can you draft that email? subject line included.`, expectedScore: 'B' },
  { id: 'H6', section: '3', text: `i'm learning to cook and i want to make something impressive for a dinner party this weekend. there will be 6 people, one is vegetarian and one is allergic to nuts. i want to do a 3-course meal but i'm not super advanced so nothing too complicated. i have a normal home kitchen, no fancy equipment.

something like a bruschetta to start would be great — that's the kind of vibe i'm going for. can you suggest the full 3-course menu with one option per course? just the dish names and a one-line description of each, i'll ask for the recipes separately.`, expectedScore: 'B-C' },
  { id: 'H7', section: '3', text: `i'm applying for a UX research grant and i need to write a 200-word project summary. the research is about how elderly users (65+) interact with banking apps and where the biggest friction points are. the grant is from a nonprofit focused on digital inclusion.

i want the summary to sound serious and well-researched but still accessible — the reviewers aren't all designers or researchers, some are just nonprofit board members. avoid overly academic language.

here's my rough version that needs to be cleaned up and made more compelling:
"This project will study how old people use banking apps. We will interview users and find problems. Results will help designers make better apps."

can you rewrite it properly? 200 words max, no bullet points.`, expectedScore: 'A-B' },
  { id: 'H8', section: '3', text: `i need help writing a cold email to reach out to potential clients for my freelance graphic design business. i specialize in brand identity for food and beverage brands — logos, packaging, that kind of thing.

i want to reach out to small craft breweries because i think they really need better branding and they're underserved. the email should be short, i know nobody reads long cold emails. maybe 4–5 sentences max. don't make it sound desperate or like a template, it should feel personal even if i'm sending it to multiple people.

something like leading with a genuine compliment about their brand before pitching would be cool.`, expectedScore: 'B' },
  { id: 'H9', section: '3', text: `i'm a high school teacher and i want to explain the concept of compound interest to my 10th grade students in a way that actually makes sense to them. they're 15–16 years old, they don't care about retirement, and they zone out the second i say anything that sounds like school math.

i want to use an example they'd actually relate to — like something with sneakers or a social media account growing. can you write a short explanation i could read out loud in class? keep it under 2 minutes of speaking time, so roughly 250–300 words. no formulas, just the concept in plain english.`, expectedScore: 'B' },
  { id: 'H10', section: '3', text: `i just got promoted to manage a team for the first time and i want to set the right tone in my first 1:1 meetings with each person. i have 5 direct reports, all more experienced than me, and i'm a little nervous they won't take me seriously.

i don't want to come in too strong or make it about me — i want it to feel like i'm genuinely trying to understand them and what they need. i've seen managers do the whole "here are my expectations" thing in the first meeting and it always feels tone-deaf.

can you give me a list of 8 questions i should ask in that first 1:1? mix of professional and a bit more personal, nothing too invasive. just the questions, no explanations needed.`, expectedScore: 'A-B' },
  // Section 4 — Special cases
  { id: 'E1', section: '4', text: `I need to write a message to my team letting them know that our Friday meeting is being moved to Monday at 10am. We've been having these weekly syncs for a while and I want to make sure everyone shows up. Can you help me write something professional but not too formal? We're a pretty casual team.`, expectedScore: 'C' },
  { id: 'E2', section: '4', text: `write product descriptions for our new line of protein bars. our customers are fitness-focused adults. don't make it sound like every other supplement brand — we hate phrases like "fuel your gains" or "crush your goals". also no all-caps words, no exclamation marks, and nothing that sounds like it was written by a gym bro. the descriptions should go on our shopify product pages, so keep each one between 60 and 80 words.`, expectedScore: 'B' },
];

const parser = getAnatomyParser();
const scorer = new Scorer();
const components = ['role', 'context', 'instruction', 'example', 'constraint', 'format', 'audience', 'tone'] as const;

function run(p: typeof prompts[0]) {
  const anatomy = parser.parse(p.text);
  const scoreResult = scorer.score(p.text);
  const detected = new Set(anatomy.components.map((c) => c.componentType));
  return {
    ...p,
    score: scoreResult.overall.score,
    grade: scoreResult.overall.grade,
    detected: Object.fromEntries(components.map((c) => [c, detected.has(c)])),
  };
}

console.log('\n=== FULL PROMPT VALIDATION DATASET ===\n');
console.log('Format: ID | Score | Grade | role|ctx|inst|ex|con|fmt|aud|tone | Expected\n');

const results = prompts.map(run);
let prevSection = '';
for (const r of results) {
  if (r.section !== prevSection) {
    prevSection = r.section;
    const labels: Record<string, string> = { '1': 'Section 1 — Structured', '2': 'Section 2 — Perfect', '3': 'Section 3 — Human-style', '4': 'Section 4 — Special' };
    console.log(`\n--- ${labels[r.section]} ---\n`);
  }
  const det = components.map((c) => (r.detected[c] ? '✓' : '-')).join('');
  console.log(`${r.id.padEnd(4)} | ${r.score.toFixed(3)} | ${r.grade?.padEnd(2) ?? '-'} | ${det} | ${r.expectedScore}`);
}

// Summary by section
console.log('\n\n=== SUMMARY ===\n');
const bySection: Record<string, typeof results> = {};
for (const r of results) {
  if (!bySection[r.section]) bySection[r.section] = [];
  bySection[r.section].push(r);
}
for (const [sec, list] of Object.entries(bySection)) {
  const avg = list.reduce((a, x) => a + x.score, 0) / list.length;
  const labels: Record<string, string> = { '1': 'Section 1', '2': 'Section 2', '3': 'Section 3', '4': 'Section 4' };
  console.log(`${labels[sec]}: ${list.length} prompts, avg score ${(avg * 100).toFixed(1)}%`);
}
