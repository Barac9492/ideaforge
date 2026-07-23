"use client";

import { useEffect, useRef, useState } from "react";
import type { Idea, Evaluation } from "@/lib/framework";

const FREE_ON = process.env.NEXT_PUBLIC_FREE_TIER === "1";
const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

const MODELS = [
  { id: "claude-sonnet-5", label: "Sonnet 5 (fast)" },
  { id: "claude-opus-4-8", label: "Opus 4.8 (best)" },
];

const LS = {
  key: "ideaforge.apiKey",
  model: "ideaforge.model",
  bg: "ideaforge.bg",
  constraints: "ideaforge.constraints",
};

type Mode = "generate" | "evaluate";

export default function Page() {
  const [mode, setMode] = useState<Mode>("generate");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState(MODELS[0].id);

  const [bg, setBg] = useState("");
  const [constraints, setConstraints] = useState("");
  const [count, setCount] = useState(5);
  const [ideaInput, setIdeaInput] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ideas, setIdeas] = useState<Idea[] | null>(null);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [needKey, setNeedKey] = useState(false);
  const keyRef = useRef<HTMLInputElement>(null);

  // Optional Cloudflare Turnstile (only if a public site key is configured).
  useEffect(() => {
    if (!TURNSTILE_SITE_KEY) return;
    (window as any).__ifToken = (t: string) => setTurnstileToken(t);
    if (!document.getElementById("cf-ts")) {
      const s = document.createElement("script");
      s.id = "cf-ts";
      s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
      s.async = true;
      s.defer = true;
      document.body.appendChild(s);
    }
  }, []);

  useEffect(() => {
    try {
      setApiKey(localStorage.getItem(LS.key) || "");
      setModel(localStorage.getItem(LS.model) || MODELS[0].id);
      setBg(localStorage.getItem(LS.bg) || "");
      setConstraints(localStorage.getItem(LS.constraints) || "");
    } catch {}
    setHydrated(true);
  }, []);
  useEffect(() => { if (hydrated) localStorage.setItem(LS.key, apiKey); }, [apiKey, hydrated]);
  useEffect(() => { if (hydrated) localStorage.setItem(LS.model, model); }, [model, hydrated]);
  useEffect(() => { if (hydrated) localStorage.setItem(LS.bg, bg); }, [bg, hydrated]);
  useEffect(() => { if (hydrated) localStorage.setItem(LS.constraints, constraints); }, [constraints, hydrated]);

  async function run() {
    setLoading(true);
    setError(null);
    setNeedKey(false);
    if (mode === "generate") setIdeas(null); else setEvaluation(null);
    try {
      const res = await fetch("/api/idea", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          input: mode === "generate" ? bg : ideaInput,
          constraints: mode === "generate" ? constraints : undefined,
          count,
          apiKey: apiKey || undefined,
          model,
          turnstileToken: turnstileToken || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.needKey) {
          setNeedKey(true);
          keyRef.current?.focus();
          keyRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
        }
        throw new Error(data.error || "Request failed");
      }
      if (mode === "generate") setIdeas(data.data.ideas || []);
      else setEvaluation(data.data as Evaluation);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function evaluateIdea(i: Idea) {
    setMode("evaluate");
    setIdeaInput(`${i.title} — ${i.oneLiner}`);
    setEvaluation(null);
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const canRun = mode === "generate" ? bg.trim().length > 0 : ideaInput.trim().length > 0;

  return (
    <main className="wrap">
      <header className="topbar">
        <div className="brand">
          <span className="logo">⚒</span>
          <div>
            <h1>IdeaForge</h1>
            <p>generate & pressure-test startup ideas — the YC way</p>
          </div>
        </div>
        <div className="controls">
          <input
            ref={keyRef}
            type="password" className={needKey ? "key need" : "key"}
            placeholder="Anthropic API key (browser-only)"
            value={apiKey} onChange={(e) => { setApiKey(e.target.value); if (e.target.value) setNeedKey(false); }}
          />
          <select value={model} onChange={(e) => setModel(e.target.value)}>
            {MODELS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
          </select>
        </div>
      </header>

      <section className="hero">
        <h2>Don't brainstorm ideas. Forge them from who you are — then try to kill them.</h2>
        <p>
          Ideas are cheap; conviction is scarce. IdeaForge generates startup ideas anchored to <em>your</em> real
          background, then runs any idea through the YC framework — so you leave knowing what to build, what to
          validate, and what to walk away from.
        </p>
        <ol className="how">
          <li><b>1 · Generate</b> ideas from your background <span>founder-market fit first</span></li>
          <li className="arrow">→</li>
          <li><b>2 · Pressure-test</b> any idea, honestly <span>and what to test next</span></li>
        </ol>
      </section>

      <div className="tabs">
        <button className={mode === "generate" ? "tab on" : "tab"} onClick={() => setMode("generate")}>
          1 · Generate <span>ideas built from your background</span>
        </button>
        <button className={mode === "evaluate" ? "tab on" : "tab"} onClick={() => setMode("evaluate")}>
          2 · Evaluate <span>pressure-test an idea, no flattery</span>
        </button>
      </div>

      <div className="access">
        {FREE_ON
          ? <>✦ <b>Free to try</b> — a few runs a day, on us. Add your own Anthropic key (top right) for unlimited runs and Opus.</>
          : <>Add your Anthropic API key (top right) to run. It's stored only in your browser and billed to your account.</>}
      </div>

      {TURNSTILE_SITE_KEY && !apiKey && (
        <div className="turnstile-wrap">
          <div className="cf-turnstile" data-sitekey={TURNSTILE_SITE_KEY} data-callback="__ifToken" />
        </div>
      )}

      {mode === "generate" ? (
        <section className="input-card">
          <label className="field">
            <span className="label">Your background — jobs, skills, experiences, problems you've personally hit</span>
            <span className="hint">This is founder-market fit. The more specific and real, the better the ideas.</span>
            <textarea rows={6} value={bg} onChange={(e) => setBg(e.target.value)}
              placeholder="e.g. Shipped ~10 micro-apps solo in Korea. Deep in the Korean VC/startup world. Fast at going idea→prototype. Frustrated by repetitive government-fund paperwork. Comfortable with LLMs, Next.js, agents…" />
          </label>
          <div className="row">
            <label className="field grow">
              <span className="label">Constraints (optional)</span>
              <input value={constraints} onChange={(e) => setConstraints(e.target.value)}
                placeholder="budget, time/week, industries to include or avoid" />
            </label>
            <label className="field">
              <span className="label"># ideas</span>
              <select value={count} onChange={(e) => setCount(Number(e.target.value))}>
                {[3,4,5,6,7,8].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </label>
          </div>
          <button className="primary run" onClick={run} disabled={!canRun || loading}>
            {loading ? "Forging…" : "Generate ideas"}
          </button>
        </section>
      ) : (
        <section className="input-card">
          <label className="field">
            <span className="label">The idea to pressure-test</span>
            <span className="hint">One or two sentences is enough. Honest verdict, not flattery.</span>
            <textarea rows={4} value={ideaInput} onChange={(e) => setIdeaInput(e.target.value)}
              placeholder="e.g. A tool that drafts Korean government fund (모태펀드) applications from a founder's core thesis." />
          </label>
          <button className="primary run" onClick={run} disabled={!canRun || loading}>
            {loading ? "Running the framework…" : "Evaluate"}
          </button>
        </section>
      )}

      {error && <p className="err big">{error}</p>}

      {/* GENERATE RESULTS */}
      {mode === "generate" && ideas && (
        <section className="results">
          {ideas.length === 0 && <p className="muted">No ideas returned.</p>}
          {ideas.map((i, idx) => (
            <div className="idea" key={idx}>
              <div className="idea-head">
                <h3>{i.title}</h3>
                <button className="ghost" onClick={() => evaluateIdea(i)}>Pressure-test →</button>
              </div>
              <p className="one">{i.oneLiner}</p>
              <dl className="meta">
                <div><dt>Why you</dt><dd>{i.founderFit}</dd></div>
                <div><dt>Recipe</dt><dd>{i.recipe}</dd></div>
                <div><dt>Why now</dt><dd>{i.whyNow}</dd></div>
                <div><dt>Biggest risk</dt><dd className="risk">{i.risk}</dd></div>
              </dl>
            </div>
          ))}
        </section>
      )}

      {/* EVALUATE RESULTS */}
      {mode === "evaluate" && evaluation && (
        <section className="results eval">
          <div className="block">
            <h2>Four Mistakes</h2>
            <div className="checks">
              {evaluation.mistakes.map((m, idx) => (
                <div className={`check ${m.verdict}`} key={idx}>
                  <span className={`pill ${m.verdict}`}>{m.verdict}</span>
                  <div><strong>{m.name}</strong><p>{m.note}</p></div>
                </div>
              ))}
            </div>
          </div>

          <div className="block">
            <h2>Ten Questions</h2>
            <div className="checks">
              {evaluation.questions.map((q, idx) => (
                <div className={`check q-${q.verdict}`} key={idx}>
                  <span className={`pill q-${q.verdict}`}>{q.verdict}</span>
                  <div>
                    <strong>{idx + 1}. {q.q}{idx === 0 && <em className="star"> ★ most important</em>}</strong>
                    <p>{q.note}</p>
                    {q.nextAction && <p className="next">→ {q.nextAction}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="block">
            <h2>Three Counterintuitive Signals</h2>
            <div className="checks">
              {evaluation.signals.map((s, idx) => (
                <div className={`check ${s.present ? "pass" : "warn"}`} key={idx}>
                  <span className={`pill ${s.present ? "pass" : "warn"}`}>{s.present ? "yes" : "no"}</span>
                  <div><strong>{s.name}</strong><p>{s.note}</p></div>
                </div>
              ))}
            </div>
          </div>

          <div className="verdict">
            <h2>Honest read</h2>
            <p>{evaluation.verdict}</p>
            <div className="testnext">
              <span className="tn-label">Test this next</span>
              <p>{evaluation.testNext}</p>
            </div>
          </div>
        </section>
      )}

      <footer className="foot">
        Framework: Y Combinator / Jared Friedman (Startup School 2022) & Paul Graham, “How to Get Startup Ideas.”
        Not affiliated with or endorsed by Y Combinator. Your key & inputs stay in this browser only.
      </footer>
    </main>
  );
}
