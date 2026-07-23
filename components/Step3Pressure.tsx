"use client";

import { useEffect, useState } from "react";
import StepHeader from "./StepHeader";
import { EMPTY, LABELS, PAPER_WARNING } from "@/lib/lessons";
import { callIdea, openAdvanced } from "@/lib/api";
import { KEYS, load, save, type Evaluation, type Inventory } from "@/lib/store";
import type { View } from "@/lib/nav";

type EvalWithWarning = Evaluation & { paperWarning?: string };

export default function Step3Pressure({ go }: { go: (v: View) => void }) {
  const [idea, setIdea] = useState("");
  const [inv, setInv] = useState<Inventory | null>(null);
  const [evaluation, setEvaluation] = useState<EvalWithWarning | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setIdea(load<string>(KEYS.selectedIdea, ""));
    setInv(load<Inventory | null>(KEYS.inventory, null));
    setEvaluation(load<EvalWithWarning | null>(KEYS.evaluation, null));
    setHydrated(true);
  }, []);

  async function run() {
    setLoading(true);
    setError(null);
    const res = await callIdea({ mode: "evaluate", idea, inventory: inv || undefined });
    setLoading(false);
    if (!res.ok) {
      setError(res.error || "평가에 실패했습니다.");
      if (res.needKey) openAdvanced();
      return;
    }
    const data = res.data as EvalWithWarning;
    setEvaluation(data);
    save(KEYS.evaluation, data);
  }

  if (hydrated && idea.trim() === "") {
    // no selected idea
    return (
      <div>
        <StepHeader n={3} onBack={() => go("home")} />
        <div className="notice info">{EMPTY.noIdeaForEval}</div>
        <button className="btn primary" onClick={() => go("step2")}>
          2단계로 가기 →
        </button>
      </div>
    );
  }

  const paperWarning = evaluation?.paperWarning || PAPER_WARNING;

  return (
    <div>
      <StepHeader n={3} onBack={() => go("home")} />
      <h2 className="step-title">압박 테스트</h2>
      <p className="step-sub">고른 아이디어를 냉정하게 두들겨 봅니다.</p>

      <div className="notice info">
        <b>평가 대상</b>
        <br />
        {idea}
      </div>

      {!evaluation && (
        <div className="btn-row">
          <button className="btn primary lg" onClick={run} disabled={loading}>
            {loading ? "프레임워크로 두들기는 중…" : "서류 평가 시작"}
          </button>
        </div>
      )}
      {error && <div className="notice err" style={{ marginTop: 14 }}>{error}</div>}

      {evaluation && (
        <div style={{ marginTop: 20 }}>
          <div className="notice paper">{paperWarning}</div>

          <div className="block">
            <h3>{LABELS.mistakes}</h3>
            <div className="checks">
              {evaluation.mistakes.map((m, i) => (
                <div className="check-row" key={i}>
                  <span className={`pill ${m.verdict}`}>{LABELS.mistakeVerdict[m.verdict]}</span>
                  <div className="body">
                    <strong>{m.name}</strong>
                    {m.note && <p>{m.note}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="block">
            <h3>{LABELS.questions}</h3>
            <div className="checks">
              {evaluation.questions.map((q, i) => (
                <div className="check-row" key={i}>
                  <span className={`pill ${q.verdict}`}>{LABELS.questionVerdict[q.verdict]}</span>
                  <div className="body">
                    <strong>
                      {i + 1}. {q.q}
                      {q.isFounderFit && <span className="q-star">★ 가장 중요</span>}
                    </strong>
                    {q.note && <p>{q.note}</p>}
                    {q.verdict === "unknown" && q.isFounderFit && (
                      <p className="next">
                        <button className="link-btn" onClick={() => go("step1")}>
                          1단계에서 재료를 채우면 이 질문을 판정할 수 있어요 →
                        </button>
                      </p>
                    )}
                    {q.nextAction && <p className="next">→ {q.nextAction}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="block">
            <h3>{LABELS.signals}</h3>
            <div className="checks">
              {evaluation.signals.map((s, i) => (
                <div className="check-row" key={i}>
                  <span className={`pill ${s.present ? "yes" : "no"}`}>
                    {s.present ? LABELS.signalYes : LABELS.signalNo}
                  </span>
                  <div className="body">
                    <strong>{s.name}</strong>
                    {s.note && <p>{s.note}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="verdict-card">
            <h3>서류 평가 총평</h3>
            <p>{evaluation.verdict}</p>
            <div className="testnext">
              <span className="tn-label">지금 가장 먼저 확인할 가정</span>
              <p>{evaluation.testNext}</p>
              <button className="btn primary lg block" onClick={() => go("step4")}>
                4단계로: 실험 설계하기 →
              </button>
            </div>
          </div>

          <div className="btn-row" style={{ marginTop: 16 }}>
            <button className="btn ghost" onClick={run} disabled={loading}>
              {loading ? "…" : "다시 평가"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
