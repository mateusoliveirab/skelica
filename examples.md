# Skelica — Full Prompt Validation Dataset

## Purpose
This document contains all test prompts generated for Skelica validation,
organized by category. A validation agent should run each prompt through
the analyzer and compare the detected components against the expected values.

---

## Component Legend

| Component | Description |
|---|---|
| `Role Definition` | Explicit role or persona assigned to the AI |
| `Context` | Background information relevant to the task |
| `Instruction` | The main task or action requested |
| `Examples` | One or more input/output examples provided |
| `Constraints` | Rules, limits, or restrictions on the output |
| `Output Format` | Explicit or strongly implied output structure |
| `Target Audience` | Explicit description of who the output is for |
| `Tone / Style` | Voice, style, or communication register specified |

**Status values:** `✅ present` · `⚠️ partial/ambiguous` · `❌ absent`

---

## Section 1 — Structured Prompts (Bad / Medium / Good)

*Formal prompts written with deliberate quality variation. 6 components evaluated.*

---

### Prompt S1 — BAD

```
hi so i was thinking, my company is growing and my boss said i need to do a
presentation but i've never done one properly, can you help me? maybe like
10 slides? i don't know what you think?
```

| Component | Expected | Notes |
|---|---|---|
| Role Definition | ❌ | |
| Context | ⚠️ | "company is growing" — vague, barely qualifies |
| Instruction | ⚠️ | "help me" — buried, no specifics |
| Examples | ❌ | |
| Constraints | ❌ | |
| Output Format | ❌ | "10 slides" mentioned but unstructured |

**Expected Score Range:** D–F (0–30)

---

### Prompt S2 — BAD

```
My daughter loves dinosaurs since she watched a Netflix documentary, she has
ADHD so she needs something dynamic, but anyway can you write a story for her?
It can be short.
```

| Component | Expected | Notes |
|---|---|---|
| Role Definition | ❌ | |
| Context | ⚠️ | Personal context, not task-relevant |
| Instruction | ✅ | "write a story" |
| Examples | ❌ | |
| Constraints | ⚠️ | "short" and "dynamic" — too vague to score fully |
| Output Format | ❌ | |

**Expected Score Range:** D–F (0–30)

---

### Prompt S3 — BAD

```
I want a text that's formal but casual, long but summarized, technical but easy
for beginners, about AI, machine learning, ChatGPT, Claude and the future of tech.
Not too long. But complete. For my LinkedIn.
```

| Component | Expected | Notes |
|---|---|---|
| Role Definition | ❌ | |
| Context | ⚠️ | "LinkedIn" provides minimal context |
| Instruction | ✅ | Present but self-contradictory |
| Examples | ❌ | |
| Constraints | ⚠️ | Contradictory — should penalize score |
| Output Format | ❌ | |

**Expected Score Range:** D–F (0–30)

---

### Prompt S4 — MEDIUM

```
Help me write an email to a client who went silent. It needs to be polite but
make it clear that I'm waiting for a response.
```

| Component | Expected | Notes |
|---|---|---|
| Role Definition | ❌ | |
| Context | ✅ | "client who went silent" |
| Instruction | ✅ | "write an email" |
| Examples | ❌ | |
| Constraints | ✅ | "polite", "waiting for response" |
| Output Format | ❌ | No length, tone level, or structure defined |

**Expected Score Range:** C (40–60)

---

### Prompt S5 — MEDIUM

```
Explain how compound interest works in a simple way. I'm 20 years old and
never studied finance.
```

| Component | Expected | Notes |
|---|---|---|
| Role Definition | ❌ | |
| Context | ✅ | Age and background provided |
| Instruction | ✅ | "explain how compound interest works" |
| Examples | ❌ | |
| Constraints | ✅ | "simple way" |
| Output Format | ❌ | |

**Expected Score Range:** C (40–60)

---

### Prompt S6 — MEDIUM

```
Create a workout plan for weight loss. I have access to a gym and can train
4 times a week.
```

| Component | Expected | Notes |
|---|---|---|
| Role Definition | ❌ | |
| Context | ✅ | Gym access, 4x/week |
| Instruction | ✅ | "create a workout plan" |
| Examples | ❌ | |
| Constraints | ⚠️ | Frequency only — no duration or fitness level |
| Output Format | ❌ | |

**Expected Score Range:** C (40–60)

---

### Prompt S7 — MEDIUM/GOOD

```
You are a financial advisor. A 28-year-old wants to start investing with
$500/month. Suggest 3 investment strategies explaining the risk level of each one.
```

| Component | Expected | Notes |
|---|---|---|
| Role Definition | ✅ | "financial advisor" |
| Context | ✅ | Age and monthly budget defined |
| Instruction | ✅ | "suggest 3 strategies" |
| Examples | ❌ | |
| Constraints | ✅ | "$500/month", "3 strategies", "risk level" |
| Output Format | ⚠️ | Implicit — list or table not specified |

**Expected Score Range:** B–C (55–70)

---

### Prompt S8 — GOOD

```
You are a UX writer. Write 5 onboarding microcopy messages for a personal finance
app targeting millennials. Each message should be under 15 words, friendly in tone,
and displayed on the first-use screen. Format: numbered list.
```

| Component | Expected | Notes |
|---|---|---|
| Role Definition | ✅ | "UX writer" |
| Context | ✅ | "personal finance app, millennials, first-use screen" |
| Instruction | ✅ | "write 5 onboarding microcopy messages" |
| Examples | ❌ | Only missing component |
| Constraints | ✅ | "under 15 words, friendly tone" |
| Output Format | ✅ | "numbered list" |

**Expected Score Range:** A–B (75–90)

---

### Prompt S9 — GOOD

```
Rewrite the sentence below to sound more confident and direct, without using
passive voice. Like this: "Mistakes were made" → "We made mistakes". Now rewrite:
"The report was submitted late by the team."
```

| Component | Expected | Notes |
|---|---|---|
| Role Definition | ❌ | Not needed for this task type |
| Context | ❌ | |
| Instruction | ✅ | "rewrite to sound more confident and direct" |
| Examples | ✅ | Clear before/after pattern |
| Constraints | ✅ | "no passive voice" |
| Output Format | ✅ | Strongly implied by example pattern |

**Expected Score Range:** A–B (75–90)

---

### Prompt S10 — GOOD

```
You are a nutritionist. Create a 5-day meal plan for a vegetarian woman, 35 years
old, training 3x per week, with lactose intolerance. Each day must include
breakfast, lunch, and dinner. No supplements. Format as a table:
Day | Meal | Dish | Calories.
```

| Component | Expected | Notes |
|---|---|---|
| Role Definition | ✅ | "nutritionist" |
| Context | ✅ | Age, diet type, training frequency, intolerance |
| Instruction | ✅ | "create a 5-day meal plan" |
| Examples | ❌ | Only missing component |
| Constraints | ✅ | "no supplements", "3 meals/day", "5 days" |
| Output Format | ✅ | Explicit table with defined columns |

**Expected Score Range:** A–B (75–90)

---

## Section 2 — Perfect Score Prompts (100%)

*Prompts designed to score A/100. All components present and unambiguous.*

---

### Prompt P1 — PERFECT (6 components)

```
You are a senior email marketing copywriter. A SaaS company is launching a new
AI-powered project management tool targeting small business owners with 5–20
employees who struggle with team organization. Write 3 subject lines for a
promotional email campaign. Like this example — Feature: "Smart Deadlines" →
Subject line: "Never miss a deadline again (your team will thank you)". Each
subject line must be under 10 words, create urgency, and avoid spam trigger
words like "free" or "guaranteed". Format: numbered list with the subject line
followed by a one-sentence explanation of why it works.
```

| Component | Expected | Notes |
|---|---|---|
| Role Definition | ✅ | "senior email marketing copywriter" |
| Context | ✅ | SaaS, AI tool, small business owners, 5–20 employees |
| Instruction | ✅ | "write 3 subject lines for a promotional email campaign" |
| Examples | ✅ | Feature → Subject line format demonstrated |
| Constraints | ✅ | under 10 words, urgency, no "free"/"guaranteed" |
| Output Format | ✅ | numbered list + one-sentence explanation per item |

**Expected Score Range:** A (95–100)

---

### Prompt P2 — PERFECT (complex, with markdown structure)

```
You are an experienced product manager and UX researcher with 10+ years working
at B2B SaaS companies.

## Context
A fintech startup is preparing to launch a mobile budgeting app for freelancers
in the US market. The target audience is self-employed professionals aged 25–40,
with irregular income, who have little financial literacy and no accountant.
The app has three core features:
- Automatic income categorization
- Tax reserve calculator (US-based, self-employment tax)
- Monthly spending reports

## Your Task
Create a complete onboarding flow for first-time users of this app. The onboarding
must guide the user from account creation to their first dashboard view.

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
Return each step as a clearly labeled block using the structure from the example above.
After all steps, add a short section called "Onboarding Rationale" (3–5 sentences)
explaining the key UX decisions made.
```

| Component | Expected | Notes |
|---|---|---|
| Role Definition | ✅ | "PM and UX researcher, 10+ years, B2B SaaS" |
| Context | ✅ | Fintech, freelancers US, irregular income, 3 features listed |
| Instruction | ✅ | "create a complete onboarding flow" with sub-structure |
| Examples | ✅ | Full step example with all subfields populated |
| Constraints | ✅ | 5 steps max, reading level, jargon list, CTA rule, no paywall |
| Output Format | ✅ | Labeled blocks + "Onboarding Rationale" section |

**Expected Score Range:** A (95–100)

**Additional parsing edge cases to validate:**
- `##` headers inside prompt body — does the parser handle markdown structure?
- Bullet lists as part of Context — treated as context or output format?
- Nested sub-instructions — does the main Instruction get lost?
- Long structured example — is Examples detected even without the word "example" in the main sentence?

---

### Prompt P3 — PERFECT (8 components, natural variation)

```
You are a senior content strategist with 8+ years of experience in digital health
and wellness brands.

## Context
A mental health startup is launching a new feature inside their app called
"Daily Check-in" — a 2-minute guided journaling prompt sent every morning via
push notification. The feature is brand new and this is the first batch of
content being created for it. The app already has 200k active users and an NPS of 72.

## Target Audience
Adults aged 22–38, living in urban areas, who experience mild to moderate anxiety
and are already somewhat familiar with therapy or self-help concepts. They are busy,
skeptical of overly positive language, and respond better to honesty and validation
than to motivational clichés.

## Tone and Style
Warm but grounded. Never toxic-positive. Write like a trusted friend who has done
therapy, not like a wellness influencer. Short sentences. No exclamation marks.
Avoid words like: "journey", "thrive", "empower", "transform".

## Your Task
Write 5 daily check-in prompts for the app's morning push notification. Each prompt
should make the user pause, reflect, and feel seen — not pressured to perform or
feel a certain way.

## Example
Good prompt: "What's one thing you're quietly dreading today? Just naming it can help."
Bad prompt: "Start your day with gratitude! What are you thankful for this morning? 🌟"

The good example works because it acknowledges difficulty without forcing positivity.
The bad example fails because it uses an exclamation mark, an emoji, and assumes
the user is in a good headspace.

## Constraints
- Each prompt must be between 10 and 20 words
- No emojis
- No exclamation marks
- No yes/no questions — all prompts must invite open reflection
- Do not repeat the same opening word across the 5 prompts

## Output Format
Return a numbered list with 5 prompts. After the list, add a short section called
"Why These Work" with one sentence per prompt explaining the psychological
intention behind it.
```

| Component | Expected | Notes |
|---|---|---|
| Role Definition | ✅ | "senior content strategist, 8+ years, digital health/wellness" |
| Context | ✅ | Mental health app, new feature, 200k users, NPS 72 |
| Target Audience | ✅ | Age, location, anxiety level, skeptical of toxic positivity |
| Tone / Style | ✅ | "warm but grounded", word ban list, voice reference |
| Instruction | ✅ | "write 5 daily check-in prompts" with emotional goal |
| Examples | ✅ | Good and bad example with explicit reasoning for each |
| Constraints | ✅ | Word count, no emoji, no exclamation, question type, no repeated opener |
| Output Format | ✅ | Numbered list + "Why These Work" section |

**Expected Score Range:** A (95–100)

---

## Section 3 — Human-Style Prompts (Real User Simulation)

*Written as a real user would type. Components are implicit and must be inferred
from natural language. 8 components evaluated.*

---

### Prompt H1 — LinkedIn Bio (6 components)

```
hey so i'm trying to write a bio for my linkedin profile. i'm a UX designer
with about 4 years of experience, i've worked mostly with fintech and healthtech
startups. i want it to sound professional but not robotic, like i'm a real person.
please keep it under 150 words and don't start with "I am" because everyone does that.
something like how my last bio started with a question and it got a lot of profile views.
can you write one for me?
```

| Component | Expected | Notes |
|---|---|---|
| Role Definition | ✅ | "UX designer, 4 years, fintech and healthtech" |
| Context | ✅ | LinkedIn bio, previous question-opener performed well |
| Target Audience | ❌ | |
| Tone / Style | ✅ | "professional but not robotic, real person" |
| Instruction | ✅ | "write a bio for my linkedin" |
| Examples | ⚠️ | Mentions question format but doesn't show one |
| Constraints | ✅ | under 150 words, don't start with "I am" |
| Output Format | ❌ | |

**Components covered: 6 · Expected Score Range:** B–C (55–72)

---

### Prompt H2 — Etsy Candle Description (7 components)

```
i run a small etsy shop selling handmade candles and i want to write better
product descriptions. my candles are soy-based, hand-poured, and i use essential
oils only — no synthetic fragrance. my customers are usually women 25–45 who care
about clean ingredients and aesthetic packaging.

right now my descriptions are super boring, just like "lavender soy candle, 8oz,
burns up to 50 hours." i want something that feels more lifestyle-y and makes people
actually want to buy it. but not over the top, i hate when it sounds fake. can you
rewrite that description as an example of what i'm going for? keep it under 80 words.
```

| Component | Expected | Notes |
|---|---|---|
| Role Definition | ⚠️ | "i run a small etsy shop" — implied |
| Context | ✅ | Soy candles, essential oils, Etsy shop |
| Target Audience | ✅ | Women 25–45, clean ingredients, aesthetic |
| Tone / Style | ✅ | "lifestyle-y, not fake, not over the top" |
| Instruction | ✅ | "rewrite that description" |
| Examples | ✅ | Current bad description provided |
| Constraints | ✅ | Under 80 words |
| Output Format | ❌ | |

**Components covered: 7 · Expected Score Range:** B (65–78)

---

### Prompt H3 — Job Interview Prep (6 components)

```
can you help me prep for a job interview? i'm interviewing for a senior account
executive role at a B2B SaaS company that sells HR software. i have 6 years in
sales, mostly in tech, and i'm really good at enterprise deals but i struggle with
behavioral questions, they always catch me off guard.

give me 5 practice questions that are likely to come up, and for each one write me
an example answer using my background. keep the answers concise, like something i
could actually say in 90 seconds. don't make them sound scripted, i want to sound natural.
```

| Component | Expected | Notes |
|---|---|---|
| Role Definition | ✅ | "senior AE, B2B SaaS, HR software, 6 years in sales" |
| Context | ✅ | Strong in enterprise, weak in behavioral questions |
| Target Audience | ❌ | |
| Tone / Style | ✅ | "natural, not scripted" |
| Instruction | ✅ | "give me 5 practice questions with example answers" |
| Examples | ❌ | |
| Constraints | ✅ | 90 seconds, concise |
| Output Format | ✅ | 5 questions each with an example answer |

**Components covered: 6 · Expected Score Range:** B–C (60–74)

---

### Prompt H4 — Nurse Newsletter (7 components)

```
i'm a nurse and i want to start a newsletter about healthcare from an insider
perspective. my audience would be other nurses and maybe nursing students who are
burnt out and need someone to just be real with them about the industry.

i want the tone to be honest and a little dark-humored — not unprofessional, but
not corporate wellness BS either. think like a venting session with a colleague
after a long shift.

can you write the first edition intro paragraph? just one paragraph, maybe
100–120 words. something that makes people feel like "ok this person gets it"
right away.
```

| Component | Expected | Notes |
|---|---|---|
| Role Definition | ✅ | "i'm a nurse" |
| Context | ✅ | Newsletter, insider perspective, healthcare |
| Target Audience | ✅ | Nurses and nursing students, burnt out |
| Tone / Style | ✅ | "honest, dark-humored, not corporate, like venting with a colleague" |
| Instruction | ✅ | "write the first edition intro paragraph" |
| Examples | ❌ | |
| Constraints | ✅ | One paragraph, 100–120 words |
| Output Format | ✅ | One paragraph only |

**Components covered: 7 · Expected Score Range:** B (68–80)

---

### Prompt H5 — Team Deadline Email (7 components)

```
my team keeps missing deadlines and i need to send an email addressing it without
sounding like i'm attacking anyone. we're a remote team of 8 people, pretty flat
hierarchy, i'm the lead but not technically their manager.

the last time someone brought this up in a meeting it got awkward so i want to do
it over email this time. i want it to be direct but not passive aggressive, and i
want to end with a clear next step — like scheduling a quick 30 min sync to align
on how we handle this going forward.

can you draft that email? subject line included.
```

| Component | Expected | Notes |
|---|---|---|
| Role Definition | ✅ | "team lead, not technically manager" |
| Context | ✅ | Remote team, 8 people, flat hierarchy, previous meeting went awkward |
| Target Audience | ✅ | Team members missing deadlines |
| Tone / Style | ✅ | "direct but not passive aggressive" |
| Instruction | ✅ | "draft that email" |
| Examples | ❌ | |
| Constraints | ✅ | End with specific next step (30min sync) |
| Output Format | ✅ | Subject line + email body |

**Components covered: 7 · Expected Score Range:** B (68–80)

---

### Prompt H6 — Dinner Party Menu (6 components)

```
i'm learning to cook and i want to make something impressive for a dinner party
this weekend. there will be 6 people, one is vegetarian and one is allergic to nuts.
i want to do a 3-course meal but i'm not super advanced so nothing too complicated.
i have a normal home kitchen, no fancy equipment.

something like a bruschetta to start would be great — that's the kind of vibe i'm
going for. can you suggest the full 3-course menu with one option per course? just
the dish names and a one-line description of each, i'll ask for the recipes separately.
```

| Component | Expected | Notes |
|---|---|---|
| Role Definition | ❌ | |
| Context | ✅ | Dinner party, 6 people, home kitchen, beginner cook |
| Target Audience | ✅ | Vegetarian + nut allergy guests |
| Tone / Style | ❌ | |
| Instruction | ✅ | "suggest a 3-course menu" |
| Examples | ✅ | "something like bruschetta to start" |
| Constraints | ✅ | No nuts, vegetarian-friendly, not complex, no fancy equipment |
| Output Format | ✅ | Dish name + one-line description per course, no recipes |

**Components covered: 6 · Expected Score Range:** B–C (60–74)

---

### Prompt H7 — Research Grant Summary (8 components)

```
i'm applying for a UX research grant and i need to write a 200-word project summary.
the research is about how elderly users (65+) interact with banking apps and where
the biggest friction points are. the grant is from a nonprofit focused on digital inclusion.

i want the summary to sound serious and well-researched but still accessible — the
reviewers aren't all designers or researchers, some are just nonprofit board members.
avoid overly academic language.

here's my rough version that needs to be cleaned up and made more compelling:
"This project will study how old people use banking apps. We will interview users
and find problems. Results will help designers make better apps."

can you rewrite it properly? 200 words max, no bullet points.
```

| Component | Expected | Notes |
|---|---|---|
| Role Definition | ⚠️ | UX researcher applying for grant — implied |
| Context | ✅ | Grant, nonprofit, digital inclusion, banking app friction |
| Target Audience | ✅ | Nonprofit board members, not all technical |
| Tone / Style | ✅ | "serious but accessible, no academic language" |
| Instruction | ✅ | "rewrite it properly" |
| Examples | ✅ | Rough draft provided |
| Constraints | ✅ | 200 words max, no bullet points |
| Output Format | ✅ | Single rewritten paragraph |

**Components covered: 8 · Expected Score Range:** A–B (78–88)

---

### Prompt H8 — Freelance Cold Email (7 components)

```
i need help writing a cold email to reach out to potential clients for my freelance
graphic design business. i specialize in brand identity for food and beverage brands —
logos, packaging, that kind of thing.

i want to reach out to small craft breweries because i think they really need better
branding and they're underserved. the email should be short, i know nobody reads long
cold emails. maybe 4–5 sentences max. don't make it sound desperate or like a template,
it should feel personal even if i'm sending it to multiple people.

something like leading with a genuine compliment about their brand before pitching
would be cool.
```

| Component | Expected | Notes |
|---|---|---|
| Role Definition | ✅ | "freelance graphic designer, brand identity, food and beverage" |
| Context | ✅ | Cold outreach, craft breweries, underserved market |
| Target Audience | ✅ | Small craft breweries |
| Tone / Style | ✅ | "personal, not desperate, not template-y" |
| Instruction | ✅ | "write a cold email" |
| Examples | ⚠️ | "leading with a compliment" — technique suggested, not shown |
| Constraints | ✅ | 4–5 sentences max |
| Output Format | ❌ | |

**Components covered: 7 · Expected Score Range:** B (65–78)

---

### Prompt H9 — Teacher Explaining Finance (7 components)

```
i'm a high school teacher and i want to explain the concept of compound interest
to my 10th grade students in a way that actually makes sense to them. they're 15–16
years old, they don't care about retirement, and they zone out the second i say
anything that sounds like school math.

i want to use an example they'd actually relate to — like something with sneakers
or a social media account growing. can you write a short explanation i could read
out loud in class? keep it under 2 minutes of speaking time, so roughly 250–300 words.
no formulas, just the concept in plain english.
```

| Component | Expected | Notes |
|---|---|---|
| Role Definition | ✅ | "high school teacher" |
| Context | ✅ | 10th grade, explaining compound interest, classroom setting |
| Target Audience | ✅ | 15–16 year olds, disengaged, need relatable examples |
| Tone / Style | ✅ | "plain english, relatable, not school-y" |
| Instruction | ✅ | "write a short explanation i could read out loud" |
| Examples | ✅ | Sneakers or social media growth as suggested analogy |
| Constraints | ✅ | 250–300 words, no formulas, under 2 min speaking time |
| Output Format | ❌ | |

**Components covered: 7 · Expected Score Range:** B (68–80)

---

### Prompt H10 — First-Time Manager 1:1 (8 components)

```
i just got promoted to manage a team for the first time and i want to set the right
tone in my first 1:1 meetings with each person. i have 5 direct reports, all more
experienced than me, and i'm a little nervous they won't take me seriously.

i don't want to come in too strong or make it about me — i want it to feel like i'm
genuinely trying to understand them and what they need. i've seen managers do the whole
"here are my expectations" thing in the first meeting and it always feels tone-deaf.

can you give me a list of 8 questions i should ask in that first 1:1? mix of
professional and a bit more personal, nothing too invasive. just the questions,
no explanations needed.
```

| Component | Expected | Notes |
|---|---|---|
| Role Definition | ✅ | "first-time manager, 5 direct reports, all more experienced" |
| Context | ✅ | Just promoted, nervous, wants to build trust |
| Target Audience | ✅ | Experienced direct reports who might be skeptical |
| Tone / Style | ✅ | "genuine, not about me, not too strong" |
| Instruction | ✅ | "give me 8 questions for my first 1:1" |
| Examples | ⚠️ | Negative example of what NOT to do |
| Constraints | ✅ | Mix of professional and personal, nothing invasive |
| Output Format | ✅ | Just the questions, no explanations |

**Components covered: 8 · Expected Score Range:** A–B (78–88)

---

## Section 4 — Special Cases

*Edge cases designed to stress-test specific detection behaviors.*

---

### Prompt E1 — DAILY (realistic medium, common user)

```
I need to write a message to my team letting them know that our Friday meeting
is being moved to Monday at 10am. We've been having these weekly syncs for a
while and I want to make sure everyone shows up. Can you help me write something
professional but not too formal? We're a pretty casual team.
```

| Component | Expected | Notes |
|---|---|---|
| Role Definition | ❌ | |
| Context | ✅ | Casual team, weekly syncs, meeting rescheduled |
| Target Audience | ❌ | |
| Tone / Style | ✅ | "professional but not too formal" |
| Instruction | ✅ | "write a message to my team" |
| Examples | ❌ | |
| Constraints | ⚠️ | Vague — "not too formal" only |
| Output Format | ❌ | No channel (email? Slack?), no length defined |

**Expected Score Range:** C (40–55)
**Note:** Realistic everyday prompt. The gap between Context and Output Format is the
key improvement Skelica should surface.

---

### Prompt E2 — NEGATIVE EXAMPLE (constraint as what NOT to do)

```
write product descriptions for our new line of protein bars. our customers are
fitness-focused adults. don't make it sound like every other supplement brand —
we hate phrases like "fuel your gains" or "crush your goals". also no all-caps words,
no exclamation marks, and nothing that sounds like it was written by a gym bro.
the descriptions should go on our shopify product pages, so keep each one
between 60 and 80 words.
```

| Component | Expected | Notes |
|---|---|---|
| Role Definition | ❌ | |
| Context | ✅ | Protein bars, Shopify product pages |
| Target Audience | ✅ | Fitness-focused adults |
| Tone / Style | ✅ | Defined entirely by negation — anti-gym-bro |
| Instruction | ✅ | "write product descriptions" |
| Examples | ✅ | Negative examples of banned phrases provided |
| Constraints | ✅ | No all-caps, no exclamation, 60–80 words |
| Output Format | ⚠️ | "product page" implied but no explicit structure |

**Expected Score Range:** B (65–78)
**Note:** Tests whether the detector captures Tone/Style defined through negation and
Examples given as anti-patterns rather than positive models.

---

## Summary Tables

### Section 1 — Structured Prompts

| # | Category | Role | Context | Instruction | Examples | Constraints | Output Format | Expected Score |
|---|---|---|---|---|---|---|---|---|
| S1 | 🔴 Bad | ❌ | ⚠️ | ⚠️ | ❌ | ❌ | ❌ | D–F |
| S2 | 🔴 Bad | ❌ | ⚠️ | ✅ | ❌ | ⚠️ | ❌ | D–F |
| S3 | 🔴 Bad | ❌ | ⚠️ | ✅ | ❌ | ⚠️ | ❌ | D–F |
| S4 | 🟡 Medium | ❌ | ✅ | ✅ | ❌ | ✅ | ❌ | C |
| S5 | 🟡 Medium | ❌ | ✅ | ✅ | ❌ | ✅ | ❌ | C |
| S6 | 🟡 Medium | ❌ | ✅ | ✅ | ❌ | ⚠️ | ❌ | C |
| S7 | 🟡 Medium+ | ✅ | ✅ | ✅ | ❌ | ✅ | ⚠️ | B–C |
| S8 | 🟢 Good | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | A–B |
| S9 | 🟢 Good | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | A–B |
| S10 | 🟢 Good | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | A–B |

### Section 2 — Perfect Score Prompts

| # | Components | Expected Score |
|---|---|---|
| P1 | All 6 — explicit, no ambiguity | 95–100 |
| P2 | All 6 — with markdown headers and nested structure | 95–100 |
| P3 | All 8 — including Target Audience and Tone/Style | 95–100 |

### Section 3 — Human-Style Prompts

| # | Topic | Components Covered | Expected Score |
|---|---|---|---|
| H1 | LinkedIn bio | 6 | B–C (55–72) |
| H2 | Etsy candle description | 7 | B (65–78) |
| H3 | Job interview prep | 6 | B–C (60–74) |
| H4 | Nurse newsletter | 7 | B (68–80) |
| H5 | Team deadline email | 7 | B (68–80) |
| H6 | Dinner party menu | 6 | B–C (60–74) |
| H7 | Research grant summary | 8 | A–B (78–88) |
| H8 | Freelance cold email | 7 | B (65–78) |
| H9 | Teacher explaining finance | 7 | B (68–80) |
| H10 | First-time manager 1:1 | 8 | A–B (78–88) |

### Section 4 — Special Cases

| # | Focus | Expected Score |
|---|---|---|
| E1 | Everyday medium prompt — realistic gap | C (40–55) |
| E2 | Tone/Style by negation, Examples as anti-patterns | B (65–78) |

---

## Validation Instructions for Agent

1. Run each prompt through the Skelica analyzer.
2. Compare each detected component against the `Expected` column.
3. Flag any mismatch between detected and expected status (✅/⚠️/❌).
4. Verify that the final score falls within the `Expected Score Range`.
5. Pay special attention to `⚠️` cases — ambiguous by design, they test detection boundaries.
6. For Section 3, verify that implicit components buried in natural language are still detected.
7. For Section 4, verify that negation-based Tone/Style and anti-pattern Examples are captured.
8. Report discrepancies with: `Prompt ID`, `Component`, `Expected`, `Got`, `Score Delta`.