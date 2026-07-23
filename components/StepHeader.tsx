"use client";

import { STEPS } from "@/lib/lessons";

export default function StepHeader({ n, onBack }: { n: 1 | 2 | 3 | 4; onBack: () => void }) {
  const s = STEPS[n - 1];
  return (
    <div>
      <div className="backbar">
        <button className="back" onClick={onBack}>
          ← 여정 지도
        </button>
      </div>
      <div className="eyebrow">
        <span className="num">{n}</span>
        <span className="nm">{s.name}</span>
      </div>
      <div className="lesson">{s.lesson}</div>
    </div>
  );
}
