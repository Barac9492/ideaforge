# IdeaForge

Generate startup ideas anchored to **your own** background, then pressure-test any idea through the Y Combinator framework. Two modes, one honest engine.

## Why this instead of a "give me ideas" box

A pure idea generator is a tarpit — ideas are cheap; conviction is scarce. So IdeaForge does the two things that actually help:

1. **Generate** — ideas are built from *your* jobs, skills, and problems you've personally hit (founder-market fit first, via YC's Seven Recipes). Not random; not generic.
2. **Evaluate** — paste any idea and it runs the real filter honestly, no flattery:
   - **Four Mistakes** (incl. tarpit check — demands a *named* structural barrier)
   - **Ten Questions** (each `no` paired with the concrete next action; Q1 founder-market fit weighted)
   - **Three Counterintuitive Signals** (schlep / boring / has-competitors)
   - An honest overall read + **the single assumption to test next.**

Every generated idea has a one-click **"Pressure-test →"** into the evaluator.

## Run locally

```bash
npm install
npm run dev   # http://localhost:3000
```

Paste an Anthropic API key in the top bar (stored in your browser only), or set `ANTHROPIC_API_KEY` on the server.

## Deploy

Import the repo to Vercel — no config needed. Optionally set `ANTHROPIC_API_KEY` as an env var.

## Stack

Next.js 14 (App Router) · Anthropic SDK · no database (state lives in the browser).

## Credit

Framework distilled from Y Combinator / Jared Friedman, *Startup School 2022*, and Paul Graham, *How to Get Startup Ideas*. **Not affiliated with or endorsed by Y Combinator.**
