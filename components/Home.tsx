"use client";

import { useEffect, useState } from "react";
import { HERO, STEPS } from "@/lib/lessons";
import { computeProgress, type Progress } from "@/lib/store";
import type { View } from "@/lib/nav";

export default function Home({ go }: { go: (v: View) => void }) {
  const [p, setP] = useState<Progress>({ step1: false, step2: false, step3: false, step4: false });

  useEffect(() => setP(computeProgress()), []);

  const done = [p.step1, p.step2, p.step3, p.step4];
  // step1,2 always open; 3 needs 2; 4 needs 3.
  const enabled = [true, true, p.step2, p.step3];

  return (
    <div>
      <div className="hero">
        <h1>{HERO.title}</h1>
        <p>{HERO.body}</p>
      </div>

      <div className="map">
        {STEPS.map((s, i) => (
          <button
            key={s.key}
            className={`map-card${done[i] ? " done" : ""}`}
            disabled={!enabled[i]}
            onClick={() => go(`step${s.n}` as View)}
          >
            <div className="mc-top">
              <span className="mc-num">{String(s.n).padStart(2, "0")}</span>
              {enabled[i] ? (
                <span className={`check ${done[i] ? "on" : "off"}`}>{done[i] ? "✓" : ""}</span>
              ) : (
                <span className="lock">🔒 이전 단계 먼저</span>
              )}
            </div>
            <h3 className="mc-name">{s.name}</h3>
            <p className="mc-blurb">{s.blurb}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
