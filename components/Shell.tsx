"use client";

import { useEffect, useState } from "react";
import { BRAND, FOOTER, ACCESS } from "@/lib/lessons";
import { KEYS, load, save, remove } from "@/lib/store";

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

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

  useEffect(() => {
    setApiKey(load<string>(KEYS.apiKey, ""));
    setHydrated(true);
    const openHandler = () => {
      setAdvOpen(true);
      requestAnimationFrame(() =>
        window.scrollTo({ top: 0, behavior: "smooth" })
      );
    };
    window.addEventListener("ideaforge:openAdvanced", openHandler);
    return () => window.removeEventListener("ideaforge:openAdvanced", openHandler);
  }, []);

  // Optional Cloudflare Turnstile (only if configured).
  useEffect(() => {
    if (!TURNSTILE_SITE_KEY) return;
    (window as any).__ifToken = (t: string) => {
      (window as any).__ifTokenValue = t;
    };
    if (!document.getElementById("cf-ts")) {
      const s = document.createElement("script");
      s.id = "cf-ts";
      s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
      s.async = true;
      s.defer = true;
      document.body.appendChild(s);
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
              {TURNSTILE_SITE_KEY && (
                <div style={{ marginTop: 12 }}>
                  <div
                    className="cf-turnstile"
                    data-sitekey={TURNSTILE_SITE_KEY}
                    data-callback="__ifToken"
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </header>

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
