// Client-side store. No accounts, no DB — everything lives in localStorage.

export type Inventory = {
  career: string;
  strength: string;
  problemLived: string;
  unfairAccess: string;
  constraints: string;
};

export type Idea = {
  title: string;
  oneLiner: string;
  recipe: string;
  anchoredTo: string[];
  founderFit: string;
  koreaReality: string;
  whyNow: string;
  biggestRisk: string;
  firstCheck: string;
};

export type MistakeCheck = { name: string; verdict: "pass" | "warn" | "fail"; note: string };
export type QuestionCheck = {
  q: string;
  verdict: "yes" | "mixed" | "no" | "unknown";
  note: string;
  nextAction: string;
};
export type SignalCheck = { name: string; present: boolean; note: string };
export type Evaluation = {
  mistakes: MistakeCheck[];
  questions: QuestionCheck[];
  signals: SignalCheck[];
  verdict: string;
  testNext: string;
  paperOnly: boolean;
};

export type ExperimentKind = "interview" | "landing" | "concierge";

export type PreCommit = {
  experiment: ExperimentKind | "";
  metric: string;
  threshold: number;
  unit: string;
  deadline: string;
  committedAt: string;
  changeLog: { at: string; fromThreshold: number; fromMetric: string }[];
};

export type Outcome = {
  resultValue: number | null;
  verdict: "계속" | "수정" | "중단" | "";
  decidedAt: string;
};

export const KEYS = {
  inventory: "ideaforge.inventory",
  ideas: "ideaforge.ideas",
  selectedIdea: "ideaforge.selectedIdea", // the idea text going into step 3
  evaluation: "ideaforge.evaluation",
  precommit: "ideaforge.precommit",
  outcome: "ideaforge.outcome",
  apiKey: "ideaforge.apiKey",
} as const;

export function load<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function save<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export function remove(key: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(key);
  } catch {}
}

export type Progress = { step1: boolean; step2: boolean; step3: boolean; step4: boolean };

export function computeProgress(): Progress {
  const inv = load<Inventory | null>(KEYS.inventory, null);
  const step1 = !!inv && inv.problemLived.trim().length > 0;

  const ideas = load<Idea[]>(KEYS.ideas, []);
  const selected = load<string>(KEYS.selectedIdea, "");
  const step2 = ideas.length > 0 || selected.trim().length > 0;

  const evaluation = load<Evaluation | null>(KEYS.evaluation, null);
  const step3 = !!evaluation;

  const outcome = load<Outcome | null>(KEYS.outcome, null);
  const step4 = !!outcome && outcome.verdict !== "";

  return { step1, step2, step3, step4 };
}
