// Focused unit tests for the two riskiest pure functions.
// Run: node --experimental-strip-types test/logic.test.ts
import assert from "node:assert";
import { normalizeIdeas, normalizeEvaluation, SchemaError } from "../lib/schema.ts";
import { decideVerdict } from "../lib/verdict.ts";

let passed = 0;
function test(name: string, fn: () => void) {
  fn();
  passed++;
  console.log(`  ✓ ${name}`);
}
function throws(fn: () => void) {
  try {
    fn();
  } catch (e) {
    return e instanceof SchemaError;
  }
  return false;
}

console.log("verdict:");
test("result at/over threshold => 계속", () => {
  assert.equal(decideVerdict(6, 6), "계속");
  assert.equal(decideVerdict(6, 9), "계속");
});
test("half..threshold => 수정", () => {
  assert.equal(decideVerdict(6, 3), "수정");
  assert.equal(decideVerdict(6, 5), "수정");
});
test("below half => 중단", () => {
  assert.equal(decideVerdict(6, 2), "중단");
  assert.equal(decideVerdict(10, 4), "중단");
});

console.log("normalizeIdeas:");
test("keeps valid ideas, filters anchors, caps at 3", () => {
  const raw = {
    ideas: [
      { title: "A", oneLiner: "x", anchoredTo: ["career", "bogus", "unfairAccess"], firstCheck: "f" },
      { title: "B", oneLiner: "y", anchoredTo: [] },
      { title: "C", oneLiner: "z" },
      { title: "D", oneLiner: "w" },
    ],
  };
  const out = normalizeIdeas(raw);
  assert.equal(out.length, 3);
  assert.deepEqual(out[0].anchoredTo, ["career", "unfairAccess"]);
});
test("drops items missing title/oneLiner", () => {
  const out = normalizeIdeas({ ideas: [{ title: "", oneLiner: "y" }, { title: "Ok", oneLiner: "z" }] });
  assert.equal(out.length, 1);
});
test("throws SchemaError when zero valid ideas", () => {
  assert.ok(throws(() => normalizeIdeas({ ideas: [{ title: "" }] })));
  assert.ok(throws(() => normalizeIdeas({})));
});

console.log("normalizeEvaluation:");
const goodEval = {
  mistakes: [
    { name: "m1", verdict: "pass", note: "" },
    { name: "m2", verdict: "warn", note: "" },
    { name: "m3", verdict: "fail", note: "" },
    { name: "m4", verdict: "bad-value", note: "" },
  ],
  questions: Array.from({ length: 10 }, (_, i) => ({
    q: `q${i}`,
    verdict: i === 0 ? "unknown" : "yes",
    note: "",
    nextAction: "",
  })),
  signals: [
    { name: "s1", present: true, note: "" },
    { name: "s2", present: false, note: "" },
    { name: "s3", present: true, note: "" },
  ],
  verdict: "총평",
  testNext: "다음",
};
test("normalizes valid evaluation, coerces bad verdict, sets paperOnly", () => {
  const out = normalizeEvaluation(goodEval);
  assert.equal(out.mistakes.length, 4);
  assert.equal(out.mistakes[3].verdict, "warn"); // coerced from bad value
  assert.equal(out.questions[0].verdict, "unknown");
  assert.equal(out.paperOnly, true);
});
test("throws when structure incomplete", () => {
  assert.ok(throws(() => normalizeEvaluation({ ...goodEval, mistakes: [] })));
  assert.ok(throws(() => normalizeEvaluation({ ...goodEval, verdict: "" })));
  assert.ok(throws(() => normalizeEvaluation({ ...goodEval, questions: [{ q: "only-one" }] })));
});

console.log(`\n${passed} tests passed.`);
