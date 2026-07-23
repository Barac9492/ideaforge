"use client";

import { useEffect, useRef, useState } from "react";
import { BRAND, FOOTER, ACCESS } from "@/lib/lessons";
import { KEYS, load, save, remove } from "@/lib/store";

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const FREE_ON = process.env.NEXT_PUBLIC_FREE_TIER === "1";
// Only meaningful when the owner has turned the free tier on AND configured Turnstile.
const SHOW_TURNSTILE = FREE_ON && !!TURNSTILE_SITE_KEY;

export default function Shell({
  children,
  onHome,
}: {
  children: React.ReactNode;
  onHome: () => void;
}) {
  const [advOpen, setAdvOpen] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const tsRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);

  useEffect(() => {
    setApiKey(load<string>(KEYS.apiKey, ""));
    setHydrated(true);
    const openHandler = () => {
      setAdvOpen(true);
      requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "smooth" }));
    };
    window.addEventListener("ideaforge:openAdvanced", openHandler);
    return () => window.removeEventListener("ideaforge:openAdvanced", openHandler);
  }, []);

  // App-level Turnstile with an explicit render lifecycle. Produces a token for
  // normal free users without opening 고급 설정; resets after each use.
  useEffect(() => {
    if (!SHOW_TURNSTILE) return;
    (window as any).__ifResetTurnstile = () => {
      const ts = (window as any).turnstile;
      if (ts && widgetId.current) {
        (window as any).__ifTokenValue = undefined;
        try {
          ts.reset(widgetId.current);
        } catch {}
      }
    };
    const renderWidget = () => {
      const ts = (window as any).turnstile;
      if (!ts || !tsRef.current || widgetId.current) return;
      widgetId.current = ts.render(tsRef.current, {
        sitekey: TURNSTILE_SITE_KEY,
        callback: (token: string) => {
          (window as any).__ifTokenValue = token;
        },
        "expired-callback": () => {
          (window as any).__ifTokenValue = undefined;
        },
        "error-callback": () => {
          (window as any).__ifTokenValue = undefined;
        },
      });
    };
    (window as any).__ifRenderTurnstile = renderWidget;
    if (!document.getElementById("cf-ts")) {
      const s = document.createElement("script");
      s.id = "cf-ts";
      s.src =
        "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=__ifRenderTurnstile";
      s.async = true;
      s.defer = true;
      document.body.appendChild(s);
    } else {
      renderWidget();
    }
  }, []);

  function updateKey(v: string) {
    setApiKey(v);
    if (hydrated) save(KEYS.apiKey, v);
  }
  function removeKey() {
    setApiKey("");
    remove(KEYS.apiKey);
  }

  return (
    <>
      <header className="masthead">
        <div className="wrap masthead-inner">
          <button className="wordmark" onClick={onHome} aria-label="처음으로">
            <span className="name">{BRAND.name}</span>
            <span className="sub">{BRAND.tagline}</span>
          </button>
          <button className="adv-toggle" onClick={() => setAdvOpen((o) => !o)}>
            고급 설정
          </button>
        </div>
        {advOpen && (
          <div className="adv-panel">
            <div className="wrap adv-inner">
              <h4>본인 Anthropic API 키 (선택)</h4>
              <p className="muted">
                무료 사용이 막혀 있거나 더 많이 쓰고 싶을 때만 넣으면 됩니다. 키는{" "}
                <a
                  href="https://console.anthropic.com/settings/keys"
                  target="_blank"
                  rel="noreferrer"
                  className="link-btn"
                >
                  Anthropic 콘솔
                </a>
                에서 발급합니다.
              </p>
              <div className="key-row">
                <input
                  className="key-input"
                  type="password"
                  placeholder="sk-ant-..."
                  value={apiKey}
                  onChange={(e) => updateKey(e.target.value)}
                  autoComplete="off"
                />
                {apiKey && (
                  <button className="btn-remove" onClick={removeKey}>
                    {ACCESS.removeKey}
                  </button>
                )}
              </div>
              <p className="key-warn">
                <span>⚠</span>
                <span>{ACCESS.storageWarning}</span>
              </p>
            </div>
          </div>
        )}
      </header>

      {/* App-level human-check for free users. Only renders when the owner
          has enabled the free tier and configured Turnstile. */}
      {SHOW_TURNSTILE && !apiKey && (
        <div className="ts-bar">
          <div className="wrap ts-inner">
            <span className="ts-label">{ACCESS.verifyLabel}</span>
            <div ref={tsRef} />
          </div>
        </div>
      )}

      <main>
        <div className="wrap">{children}</div>
      </main>

      <footer className="foot">
        <div className="wrap">
          <p className="foot-inner">{FOOTER}</p>
        </div>
      </footer>
    </>
  );
}
