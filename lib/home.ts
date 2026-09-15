import type { Progress } from "./store";
import type { View } from "./nav";

export type HomeAction = {
  view: Exclude<View, "home">;
  label: string;
};

// Follow the highest supported stage, including non-sequential saved progress.
// An outcome alone must not bypass the existing step-4 prerequisite.
export function getHomeAction(progress: Progress): HomeAction {
  if (progress.step3) {
    return {
      view: "step4",
      label: progress.step4 ? "실험 기록 확인하기" : "현실 실험 설계하기",
    };
  }
  if (progress.step2) {
    return { view: "step3", label: "압박 테스트 이어가기" };
  }
  if (progress.step1) {
    return { view: "step2", label: "아이디어 이어서 찾기" };
  }
  return { view: "step1", label: "내 경험부터 정리하기" };
}
