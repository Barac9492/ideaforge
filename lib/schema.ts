import type { Evaluation, Idea, Inventory, MistakeCheck, QuestionCheck, SignalCheck } from "./store";

// Guards that normalize model JSON into trusted shapes.
// SchemaError  => malformed output (worth a retry / generic error).
// InsufficientInputError => the model legitimately couldn't ground ideas;
//                           the USER should make their material more specific.

export class SchemaError extends Error {}
export class InsufficientInputError extends Error {}

const s = (v: unknown): string => (typeof v === "string" ? v.trim() : "");
const arr = (v: unknown): any[] => (Array.isArray(v) ? v : []);

export const ANCHOR_KEYS: (keyof Inventory)[] = [
  "career",
  "strength",
  "problemLived",
  "unfairAccess",
  "constraints",
];

const normRecipe = (r: string): string => r.trim().toLowerCase().replace(/\s+/g, " ");

// Exactly 3 ideas, each grounded in >=2 DISTINCT anchors that map to NONEMPTY
// inventory fields, and all 3 recipes distinct. Otherwise SchemaError.
// An explicitly empty ideas array => InsufficientInputError (not a retry).
export function normalizeIdeas(raw: any, inventory: Partial<Inventory>): Idea[] {
  if (!raw || !Array.isArray(raw.ideas)) throw new SchemaError("ideas not an array");
  if (raw.ideas.length === 0) throw new InsufficientInputError("model returned no ideas");

  const nonEmptyFields = new Set(
    ANCHOR_KEYS.filter((k) => s((inventory as any)?.[k]).length > 0)
  );

  const cleaned: Idea[] = [];
  for (const it of raw.ideas) {
    const title = s(it?.title);
    const oneLiner = s(it?.oneLiner);
    if (!title || !oneLiner) continue;

    // distinct, recognized, grounded-in-nonempty-field anchors
    const anchors = Array.from(
      new Set(arr(it?.anchoredTo).map((a) => s(a)))
    ).filter((a) => (ANCHOR_KEYS as string[]).includes(a) && nonEmptyFields.has(a as keyof Inventory));
    if (anchors.length < 2) continue;

    cleaned.push({
      title,
      oneLiner,
      recipe: s(it?.recipe),
      anchoredTo: anchors,
      founderFit: s(it?.founderFit),
      koreaReality: s(it?.koreaReality),
      whyNow: s(it?.whyNow),
      biggestRisk: s(it?.biggestRisk),
      firstCheck: s(it?.firstCheck),
    });
  }

  if (cleaned.length !== 3) throw new SchemaError(`expected 3 grounded ideas, got ${cleaned.length}`);

  const recipes = new Set(cleaned.map((c) => normRecipe(c.recipe)).filter((r) => r.length > 0));
  if (recipes.size !== 3) throw new SchemaError("ideas must use 3 distinct recipes");

  return cleaned;
}

const MIST_VERDICTS = ["pass", "warn", "fail"];
const Q_VERDICTS = ["yes", "mixed", "no", "unknown"];
export const CANON_FOUNDER_FIT = "창업자-시장 적합성";

// Exactly 4 mistakes, 10 questions, 3 signals — else SchemaError.
// Founder-market-fit is flagged by canonical name (fallback: first question).
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
      return { q: question, verdict, note: s(q?.note), nextAction: s(q?.nextAction), isFounderFit: false };
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

  if (
    mistakes.length !== 4 ||
    questions.length !== 10 ||
    signals.length !== 3 ||
    !verdict ||
    !testNext
  ) {
    throw new SchemaError("evaluation shape incomplete");
  }

  // Identify founder-market-fit by canonical name, not blindly index 0.
  let ffIdx = questions.findIndex((q) => q.q.replace(/\s+/g, "") === CANON_FOUNDER_FIT.replace(/\s+/g, ""));
  if (ffIdx === -1) ffIdx = questions.findIndex((q) => q.q.includes("적합성"));
  if (ffIdx === -1) ffIdx = 0;
  questions[ffIdx].isFounderFit = true;

  return { mistakes, questions, signals, verdict, testNext, paperOnly: true };
}
