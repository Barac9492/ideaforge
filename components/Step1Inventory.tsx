"use client";

import { useEffect, useState } from "react";
import StepHeader from "./StepHeader";
import { INVENTORY_FIELDS } from "@/lib/lessons";
import { KEYS, load, save, type Inventory } from "@/lib/store";
import { funnel } from "@/lib/track";
import type { View } from "@/lib/nav";

const EMPTY_INV: Inventory = {
  career: "",
  strength: "",
  problemLived: "",
  unfairAccess: "",
  constraints: "",
};

export default function Step1Inventory({ go }: { go: (v: View) => void }) {
  const [inv, setInv] = useState<Inventory>(EMPTY_INV);
  const [hydrated, setHydrated] = useState(false);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    setInv(load<Inventory>(KEYS.inventory, EMPTY_INV));
    setHydrated(true);
  }, []);

  function update(key: keyof Inventory, value: string) {
    setInv((prev) => {
      const next = { ...prev, [key]: value };
      if (hydrated) save(KEYS.inventory, next);
      return next;
    });
  }

  const requiredOk = inv.problemLived.trim().length > 0;

  function next() {
    setTouched(true);
    if (!requiredOk) return;
    funnel.inventorySaved();
    go("step2");
  }

  return (
    <div>
      <StepHeader n={1} onBack={() => go("home")} />
      <h2 className="step-title">나의 재료</h2>
      <p className="step-sub">솔직할수록 다음 단계의 아이디어가 당신만의 것이 됩니다.</p>

      {INVENTORY_FIELDS.map((f) => (
        <div className="field" key={f.key}>
          <label htmlFor={f.key}>
            {f.label}
            {f.required && <span className="req">필수</span>}
          </label>
          <span className="fhint">{f.hint}</span>
          {f.long ? (
            <textarea
              id={f.key}
              rows={3}
              required={f.required}
              aria-required={f.required || undefined}
              value={inv[f.key]}
              onChange={(e) => update(f.key, e.target.value)}
            />
          ) : (
            <input
              id={f.key}
              type="text"
              required={f.required}
              aria-required={f.required || undefined}
              value={inv[f.key]}
              onChange={(e) => update(f.key, e.target.value)}
            />
          )}
        </div>
      ))}

      {touched && !requiredOk && (
        <div className="notice err">
          ‘직접 겪어서 짜증났던 문제’는 필수입니다. 정말 없다면 <b>없음</b>이라고 적어주세요.
        </div>
      )}

      <div className="btn-row">
        <button className="btn primary lg" onClick={next}>
          저장하고 다음: 아이디어 →
        </button>
      </div>
    </div>
  );
}
