// Pure, deterministic verdict: the criteria decide, not the user's mood.
export type Verdict = "계속" | "수정" | "중단";

export function decideVerdict(threshold: number, result: number): Verdict {
  if (result >= threshold) return "계속";
  if (result >= threshold * 0.5) return "수정";
  return "중단";
}
