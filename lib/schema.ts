import type { Evaluation, Idea, MistakeCheck, QuestionCheck, SignalCheck } from "./store";

// Guards that normalize model JSON into trusted shapes. On irrecoverable
// output they throw SchemaError, which the route turns into a Korean message.

export class SchemaError extends Error {}

const s = (v: unknown): string => (typeof v === "string" ? v.trim() : "");
const arr = (v: unknown): any[] => (Array.isArray(v) ? v : []);

const ANCHOR_KEYS = ["career", "strength", "problemLived", "unfairAccess", "constraints"];

export function normalizeIdeas(raw: any): Idea[] {
  const list = arr(raw?.ideas)
    .map((it): Idea | null => {
      const title = s(it?.title);
      const oneLiner = s(it?.oneLiner);
      if (!title || !oneLiner) return null;
      const anchoredTo = arr(it?.anchoredTo)
        .map((a) => s(a))
        .filter((a) => ANCHOR_KEYS.includes(a));
      return {
        title,
        oneLiner,
        recipe: s(it?.recipe),
        anchoredTo,
        founderFit: s(it?.founderFit),
        koreaReality: s(it?.koreaReality),
        whyNow: s(it?.whyNow),
        biggestRisk: s(it?.biggestRisk),
        firstCheck: s(it?.firstCheck),
      };
    })
    .filter((x): x is Idea => x !== null);

  if (list.length === 0) throw new SchemaError("no valid ideas");
  return list.slice(0, 3);
}

const MIST_VERDICTS = ["pass", "warn", "fail"];
const Q_VERDICTS = ["yes", "mixed", "no", "unknown"];

export function normalizeEvaluation(raw: any): Evaluation {
  const mistakes: MistakeCheck[] = arr(raw?.mistakes)
    .map((m): MistakeCheck | null => {
      const name = s(m?.name);
      if (!name) return null;
      const verdict = MIST_VERDICTS.includes(m?.verdict) ? m.verdict : "warn";
      return { name, verdict, note: s(m?.note) };
    })
    .filter((x): x is MistakeCheck => x !== null);

  const questions: QuestionCheck[] = arr(raw?.questions)
    .map((q): QuestionCheck | null => {
      const question = s(q?.q);
      if (!question) return null;
      const verdict = Q_VERDICTS.includes(q?.verdict) ? q.verdict : "mixed";
      return { q: question, verdict, note: s(q?.note), nextAction: s(q?.nextAction) };
    })
    .filter((x): x is QuestionCheck => x !== null);

  const signals: SignalCheck[] = arr(raw?.signals)
    .map((sig): SignalCheck | null => {
      const name = s(sig?.name);
      if (!name) return null;
      return { name, present: !!sig?.present, note: s(sig?.note) };
    })
    .filter((x): x is SignalCheck => x !== null);

  const verdict = s(raw?.verdict);
  const testNext = s(raw?.testNext);

  // The framework needs enough structure to be meaningful.
  if (mistakes.length < 3 || questions.length < 6 || !verdict || !testNext) {
    throw new SchemaError("evaluation shape incomplete");
  }

  return { mistakes, questions, signals, verdict, testNext, paperOnly: true };
}
