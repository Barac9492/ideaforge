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

Import the repo to Vercel — no config needed. Out of the box it runs in
**bring-your-own-key** mode: every visitor pastes their own key, so it costs the
operator **$0** and there is nothing to abuse.

## Going public without getting a surprise bill

The free tier is **off until you deliberately turn it on**, and is designed so
you can't accidentally leave it wide open. To enable a rate-limited free tier:

1. **Cap your worst case first.** In the Anthropic Console, make a *dedicated
   workspace*, set a hard **monthly spend limit** (e.g. $20), and create a key
   scoped to it. That cap is your guaranteed ceiling no matter what.
2. **Add a store.** Create a free Upstash Redis DB; set `UPSTASH_REDIS_REST_URL`
   and `UPSTASH_REDIS_REST_TOKEN`. **Free runs stay disabled unless both the
   server key and the store exist** — so there's no misconfiguration that opens
   the floodgates.
3. Set `ANTHROPIC_API_KEY` (from step 1) and `NEXT_PUBLIC_FREE_TIER=1`.
4. (Optional) Add Cloudflare Turnstile (`NEXT_PUBLIC_TURNSTILE_SITE_KEY` +
   `TURNSTILE_SECRET_KEY`) to block headless bots.

Built-in guards on free runs: **per-IP daily limit** (`FREE_RUNS_PER_IP_PER_DAY`,
default 5), **global daily budget kill-switch** (`FREE_RUNS_GLOBAL_PER_DAY`,
default 200 — after which everyone falls back to BYO for the day), **Sonnet only
+ capped output** (no Opus on your dime), and a **hard input-length cap**. See
`.env.example`.

## Stack

Next.js 14 (App Router) · Anthropic SDK · no database (state lives in the browser).

## Credit

Framework distilled from Y Combinator / Jared Friedman, *Startup School 2022*, and Paul Graham, *How to Get Startup Ideas*. **Not affiliated with or endorsed by Y Combinator.**
