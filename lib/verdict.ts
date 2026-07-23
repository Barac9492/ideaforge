// Pure, deterministic Step-4 logic. Zero side effects, fully unit-tested.
// The locked criteria decide the verdict — never the user's mood.

export type Verdict = "계속" | "수정" | "중단";
export type ExperimentKind = "interview" | "landing" | "concierge";

export const EXPERIMENT_META: Record<
  ExperimentKind,
  { targetSample: number; unit: string; defaultThreshold: number; thresholdLabel: string }
> = {
  interview: {
    targetSample: 10,
    unit: "명",
    defaultThreshold: 6,
    thresholdLabel: "10명 중 '이 문제로 돈·시간을 쓴 적 있다'가 몇 명 이상이면 계속",
  },
  concierge: {
    targetSample: 5,
    unit: "건",
    defaultThreshold: 3,
    thresholdLabel: "5건 중 돈을 낸 건수가 몇 건 이상이면 계속",
  },
  landing: {
    targetSample: 0, // n/a — landing uses visitors/signups
    unit: "%",
    defaultThreshold: 10,
    thresholdLabel: "방문자 대비 신청률이 몇 % 이상이면 계속",
  },
};

export function decideVerdict(threshold: number, result: number): Verdict {
  if (result >= threshold) return "계속";
  if (result >= threshold * 0.5) return "수정";
  return "중단";
}

export type ResultInputs =
  | { experiment: "interview"; completed: number; positives: number }
  | { experiment: "concierge"; completed: number; positives: number }
  | { experiment: "landing"; visitors: number; signups: number };

export type ResultEval =
  | { ok: true; computed: number; verdict: Verdict }
  | { ok: false; message: string };

function num(v: unknown): number | null {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

export function evaluateResult(threshold: number, inputs: ResultInputs): ResultEval {
  if (inputs.experiment === "interview" || inputs.experiment === "concierge") {
    const target = EXPERIMENT_META[inputs.experiment].targetSample;
    const c = num(inputs.completed);
    const p = num(inputs.positives);
    if (c === null || p === null) return { ok: false, message: "숫자를 정확히 입력해 주세요." };
    if (!Number.isInteger(c) || !Number.isInteger(p))
      return { ok: false, message: "정수로 입력해 주세요." };
    if (c < 0 || p < 0) return { ok: false, message: "음수는 입력할 수 없습니다." };
    if (c > target) return { ok: false, message: `완료 수는 ${target}을(를) 넘을 수 없습니다.` };
    if (p > c) return { ok: false, message: "성공 수는 완료한 수보다 클 수 없습니다." };
    if (c < target)
      return {
        ok: false,
        message: `아직 ${target}개를 다 채우지 않았습니다 (현재 ${c}/${target}). 다 채운 뒤 판정하세요.`,
      };
    return { ok: true, computed: p, verdict: decideVerdict(threshold, p) };
  }
  // landing
  const v = num(inputs.visitors);
  const s = num(inputs.signups);
  if (v === null || s === null) return { ok: false, message: "숫자를 정확히 입력해 주세요." };
  if (!Number.isInteger(v) || !Number.isInteger(s))
    return { ok: false, message: "정수로 입력해 주세요." };
  if (v <= 0) return { ok: false, message: "방문자 수는 1 이상이어야 합니다." };
  if (s < 0) return { ok: false, message: "신청 수는 음수일 수 없습니다." };
  if (s > v) return { ok: false, message: "신청 수는 방문자 수보다 클 수 없습니다." };
  const pctRaw = (s / v) * 100;
  const pct = Math.max(0, Math.min(100, Math.round(pctRaw * 10) / 10));
  return { ok: true, computed: pct, verdict: decideVerdict(threshold, pct) };
}

export type PrecommitCheck = { ok: true } | { ok: false; message: string };

function dateOnly(iso: string): number {
  return new Date(iso.slice(0, 10) + "T00:00:00Z").getTime();
}

export function validatePrecommit(args: {
  experiment: string;
  threshold: number;
  deadline: string;
  todayISO: string;
}): PrecommitCheck {
  const { experiment, threshold, deadline, todayISO } = args;
  if (!experiment) return { ok: false, message: "실험을 먼저 선택하세요." };
  if (!(threshold > 0)) return { ok: false, message: "기준 값은 0보다 커야 합니다." };
  if (!deadline) return { ok: false, message: "마감일을 정하세요." };
  const d = dateOnly(deadline);
  const today = dateOnly(todayISO);
  if (Number.isNaN(d)) return { ok: false, message: "마감일이 올바르지 않습니다." };
  if (d <= today) return { ok: false, message: "마감일은 오늘 이후로 정하세요." };
  return { ok: true };
}

export function isDeadlinePassed(deadline: string, todayISO: string): boolean {
  if (!deadline) return false;
  return dateOnly(deadline) < dateOnly(todayISO);
}

// A self-describing outcome record (context captured at decision time).
export type OutcomeRecord = {
  experiment?: ExperimentKind;
  threshold?: number;
  unit?: string;
  completed?: number;
  positives?: number;
  visitors?: number;
  signups?: number;
  computed: number | null;
};

// Build the audit line from the RECORD's own context, so history stays correct
// even after the user switches experiment type. Backward-compatible with older
// records that lack experiment/unit/threshold.
export function formatOutcomeAudit(o: OutcomeRecord): string {
  const landing = o.experiment === "landing" || (o.experiment == null && o.visitors != null);
  const show = (n: number | null | undefined) => (n == null ? "-" : String(n));

  if (landing) {
    return `방문 ${show(o.visitors)} · 신청 ${show(o.signups)} · 전환율 ${show(o.computed)}% · 기준 ${
      o.threshold == null ? "-" : `${o.threshold}%`
    }`;
  }
  const unit = o.unit ?? ""; // older records may not know 명/건
  const withUnit = (n: number | null | undefined) => (n == null ? "-" : `${n}${unit}`);
  return `완료 ${withUnit(o.completed)} · 성공 ${withUnit(o.positives)} · 기준 ${
    o.threshold == null ? "-" : `${o.threshold}${unit}`
  }`;
}
