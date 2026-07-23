// Focused unit tests for the pure logic behind schema guards, Step-4 verdicts,
// and free-tier gating. Run: node --experimental-strip-types test/logic.test.ts
import assert from "node:assert";
import {
  normalizeIdeas,
  normalizeEvaluation,
  SchemaError,
  InsufficientInputError,
} from "../lib/schema.ts";
import {
  decideVerdict,
  evaluateResult,
  validatePrecommit,
  isDeadlinePassed,
  formatOutcomeAudit,
} from "../lib/verdict.ts";
import { freeTierConfigured } from "../lib/freetier.ts";

let passed = 0;
function test(name: string, fn: () => void) {
  fn();
  passed++;
  console.log(`  ✓ ${name}`);
}
function throwsOf(ctor: any, fn: () => void): boolean {
  try {
    fn();
  } catch (e) {
    return e instanceof ctor;
  }
  return false;
}

const INV = {
  career: "이커머스 MD 7년",
  strength: "셀러 소싱",
  problemLived: "정산 수기 정리",
  unfairAccess: "셀러 데이터 접근",
  constraints: "퇴사 불가",
};
const idea = (recipe: string, anchoredTo: string[]) => ({
  title: "제목",
  oneLiner: "한 줄",
  recipe,
  anchoredTo,
});

console.log("normalizeIdeas (P0-1):");
test("exactly 3 grounded, distinct-recipe ideas pass", () => {
  const raw = {
    ideas: [
      idea("레시피1 팀 강점", ["career", "strength"]),
      idea("레시피2 직접 겪은 문제", ["problemLived", "unfairAccess"]),
      idea("레시피3 변형", ["constraints", "career"]),
    ],
  };
  const out = normalizeIdeas(raw, INV);
  assert.equal(out.length, 3);
  assert.deepEqual(out[0].anchoredTo, ["career", "strength"]);
});
test("1 or 2 ideas fail (SchemaError)", () => {
  assert.ok(throwsOf(SchemaError, () => normalizeIdeas({ ideas: [idea("a", ["career", "strength"])] }, INV)));
  assert.ok(
    throwsOf(SchemaError, () =>
      normalizeIdeas(
        { ideas: [idea("a", ["career", "strength"]), idea("b", ["problemLived", "unfairAccess"])] },
        INV
      )
    )
  );
});
test("an idea with <2 valid anchors is dropped -> not exactly 3 -> fail", () => {
  const raw = {
    ideas: [
      idea("a", ["career", "strength"]),
      idea("b", ["problemLived", "unfairAccess"]),
      idea("c", ["career"]),
    ],
  };
  assert.ok(throwsOf(SchemaError, () => normalizeIdeas(raw, INV)));
});
test("anchors pointing to EMPTY inventory fields don't count", () => {
  const inv2 = { ...INV, unfairAccess: "", constraints: "" };
  const raw = {
    ideas: [
      idea("a", ["career", "strength"]),
      idea("b", ["problemLived", "career"]),
      idea("c", ["unfairAccess", "constraints"]), // both empty -> dropped
    ],
  };
  assert.ok(throwsOf(SchemaError, () => normalizeIdeas(raw, inv2)));
});
test("duplicate recipe (case/space-insensitive) fails", () => {
  const raw = {
    ideas: [
      idea("같은 레시피", ["career", "strength"]),
      idea("같은  레시피 ", ["problemLived", "unfairAccess"]),
      idea("다른 레시피", ["constraints", "career"]),
    ],
  };
  assert.ok(throwsOf(SchemaError, () => normalizeIdeas(raw, INV)));
});
test("explicitly empty ideas array => InsufficientInputError (not a retry)", () => {
  assert.ok(throwsOf(InsufficientInputError, () => normalizeIdeas({ ideas: [] }, INV)));
});
test("non-array ideas => SchemaError", () => {
  assert.ok(throwsOf(SchemaError, () => normalizeIdeas({}, INV)));
});

console.log("decideVerdict:");
test("bands: >=t 계속, >=t/2 수정, else 중단", () => {
  assert.equal(decideVerdict(6, 6), "계속");
  assert.equal(decideVerdict(6, 3), "수정");
  assert.equal(decideVerdict(6, 2), "중단");
});

console.log("evaluateResult (P0-2):");
test("interview tiny sample (6/10) => no verdict, progress message", () => {
  const r = evaluateResult(6, { experiment: "interview", completed: 6, positives: 6 });
  assert.equal(r.ok, false);
  if (!r.ok) assert.match(r.message, /6\/10/);
});
test("interview impossible counts fail", () => {
  assert.equal(evaluateResult(6, { experiment: "interview", completed: 10, positives: 999 }).ok, false);
  assert.equal(evaluateResult(6, { experiment: "interview", completed: 999, positives: 1 }).ok, false);
});
test("interview complete: continue / revise / stop", () => {
  const cont = evaluateResult(6, { experiment: "interview", completed: 10, positives: 8 });
  const rev = evaluateResult(6, { experiment: "interview", completed: 10, positives: 3 });
  const stop = evaluateResult(6, { experiment: "interview", completed: 10, positives: 2 });
  assert.ok(cont.ok && cont.verdict === "계속");
  assert.ok(rev.ok && rev.verdict === "수정");
  assert.ok(stop.ok && stop.verdict === "중단");
});
test("concierge decides only after all 5", () => {
  assert.equal(evaluateResult(3, { experiment: "concierge", completed: 4, positives: 4 }).ok, false);
  const done = evaluateResult(3, { experiment: "concierge", completed: 5, positives: 3 });
  assert.ok(done.ok && done.verdict === "계속");
});
test("landing percentage computed in code, 1/1 => 100 => 계속", () => {
  const r = evaluateResult(10, { experiment: "landing", visitors: 1, signups: 1 });
  assert.ok(r.ok && r.computed === 100 && r.verdict === "계속");
});
test("landing impossible/edge inputs fail", () => {
  assert.equal(evaluateResult(10, { experiment: "landing", visitors: 0, signups: 0 }).ok, false);
  assert.equal(evaluateResult(10, { experiment: "landing", visitors: 5, signups: 9 }).ok, false);
});
test("landing low conversion => 중단", () => {
  const r = evaluateResult(10, { experiment: "landing", visitors: 100, signups: 4 });
  assert.ok(r.ok && r.computed === 4 && r.verdict === "중단");
});

console.log("validatePrecommit / deadline (P0-2):");
const TODAY = "2026-07-23T05:00:00Z";
test("missing deadline rejected", () => {
  assert.equal(
    validatePrecommit({ experiment: "interview", threshold: 6, deadline: "", todayISO: TODAY }).ok,
    false
  );
});
test("past or today deadline rejected; future accepted", () => {
  assert.equal(validatePrecommit({ experiment: "interview", threshold: 6, deadline: "2026-07-01", todayISO: TODAY }).ok, false);
  assert.equal(validatePrecommit({ experiment: "interview", threshold: 6, deadline: "2026-07-23", todayISO: TODAY }).ok, false);
  assert.equal(validatePrecommit({ experiment: "interview", threshold: 6, deadline: "2026-08-01", todayISO: TODAY }).ok, true);
});
test("threshold must be > 0", () => {
  assert.equal(validatePrecommit({ experiment: "interview", threshold: 0, deadline: "2026-08-01", todayISO: TODAY }).ok, false);
});
test("isDeadlinePassed", () => {
  assert.equal(isDeadlinePassed("2026-07-01", TODAY), true);
  assert.equal(isDeadlinePassed("2026-08-01", TODAY), false);
});

console.log("formatOutcomeAudit (history context):");
test("interview record renders from its own unit/threshold", () => {
  const line = formatOutcomeAudit({
    experiment: "interview",
    unit: "명",
    threshold: 6,
    completed: 10,
    positives: 8,
    computed: 8,
  });
  assert.equal(line, "완료 10명 · 성공 8명 · 기준 6명");
  assert.ok(!/  /.test(line)); // no doubled spaces
});
test("landing record renders percentage from its own context", () => {
  const line = formatOutcomeAudit({
    experiment: "landing",
    unit: "%",
    threshold: 10,
    visitors: 100,
    signups: 4,
    computed: 4,
  });
  assert.equal(line, "방문 100 · 신청 4 · 전환율 4% · 기준 10%");
});
test("a landing record still renders as landing even if 'current' experiment differs", () => {
  // The bug being fixed: history row must not borrow the current experiment's unit.
  const landingRow = formatOutcomeAudit({ experiment: "landing", unit: "%", threshold: 10, visitors: 50, signups: 5, computed: 10 });
  const interviewRow = formatOutcomeAudit({ experiment: "interview", unit: "명", threshold: 6, completed: 10, positives: 7, computed: 7 });
  assert.match(landingRow, /전환율 10%/);
  assert.match(interviewRow, /완료 10명/);
});
test("backward-compat: old record without experiment/unit is still readable", () => {
  const legacyInterview = formatOutcomeAudit({ completed: 10, positives: 6, computed: 6 } as any);
  assert.equal(legacyInterview, "완료 10 · 성공 6 · 기준 -");
  const legacyLanding = formatOutcomeAudit({ visitors: 100, signups: 3, computed: 3 } as any);
  assert.equal(legacyLanding, "방문 100 · 신청 3 · 전환율 3% · 기준 -");
});

console.log("freeTierConfigured (P0-4):");
const FULL_ENV = {
  ANTHROPIC_API_KEY: "x",
  UPSTASH_REDIS_REST_URL: "x",
  UPSTASH_REDIS_REST_TOKEN: "x",
  TURNSTILE_SECRET_KEY: "x",
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: "x",
} as any;
test("all five present => true", () => {
  assert.equal(freeTierConfigured(FULL_ENV), true);
});
test("missing ANY one (incl. Turnstile keys) => false", () => {
  for (const k of Object.keys(FULL_ENV)) {
    const env = { ...FULL_ENV };
    delete env[k];
    assert.equal(freeTierConfigured(env), false, `should be false without ${k}`);
  }
});

console.log("normalizeEvaluation (P0-5):");
const mk10 = (ffIndex: number) =>
  Array.from({ length: 10 }, (_, i) => ({
    q: i === ffIndex ? "창업자-시장 적합성" : `질문 ${i}`,
    verdict: i === ffIndex ? "unknown" : "yes",
    note: "",
    nextAction: "",
  }));
const goodEval = {
  mistakes: [
    { name: "문제 없는 솔루션", verdict: "pass", note: "" },
    { name: "타르핏", verdict: "warn", note: "" },
    { name: "첫 아이디어", verdict: "fail", note: "" },
    { name: "완벽 대기", verdict: "bad", note: "" },
  ],
  questions: mk10(3),
  signals: [
    { name: "슐렙", present: true, note: "" },
    { name: "지루", present: false, note: "" },
    { name: "경쟁", present: true, note: "" },
  ],
  verdict: "총평",
  testNext: "다음",
};
test("exactly 4/10/3 passes; founder-fit flagged by canonical name", () => {
  const out = normalizeEvaluation(goodEval);
  assert.equal(out.mistakes.length, 4);
  assert.equal(out.questions.length, 10);
  assert.equal(out.signals.length, 3);
  assert.equal(out.mistakes[3].verdict, "warn"); // coerced from "bad"
  const ff = out.questions.filter((q) => q.isFounderFit);
  assert.equal(ff.length, 1);
  assert.equal(ff[0].q, "창업자-시장 적합성");
  assert.equal(out.paperOnly, true);
});
test("wrong counts fail (3 mistakes / 9 questions / 2 signals)", () => {
  assert.ok(throwsOf(SchemaError, () => normalizeEvaluation({ ...goodEval, mistakes: goodEval.mistakes.slice(0, 3) })));
  assert.ok(throwsOf(SchemaError, () => normalizeEvaluation({ ...goodEval, questions: mk10(3).slice(0, 9) })));
  assert.ok(throwsOf(SchemaError, () => normalizeEvaluation({ ...goodEval, signals: goodEval.signals.slice(0, 2) })));
});

console.log(`\n${passed} tests passed.`);
