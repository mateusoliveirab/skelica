# Prompt-tooling monetization: findings for Skelica (2025–2026)

Rigorous source-linked research. Flags: **[M]** = marketing/self-reported, **[V]** = vendor market-research estimate, **[?]** = unverifiable.

## 1. Competitive landscape

| Product | What it does | List price | Target |
|---|---|---|---|
| **PromptPerfect** (Jina) | Paste-prompt optimizer, Chrome ext, API | Was ~$9.99–$39.99/mo (sources conflict) | Prosumers |
| **Latitude.so** | Prompt/agent platform: playground, evals, versioning, observability | Team $299/mo; Scale $899/mo; OSS free | Teams |
| **PromptLayer** | Prompt CMS + evals + observability | Free (5 users, 2.5k req); Pro $49/mo; Team $500/mo; Ent custom | Teams |
| **Humanloop** | Prompt management + eval + observability | Free (2 members, 50 eval runs); Enterprise custom | Enterprise |
| **LangSmith** (LangChain) | Traces, evals, playground | Developer $0; Plus **$39/seat/mo**; Ent custom | Dev teams |
| **Braintrust** | Evals + observability | Starter $0 ($10 credits); Pro **$249/mo flat**; Ent custom | Platform eng |
| **Agenta** | Agent/prompt workspace, OSS + cloud | Hobby $0; Pro $29/mo; Business $299/mo; Ent custom | Teams |
| **Vellum** | **Pivoted out** to a personal AI assistant | $30 / $100 / $200 per month | Consumers |
| **PromptHub** | Prompt library/management + "enhancer" | Free; Pro $12/mo ($9 annual); Team $20/user/mo ($15 annual) | Prosumers + teams |
| **Promptfoo** | OSS eval, red-teaming, CI gating | Community free; Enterprise/on-prem custom | Enterprises |
| **AIPRM** | Chrome prompt-template library | Freemium; ">2M users" self-claimed **[M]** | Prosumers |

Sources: [PromptPerfect directory](https://siteefy.com/tools/promptperfect?review=1), [Latitude](https://toolradar.com/tools/latitude/pricing), [PromptLayer](https://www.promptlayer.com/pricing/), [Humanloop](https://humanloop.com/pricing), [LangSmith](https://www.langchain.com/pricing), [Braintrust](https://www.braintrust.dev/pricing), [Agenta](https://agenta.ai/pricing), [Vellum](https://www.vellum.ai/pricing), [PromptHub](https://www.prompthub.us/pricing), [Promptfoo](https://www.promptfoo.dev/pricing/), [AIPRM](https://crxdl.com/detail/o/ojnbohmppadfgpejeebfnmnknjdlckgj).

**Consolidation is the headline.** Anthropic took the Humanloop team (Aug 2025) ([TechCrunch](https://techcrunch.com/2025/08/13/anthropic-nabs-humanloop-team-as-competition-for-enterprise-ai-talent-heats-up/)); Elastic completed its Jina AI acquisition (Oct 2025) ([Nasdaq](https://www.nasdaq.com/press-release/elastic-completes-acquisition-jina-ai-leader-frontier-models-multimodal-and)) and **PromptPerfect shuts down Sept 1 2026** ([PromptDC](https://promptdc.com/blog/promptperfect-shutting-down-alternatives-2026)). Vellum exited ([GitHub](https://github.com/vellum-ai/vellum-assistant)). Meanwhile eval/observability raises big: [Braintrust $80M Series B @ ~$800M, Feb 2026](https://www.axios.com/pro/enterprise-software-deals/2026/02/17/ai-observability-braintrust-80-million-800-million). The standalone "optimize my prompt" product is dying; **eval/observability** is where capital went.

## 2. Commoditization — already a bundled feature

- **OpenAI Prompt Optimizer**: free in the dashboard (`platform.openai.com/chat/edit?optimize=true`), a multi-agent meta-prompt that rewrites against OpenAI's guidance, explains why, and migrates prompts to GPT-5 conventions; shipped with GPT-5 (Aug 2025) ([PromptLayer](https://www.promptlayer.com/blog/openai-prompt-optimizer-what-it-does-and-5-alternatives/), [t3n](https://t3n.de/news/chatgpt-antwortet-nicht-richtig-1705304/), [cookbook](https://developers.openai.com/cookbook/examples/gpt-5/prompt-optimization-cookbook)). Its dataset-backed mode dies with **OpenAI Evals** (read-only Oct 31 2026; shutdown Nov 30 2026).
- **Anthropic**: a console "prompt improver" auto-refines prompts with chain-of-thought and examples ([blog](https://claude.com/blog/prompt-improver), [docs](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-tools)).
- **Google**: AI-powered prompt writing ships in the Gemini Enterprise Agent Platform ([docs](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/prompts/ai-powered-prompt-writing)).
- **Nuance:** the consumer ChatGPT app still has no one-click rewrite — its June 2026 mobile update added a long-press "intelligence level" picker, not prompt improvement ([9to5Mac](https://9to5mac.com/2026/06/01/openai-enhances-chatgpt-app-with-this-hidden-feature/)); a one-click optimizer remains an open forum request ([OpenAI forum](https://community.openai.com/t/feature-request-one-click-ai-prompt-optimizer-before-sending/1393410/2)).

**Verdict:** "score and rewrite my prompt" is a free feature of every major provider console — a feature, not a durable product. What sells is the *lifecycle*: versioning, regression evals, CI gating, per-version cost/latency, RBAC/SSO — none hostable client-side.

## 3. Where money flows

- **(a) Prosumers/creators:** $5–$20/mo (PromptHub Pro $12, AiCue $5, ChatGPT Plus $20). Solo-reachable, low ACV, and general AI-subscription willingness to pay is soft ([ZDNet](https://www.zdnet.com/article/are-ai-subscriptions-worth-it-most-people-dont-seem-to-think-so-according-to-this-study/)).
- **(b) AI dev teams:** $29–$500/mo self-serve, or $39/seat. Median ACV for paid developer tools ≈ **$1,200/yr** team plans ([Monetizely](https://www.getmonetizely.com/articles/whats-the-right-ratio-of-free-to-paid-users-in-developer-saas)). Reachable bottom-up, but only with team-scale features.
- **(c) Enterprise governance/eval:** mid-market SaaS $5K–$50K/mo; enterprise custom **$50K–$500K+/yr** ([eval.qa](https://eval.qa/learn/enterprise-pricing.html), vendor survey). Needs SOC 2, SSO, VPC, sales — out of reach. Average AI spend is $2,068/employee (2026), but the **median company spends <$200/employee** ([Atlanta Fed via Rize](https://rize.io/blog/ai-spending-per-employee-benchmark)).

**Realistic solo reach: (a), borderline (b).** Neither pays for scoring that OpenAI/Anthropic give away.

## 4. Distribution reality

- **SEO:** "prompt optimizer"/"prompt enhancer" SERPs have **no dominant brand** — page one is thin exact-match tool sites and GitHub repos. Rankable, no moat, informational intent ([SERP](https://html.duckduckgo.com/html/?q=prompt+optimizer)). Keyword volume unverified **[?]**.
- **Chrome Web Store:** ~112k extensions; **86.3% have <1,000 users**; median ≈17 installs ([aboutchromebooks](https://www.aboutchromebooks.com/chrome-extension-ecosystem/)).
- **Product Hunt:** median top-5 launch ≈1,200 day-one visitors, free→paid <2%; one documented launch = 512 visitors / 63 signups / **4 paid** ([writeup](https://dev.to/ahmet_saridag_9232a4f1a24/does-product-hunt-still-work-for-indie-app-launches-what-actually-happened-when-i-tried-it-1ona)).
- **Conversion:** freemium signup→paid 2–5% ([OpenView lineage](https://www.artisangrowthstrategies.com/blog/freemium-conversion-rate-benchmarks)), 2.6–2.8% ([First Page Sage 2025](https://firstpagesage.com/seo-blog/saas-free-trial-conversion-rate-benchmarks/)), 5.6% ([ChartMogul 2026](https://chartmogul.com/reports/saas-conversion-report-2/)) — all signup→paid. **Skelica has no signups**, so real rate = revenue ÷ visitors, likely **<1%**.
- **Arithmetic:** $1k MRR at $9/mo ≈ 11k visitors/mo at 1% (~37k at 0.3%); $5k MRR ≈ 56k/mo at 1%. A good Product Hunt month, every month.
- **Solo freemium→MRR:** TypingMind ~$33k/mo **[M]** ([source](https://tycoon.us/one-person-company/tony-dinh)); extension precedents GMass $130k/mo ([ExtensionPay](https://extensionpay.com/articles/browser-extensions-make-money)). **Counter-signal:** ExtensionPay, the main extension rail, reports only **$500k processed cumulatively across all developers** ([extensionpay.com](https://extensionpay.com/)).
- **Rails:** Chrome Web Store payments died in 2021 ([notice](https://developer.chrome.com/docs/webstore/cws-payments-deprecation)); solo devs use Stripe/ExtensionPay or a merchant-of-record at 4–8% ([Beancount](https://beancount.io/blog/2026/07/19/chrome-extension-developer-bookkeeping-third-party-payment-processor-reconciliation-guide)). Client-side license checks are trivially bypassable.

## 5. Demand signals

- **Consumer interest up:** r/PromptEngineering **414k members, +83.6%/yr**; r/ChatGPTPromptGenius 818k (+35%); r/LLMDevs 169k (+57%) ([GummySearch](https://gummysearch.com/r/PromptEngineering/)). OSS: **DSPy 37,980 stars, promptfoo 25,045, guidance 21,749** (GitHub API, Sep 2026). **promptfoo npm downloads grew ~19× in 18 months** — 135k/mo (Mar 2025) → 2.58M/mo (Aug 2026).
- **Professional demand down:** a Microsoft-commissioned survey of **31,000 professionals across 31 countries** found few firms plan prompt-engineering roles — "prompting is becoming a skill that supports other roles, not a role in itself" ([VARINDIA](https://varindia.com/public/index.php/news/prompt-engineering-role-declines-as-ai-advances)). Google Trends: **"prompt engineer" down >60% since Oct 2024** ([diginomica](https://diginomica.com/de-hyped-and-de-glamorized-prompt-engineer-follows-familiar-career-path)); [IEEE Spectrum declared it dead in Mar 2024](https://spectrum.ieee.org/prompt-engineering-is-dead).
- **Models absorbing prompt polish:** OpenAI's GPT-5.6 guide (Jul 2026) tells developers to **shorten** system prompts — internal tests showed −41–66% tokens after doing so, reversing its own Aug-2025 scaffolding advice ([Digital Today](https://www.digitaltoday.co.kr/en/view/81428/)); Anthropic says it removed **>80% of Claude Code's system prompt** for newer models ([Anthropic](https://claude.com/blog/the-new-rules-of-context-engineering-for-claude-5-generation-models)).
- **Prompt content:** PromptBase hosts 330k+ listings at 20% commission but traffic fell to ~584k visits/mo in Aug 2026, −17% MoM ([HypeStat](https://hypestat.com/info/promptbase.com)) — supply up, per-listing demand down. No audited revenue for any prompt pack was found **[?]**.
- **Market forecasts [V], low confidence:** prompt engineering $1.13B (2025) → $1.49B (2026) → $4.51B (2030) ([TBRC](https://www.researchandmarkets.com/reports/6103820/prompt-engineering-market-report)); tools segment +$2.62B 2025–30 @18.9% CAGR ([Technavio](https://www.researchandmarkets.com/reports/6113927/prompt-engineering-tools-market)).

## Bottom line

The category split in two: free single-shot prompt authoring is being absorbed by OpenAI/Anthropic/Google consoles, while recurring money concentrated in team/enterprise **eval, versioning and observability** at $39/seat to $500K+/yr. Skelica sits in the commoditized half, with no account (no measurable funnel), no backend (nothing to gate), and no distribution moat. Free-tool demand is large and still growing; **willingness to pay for prompt beautification is unverified and being squeezed from both sides.**
