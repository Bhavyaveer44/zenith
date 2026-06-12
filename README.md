# Zenith

**See your patterns. With receipts.**

Zenith is a structured self-reflection and growth tool. It is *not* an "AI therapist chatbot" — it's a pipeline of six specialized agents where the methodology lives in code and nothing reaches you without surviving an adversarial evidence check.

> Zenith is not therapy, does not diagnose, and is not a substitute for a licensed professional. In a crisis it stops and routes to real humans (`/crisis-resources`).

## How it works

1. **Stories** — Structured sessions (Story Session, CBT Thought Record, Weekly Review) elicit one concrete episode at a time. Each protocol is a typed state machine in `src/lib/protocols/`; the LLM phrases questions, the code decides the methodology.
2. **Observations** — The Story Analyst decomposes each saved story into quoted observations (triggers, emotions, automatic thoughts, behaviors, outcomes) with embeddings (`src/lib/analysis/analyst.ts`).
3. **Patterns** — The Pattern Miner clusters observations across all your stories and proposes hypotheses (`src/lib/analysis/miner.ts`), triggered after every 3rd story and by a daily cron.
4. **Verification** — An adversarial Verifier (`src/lib/analysis/verifier.ts`) checks every claim quote-by-quote. The bar — ≥3 supporting quotes from ≥3 different stories, no diagnoses, no character judgments — is enforced **in code**, not just in the prompt. Only verified patterns are ever shown.
5. **Blindspots** — Check-ins capture your self-image; the blindspot scanner diffs it against your narrative evidence, in both directions (`src/lib/analysis/blindspots.ts`).
6. **Growth** — Confirmed patterns become small behavioral experiments with recorded predictions. The Weekly Review session reads your predictions back verbatim and compares them with what actually happened.

A Safety Sentinel (deterministic patterns + fast classifier, `src/lib/safety/`) runs on every message *before* the Guide agent sees it. On a crisis signal the session halts and pre-written (never generated) resources take over.

## Setup

```bash
npm install
cp .env.example .env.local
```

Fill `.env.local`:

| Variable | Where to get it |
|---|---|
| `DATABASE_URL` | Neon Postgres — Vercel Marketplace → Neon, or [neon.tech](https://neon.tech) |
| `GROQ_API_KEY` | [console.groq.com/keys](https://console.groq.com/keys) — runs all agents on gpt-oss models |
| `AI_GATEWAY_API_KEY` | *(optional)* AI Gateway fallback (Claude + embeddings); needs a card on file |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY` | *(optional)* Clerk — leave unset for single-user local mode |
| `CRON_SECRET` | *(optional)* any secret, protects the cron route in production |

Then:

```bash
npm run db:migrate   # creates tables + enables pgvector
npm run dev
```

Open http://localhost:3000, accept the onboarding terms, and start a Story Session.

## Verifying the pipeline end-to-end

```bash
npm run seed                                          # 6 stories with a planted conflict-avoidance pattern
curl -X POST http://localhost:3000/api/dev/backfill   # analyst -> miner -> verifier
```

Then check `/mirror` — a conflict-avoidance pattern should appear **with quoted evidence**; one-off themes (e.g. the presentation story) should not. Submit a check-in rating yourself ~9/10 on "Boundaries" to see a blindspot surface. Type a crisis phrase in a session to see the safety takeover.

## Models

All model routing is in `src/lib/ai.ts`. With `GROQ_API_KEY` set, the six agents run on Groq's `openai/gpt-oss-120b` / `gpt-oss-20b` (the Groq models that support structured outputs). Without it they fall back to Claude via the Vercel AI Gateway. Embeddings use the gateway when available; otherwise the Pattern Miner switches to LLM-based clustering automatically — the evidence bar and Verifier apply either way.

## Deploy

```bash
npm i -g vercel
vercel link
vercel env add DATABASE_URL    # or provision Neon via the Marketplace
vercel deploy
```

`vercel.json` schedules the daily mining sweep (`/api/cron/mine`).
