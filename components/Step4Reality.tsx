"use client";

import { useEffect, useState } from "react";
import StepHeader from "./StepHeader";
import { EXPERIMENTS, VERDICTS } from "@/lib/lessons";
import {
  KEYS,
  load,
  save,
  type ExperimentKind,
  type Outcome,
  type PreCommit,
} from "@/lib/store";
import { decideVerdict } from "@/lib/verdict";
import type { View } from "@/lib/nav";

const EMPTY_PC: PreCommit = {
  experiment: "",
  metric: "",
  threshold: 0,
  unit: "",
  deadline: "",
  committedAt: "",
  changeLog: [],
};
const EMPTY_OUT: Outcome = { resultValue: null, verdict: "", decidedAt: "" };

function nowIso() {
  return new Date().toISOString();
}
function fmt(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export default function Step4Reality({ go }: { go: (v: View) => void }) {
  const [idea, setIdea] = useState("");
  const [pc, setPc] = useState<PreCommit>(EMPTY_PC);
  const [out, setOut] = useState<Outcome>(EMPTY_OUT);
  const [resultInput, setResultInput] = useState("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setIdea(load<string>(KEYS.selectedIdea, ""));
    setPc(load<PreCommit>(KEYS.precommit, EMPTY_PC));
    const o = load<Outcome>(KEYS.outcome, EMPTY_OUT);
    setOut(o);
    if (o.resultValue !== null) setResultInput(String(o.resultValue));
    setHydrated(true);
  }, []);

  function persistPc(next: PreCommit) {
    setPc(next);
    if (hydrated) save(KEYS.precommit, next);
  }
  function persistOut(next: Outcome) {
    setOut(next);
    if (hydrated) save(KEYS.outcome, next);
  }

  function chooseExperiment(kind: ExperimentKind) {
    const spec = EXPERIMENTS.find((e) => e.kind === kind)!;
    persistPc({
      ...EMPTY_PC,
      experiment: kind,
      metric: spec.metric,
      unit: spec.unit,
      threshold: spec.defaultThreshold,
      changeLog: pc.changeLog,
    });
    // reset any prior outcome when switching experiment
    persistOut(EMPTY_OUT);
    setResultInput("");
  }

  function lock() {
    if (!pc.metric.trim() || !(pc.threshold > 0)) return;
    persistPc({ ...pc, committedAt: nowIso() });
  }

  function editCriteria() {
    if (
      !window.confirm(
        "기준을 바꾸면 변경 기록이 남습니다. 실험 도중 기준을 바꾸는 것은 판단을 흐립니다. 계속할까요?"
      )
    )
      return;
    persistPc({
      ...pc,
      committedAt: "",
      changeLog: [
        ...pc.changeLog,
        { at: nowIso(), fromThreshold: pc.threshold, fromMetric: pc.metric },
      ],
    });
  }

  function decide() {
    const r = Number(resultInput);
    if (!Number.isFinite(r) || resultInput.trim() === "") return;
    const verdict = decideVerdict(pc.threshold, r);
    persistOut({ resultValue: r, verdict, decidedAt: nowIso() });
  }

  const spec = pc.experiment ? EXPERIMENTS.find((e) => e.kind === pc.experiment) : null;
  const locked = pc.committedAt !== "";

  return (
    <div>
      <StepHeader n={4} onBack={() => go("home")} />
      <h2 className="step-title">현실 검증</h2>
      <p className="step-sub">이 단계는 AI를 부르지 않습니다. 당신이 사람을 만나고, 그 결과만 기록합니다.</p>

      {hydrated && idea && (
        <div className="notice info">
          <b>검증할 아이디어</b>
          <br />
          {idea}
        </div>
      )}

      {/* 1) choose experiment */}
      <h3 style={{ fontFamily: "var(--serif)", fontSize: 18, margin: "22px 0 12px" }}>
        어떤 실험을 할까요?
      </h3>
      <div className="exp-grid">
        {EXPERIMENTS.map((e) => (
          <button
            key={e.kind}
            className={`exp${pc.experiment === e.kind ? " sel" : ""}`}
            onClick={() => chooseExperiment(e.kind)}
          >
            <h4>{e.name}</h4>
            <p>{e.summary}</p>
          </button>
        ))}
      </div>

      {spec && (
        <>
          <ul className="how-list">
            {spec.how.map((h, i) => (
              <li key={i}>{h}</li>
            ))}
          </ul>

          {/* 2) pre-commit */}
          <div className="block" style={{ marginTop: 20 }}>
            <h3>시작 전에 기준을 잠급니다</h3>
            {!locked ? (
              <>
                <div className="field">
                  <label htmlFor="metric">측정할 것</label>
                  <input
                    id="metric"
                    type="text"
                    value={pc.metric}
                    onChange={(e) => persistPc({ ...pc, metric: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label htmlFor="threshold">계속하려면 넘어야 하는 값 ({pc.unit})</label>
                  <span className="fhint">이 값을 못 넘으면 접습니다. 지금 정직하게 정하세요.</span>
                  <input
                    id="threshold"
                    type="number"
                    min={0}
                    value={pc.threshold || ""}
                    onChange={(e) => persistPc({ ...pc, threshold: Number(e.target.value) })}
                  />
                </div>
                <div className="field">
                  <label htmlFor="deadline">마감일</label>
                  <input
                    id="deadline"
                    type="date"
                    value={pc.deadline}
                    onChange={(e) => persistPc({ ...pc, deadline: e.target.value })}
                  />
                </div>
                <button
                  className="btn primary"
                  onClick={lock}
                  disabled={!pc.metric.trim() || !(pc.threshold > 0)}
                >
                  🔒 기준 잠그기
                </button>
              </>
            ) : (
              <>
                <p className="locked-tag">🔒 기준 잠금됨 · {fmt(pc.committedAt)}</p>
                <dl className="idea-locked" style={{ margin: "10px 0 0" }}>
                  <div style={{ marginBottom: 6 }}>
                    <strong>측정</strong> — {pc.metric}
                  </div>
                  <div style={{ marginBottom: 6 }}>
                    <strong>기준</strong> — {pc.threshold}
                    {pc.unit} 이상이면 계속
                  </div>
                  {pc.deadline && (
                    <div>
                      <strong>마감</strong> — {pc.deadline}
                    </div>
                  )}
                </dl>
                <div className="btn-row" style={{ marginTop: 12 }}>
                  <button className="btn ghost" onClick={editCriteria}>
                    기준 바꾸기
                  </button>
                </div>
              </>
            )}

            {pc.changeLog.length > 0 && (
              <div className="notice warn" style={{ marginTop: 14 }}>
                <b>기준 변경 기록</b>
                {pc.changeLog.map((c, i) => (
                  <div key={i} style={{ fontSize: 13, marginTop: 4 }}>
                    {fmt(c.at)} · 이전 기준: {c.fromMetric} / {c.fromThreshold}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 3) record result + verdict */}
          {locked && (
            <div className="block">
              <h3>결과를 기록하고 판정 받기</h3>
              <div className="field">
                <label htmlFor="result">실제 결과 값 ({pc.unit})</label>
                <span className="fhint">
                  실험이 끝난 뒤 실제 숫자를 입력하세요. 판정은 기분이 아니라 잠근 기준이 합니다.
                </span>
                <input
                  id="result"
                  type="number"
                  min={0}
                  value={resultInput}
                  onChange={(e) => setResultInput(e.target.value)}
                />
              </div>
              <button
                className="btn primary"
                onClick={decide}
                disabled={resultInput.trim() === ""}
              >
                판정 받기
              </button>

              {out.verdict && (
                <div style={{ marginTop: 18 }}>
                  <div className={`big-verdict ${out.verdict}`}>
                    <div className="v">{out.verdict}</div>
                    <p>{VERDICTS[out.verdict]}</p>
                  </div>
                  <p style={{ fontSize: 13, color: "var(--ink-faint)", textAlign: "center" }}>
                    결과 {out.resultValue}
                    {pc.unit} · 기준 {pc.threshold}
                    {pc.unit} · {fmt(out.decidedAt)}
                  </p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
