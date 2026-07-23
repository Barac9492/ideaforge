"use client";

import { useEffect, useState } from "react";
import StepHeader from "./StepHeader";
import { EXPERIMENTS, VERDICTS } from "@/lib/lessons";
import { KEYS, load, save, type Outcome, type PreCommit } from "@/lib/store";
import {
  EXPERIMENT_META,
  evaluateResult,
  isDeadlinePassed,
  validatePrecommit,
  type ExperimentKind,
  type ResultInputs,
} from "@/lib/verdict";
import type { View } from "@/lib/nav";

const EMPTY_PC: PreCommit = {
  experiment: "",
  threshold: 0,
  unit: "",
  deadline: "",
  committedAt: "",
  changeLog: [],
};
const EMPTY_OUT: Outcome = { computed: null, verdict: "", decidedAt: "" };

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
  const [history, setHistory] = useState<Outcome[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [todayISO, setTodayISO] = useState("");

  // per-experiment result inputs
  const [completedIn, setCompletedIn] = useState("");
  const [positivesIn, setPositivesIn] = useState("");
  const [visitorsIn, setVisitorsIn] = useState("");
  const [signupsIn, setSignupsIn] = useState("");

  const [pcError, setPcError] = useState<string | null>(null);
  const [resultError, setResultError] = useState<string | null>(null);

  useEffect(() => {
    setIdea(load<string>(KEYS.selectedIdea, ""));
    setPc(load<PreCommit>(KEYS.precommit, EMPTY_PC));
    setOut(load<Outcome>(KEYS.outcome, EMPTY_OUT));
    setHistory(load<Outcome[]>(KEYS.outcomeHistory, []));
    setTodayISO(nowIso());
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
  function persistHistory(next: Outcome[]) {
    setHistory(next);
    if (hydrated) save(KEYS.outcomeHistory, next);
  }

  const locked = pc.committedAt !== "";
  const hasVerdict = out.verdict !== "";
  const canPickExperiment = !locked && !hasVerdict;
  const meta = pc.experiment ? EXPERIMENT_META[pc.experiment] : null;
  const specCopy = pc.experiment ? EXPERIMENTS.find((e) => e.kind === pc.experiment) : null;
  const deadlinePassed = locked && isDeadlinePassed(pc.deadline, todayISO);

  function chooseExperiment(kind: ExperimentKind) {
    if (!canPickExperiment) return;
    const m = EXPERIMENT_META[kind];
    persistPc({
      experiment: kind,
      threshold: m.defaultThreshold,
      unit: m.unit,
      deadline: pc.deadline,
      committedAt: "",
      changeLog: pc.changeLog,
    });
    setPcError(null);
    setResultError(null);
  }

  function lock() {
    const check = validatePrecommit({
      experiment: pc.experiment,
      threshold: pc.threshold,
      deadline: pc.deadline,
      todayISO: nowIso(),
    });
    if (!check.ok) {
      setPcError(check.message);
      return;
    }
    setPcError(null);
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
        { at: nowIso(), fromThreshold: pc.threshold, fromExperiment: pc.experiment },
      ],
    });
  }

  function decide() {
    if (!pc.experiment) return;
    setResultError(null);
    let inputs: ResultInputs;
    if (pc.experiment === "interview" || pc.experiment === "concierge") {
      if (completedIn.trim() === "" || positivesIn.trim() === "") {
        setResultError("완료 수와 성공 수를 모두 입력해 주세요.");
        return;
      }
      inputs = {
        experiment: pc.experiment,
        completed: Number(completedIn),
        positives: Number(positivesIn),
      };
    } else {
      if (visitorsIn.trim() === "" || signupsIn.trim() === "") {
        setResultError("방문자 수와 신청 수를 모두 입력해 주세요.");
        return;
      }
      inputs = { experiment: "landing", visitors: Number(visitorsIn), signups: Number(signupsIn) };
    }
    const res = evaluateResult(pc.threshold, inputs);
    if (!res.ok) {
      setResultError(res.message);
      return;
    }
    const record: Outcome = {
      computed: res.computed,
      verdict: res.verdict,
      decidedAt: nowIso(),
      ...(pc.experiment === "landing"
        ? { visitors: Number(visitorsIn), signups: Number(signupsIn) }
        : { completed: Number(completedIn), positives: Number(positivesIn) }),
    };
    persistOut(record);
  }

  function reopen() {
    if (!window.confirm("이미 나온 판정을 다시 기록하시겠어요? 이전 판정은 기록으로 보관됩니다."))
      return;
    persistHistory([...history, out]);
    persistOut(EMPTY_OUT);
    setCompletedIn("");
    setPositivesIn("");
    setVisitorsIn("");
    setSignupsIn("");
    setResultError(null);
  }

  const isLanding = pc.experiment === "landing";
  const sampleTarget = meta?.targetSample ?? 0;

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

      <h3 style={{ fontFamily: "var(--serif)", fontSize: 18, margin: "22px 0 12px" }}>
        어떤 실험을 할까요?
      </h3>
      <div className="exp-grid">
        {EXPERIMENTS.map((e) => (
          <button
            key={e.kind}
            className={`exp${pc.experiment === e.kind ? " sel" : ""}`}
            onClick={() => chooseExperiment(e.kind)}
            disabled={!canPickExperiment}
            title={!canPickExperiment ? "기준이 잠겨 있습니다. ‘기준 바꾸기’로 먼저 여세요." : ""}
          >
            <h4>{e.name}</h4>
            <p>{e.summary}</p>
          </button>
        ))}
      </div>
      {!canPickExperiment && (
        <p className="hint-line">기준이 잠겨 실험은 바꿀 수 없습니다. 바꾸려면 아래 ‘기준 바꾸기’를 누르세요.</p>
      )}

      {meta && specCopy && (
        <>
          <ul className="how-list">
            {specCopy.how.map((h, i) => (
              <li key={i}>{h}</li>
            ))}
          </ul>

          {/* pre-commit */}
          <div className="block" style={{ marginTop: 20 }}>
            <h3>시작 전에 기준을 잠급니다</h3>
            {!locked ? (
              <>
                <div className="field">
                  <label htmlFor="threshold">{meta.thresholdLabel}</label>
                  <span className="fhint">이 값을 못 넘으면 접습니다. 지금 정직하게 정하세요.</span>
                  <input
                    id="threshold"
                    type="number"
                    min={0}
                    max={isLanding ? 100 : sampleTarget}
                    value={pc.threshold || ""}
                    onChange={(e) => persistPc({ ...pc, threshold: Number(e.target.value) })}
                  />
                </div>
                <div className="field">
                  <label htmlFor="deadline">마감일 (오늘 이후)</label>
                  <input
                    id="deadline"
                    type="date"
                    value={pc.deadline}
                    onChange={(e) => persistPc({ ...pc, deadline: e.target.value })}
                  />
                </div>
                {pcError && <div className="notice err">{pcError}</div>}
                <button className="btn primary" onClick={lock}>
                  🔒 기준 잠그기
                </button>
              </>
            ) : (
              <>
                <p className="locked-tag">🔒 기준 잠금됨 · {fmt(pc.committedAt)}</p>
                <div style={{ margin: "10px 0 0" }}>
                  <div style={{ marginBottom: 6 }}>
                    <strong>실험</strong> — {specCopy.name} (표본 {isLanding ? "방문자 기준" : `${sampleTarget}${meta.unit}`})
                  </div>
                  <div style={{ marginBottom: 6 }}>
                    <strong>기준</strong> — {pc.threshold}
                    {meta.unit} 이상이면 계속
                  </div>
                  <div>
                    <strong>마감</strong> — {pc.deadline}
                  </div>
                </div>
                {deadlinePassed && (
                  <div className="notice warn" style={{ marginTop: 12 }}>
                    마감일이 지났습니다. 결과를 기록하고 판정을 받으세요.
                  </div>
                )}
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
                    {fmt(c.at)} · 이전: {c.fromExperiment || "-"} / 기준 {c.fromThreshold}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* result + verdict */}
          {locked && !hasVerdict && (
            <div className="block">
              <h3>결과를 기록하고 판정 받기</h3>
              <span className="fhint" style={{ display: "block", marginBottom: 14 }}>
                실험이 끝난 뒤 실제 숫자를 입력하세요. 판정은 기분이 아니라 잠근 기준이 합니다.
              </span>
              {isLanding ? (
                <>
                  <div className="field">
                    <label htmlFor="visitors">방문자 수</label>
                    <input
                      id="visitors"
                      type="number"
                      min={0}
                      value={visitorsIn}
                      onChange={(e) => setVisitorsIn(e.target.value)}
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="signups">사전신청 수</label>
                    <input
                      id="signups"
                      type="number"
                      min={0}
                      value={signupsIn}
                      onChange={(e) => setSignupsIn(e.target.value)}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="field">
                    <label htmlFor="completed">완료한 수 (최대 {sampleTarget})</label>
                    <input
                      id="completed"
                      type="number"
                      min={0}
                      max={sampleTarget}
                      value={completedIn}
                      onChange={(e) => setCompletedIn(e.target.value)}
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="positives">
                      {pc.experiment === "interview"
                        ? "그 중 과거에 돈·시간을 쓴 사람 수"
                        : "그 중 돈을 낸 건수"}
                    </label>
                    <input
                      id="positives"
                      type="number"
                      min={0}
                      value={positivesIn}
                      onChange={(e) => setPositivesIn(e.target.value)}
                    />
                  </div>
                </>
              )}
              {resultError && <div className="notice err">{resultError}</div>}
              <button className="btn primary" onClick={decide}>
                판정 받기
              </button>
            </div>
          )}

          {hasVerdict && (
            <div className="block">
              <h3>판정</h3>
              <div className={`big-verdict ${out.verdict}`}>
                <div className="v">{out.verdict}</div>
                <p>{VERDICTS[out.verdict as "계속" | "수정" | "중단"]}</p>
              </div>
              <p style={{ fontSize: 13, color: "var(--ink-faint)", textAlign: "center" }}>
                {isLanding
                  ? `방문 ${out.visitors} · 신청 ${out.signups} · 전환율 ${out.computed}% · 기준 ${pc.threshold}%`
                  : `완료 ${out.completed}${meta.unit} · 성공 ${out.positives}${meta.unit} · 기준 ${pc.threshold}${meta.unit}`}{" "}
                · {fmt(out.decidedAt)}
              </p>
              <div className="btn-row" style={{ marginTop: 14, justifyContent: "center" }}>
                <button className="btn ghost" onClick={reopen}>
                  결과 다시 기록
                </button>
              </div>
            </div>
          )}

          {history.length > 0 && (
            <div className="block">
              <h3>지난 판정 기록</h3>
              <div className="checks">
                {history.map((h, i) => (
                  <div key={i} className="check-row">
                    <span className={`pill ${h.verdict === "계속" ? "yes" : h.verdict === "수정" ? "mixed" : "no"}`}>
                      {h.verdict}
                    </span>
                    <div className="body">
                      <p>
                        {h.computed}
                        {isLanding ? "%" : meta.unit} · {fmt(h.decidedAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
