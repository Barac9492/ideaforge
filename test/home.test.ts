// Run: node --experimental-strip-types test/home.test.ts
import assert from "node:assert/strict";
import { getHomeAction } from "../lib/home.ts";
import { HERO } from "../lib/lessons.ts";
import type { Progress } from "../lib/store";
import type { HomeAction } from "../lib/home";

let passed = 0;
function test(name: string, fn: () => void) {
  fn();
  passed++;
  console.log(`  ✓ ${name}`);
}

// Explicit truth table: bits are step1, step2, step3, step4, respectively.
// Includes partially cleared / non-sequential saved progress, not only happy paths.
const cases: [string, HomeAction][] = [
  ["0000", { view: "step1", label: "내 경험부터 정리하기" }],
  ["0001", { view: "step1", label: "내 경험부터 정리하기" }],
  ["0010", { view: "step4", label: "현실 실험 설계하기" }],
  ["0011", { view: "step4", label: "실험 기록 확인하기" }],
  ["0100", { view: "step3", label: "압박 테스트 이어가기" }],
  ["0101", { view: "step3", label: "압박 테스트 이어가기" }],
  ["0110", { view: "step4", label: "현실 실험 설계하기" }],
  ["0111", { view: "step4", label: "실험 기록 확인하기" }],
  ["1000", { view: "step2", label: "아이디어 이어서 찾기" }],
  ["1001", { view: "step2", label: "아이디어 이어서 찾기" }],
  ["1010", { view: "step4", label: "현실 실험 설계하기" }],
  ["1011", { view: "step4", label: "실험 기록 확인하기" }],
  ["1100", { view: "step3", label: "압박 테스트 이어가기" }],
  ["1101", { view: "step3", label: "압박 테스트 이어가기" }],
  ["1110", { view: "step4", label: "현실 실험 설계하기" }],
  ["1111", { view: "step4", label: "실험 기록 확인하기" }],
];

for (const [bits, expected] of cases) {
  test(`home action for progress ${bits}`, () => {
    const progress: Progress = Object.freeze({
      step1: bits[0] === "1",
      step2: bits[1] === "1",
      step3: bits[2] === "1",
      step4: bits[3] === "1",
    });
    const before = { ...progress };
    assert.deepEqual(getHomeAction(progress), expected);
    assert.deepEqual(progress, before, "must not mutate saved progress");
  });
}

test("hero title matches the approved copy exactly", () => {
  assert.equal(HERO.title, "내 경험에서 창업 아이디어를 찾고, 현실에서 확인할 실험을 설계하세요.");
});

test("hero body matches the approved copy exactly", () => {
  assert.equal(HERO.body, "해온 일과 직접 겪은 문제에서 아이디어를 찾고, 핵심 가정을 점검합니다. 마지막에는 실제 사람에게 무엇을 어떻게 확인할지 정리합니다. 설계한 실험은 직접 실행해 주세요.");
});

test("access note states the API-key boundary without promising free AI", () => {
  assert.equal(HERO.accessNote, "경험 정리는 API 키 없이 시작할 수 있습니다. 본인 Anthropic API 키로 AI를 실행하면 사용료가 발생합니다.");
});

console.log(`\n${passed} tests passed.`);
