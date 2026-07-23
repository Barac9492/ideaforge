"use client";

import { useEffect, useState } from "react";
import StepHeader from "./StepHeader";
import { ACCESS, EMPTY, INVENTORY_FIELDS } from "@/lib/lessons";
import { callIdea, openAdvanced } from "@/lib/api";
import { KEYS, load, save, type Idea, type Inventory } from "@/lib/store";
import type { View } from "@/lib/nav";

const FIELD_LABEL: Record<string, string> = Object.fromEntries(
  INVENTORY_FIELDS.map((f) => [f.key, f.label])
);
const FREE_ON = process.env.NEXT_PUBLIC_FREE_TIER === "1";

export default function Step2Ideas({ go }: { go: (v: View) => void }) {
  const [inv, setInv] = useState<Inventory | null>(null);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [goInventory, setGoInventory] = useState(false);
  const [directOpen, setDirectOpen] = useState(false);
  const [direct, setDirect] = useState("");

  useEffect(() => {
    setInv(load<Inventory | null>(KEYS.inventory, null));
    setIdeas(load<Idea[]>(KEYS.ideas, []));
  }, []);

  const hasInventory = !!inv && inv.problemLived.trim().length > 0;
  const noProblem = !!inv && inv.problemLived.trim() === "없음";

  function pickIdea(text: string) {
    save(KEYS.selectedIdea, text);
    go("step3");
  }

  async function generate() {
    if (!inv) return;
    setLoading(true);
    setError(null);
    setGoInventory(false);
    const res = await callIdea({ mode: "generate", inventory: inv });
    setLoading(false);
    if (!res.ok) {
      setError(res.error || "생성에 실패했습니다.");
      if (res.needKey) openAdvanced();
      if (res.needInventory) setGoInventory(true);
      return;
    }
    if (res.data?.observation) return; // handled by empty-state UI
    const list: Idea[] = res.data?.ideas || [];
    setIdeas(list);
    save(KEYS.ideas, list);
  }

  // ── gates ────────────────────────────────────────────────────────────
  if (inv !== null && !hasInventory) {
    return (
      <div>
        <StepHeader n={2} onBack={() => go("home")} />
        <div className="notice info">{EMPTY.noInventory}</div>
        <button className="btn primary" onClick={() => go("step1")}>
          1단계로 가기 →
        </button>
      </div>
    );
  }

  return (
    <div>
      <StepHeader n={2} onBack={() => go("home")} />
      <h2 className="step-title">아이디어</h2>
      <p className="step-sub">당신의 재료에서만 꺼냅니다. 각 아이디어는 입력 중 최소 두 가지를 근거로 삼습니다.</p>

      <div className="access-bar">{FREE_ON ? ACCESS.freeOn : ACCESS.freeOff}</div>

      {noProblem ? (
        <div className="notice warn">
          <b>{EMPTY.noProblemTitle}</b>
          <br />
          {EMPTY.noProblemBody}
        </div>
      ) : (
        <div className="btn-row" style={{ marginBottom: 8 }}>
          <button className="btn primary lg" onClick={generate} disabled={loading}>
            {loading ? "재료에서 꺼내는 중…" : "재료로 아이디어 3개 꺼내기"}
          </button>
        </div>
      )}

      {error && (
        <div className="notice err" style={{ marginTop: 14 }}>
          {error}
          {goInventory && (
            <div className="btn-row" style={{ marginTop: 10 }}>
              <button className="btn" onClick={() => go("step1")}>
                1단계에서 재료 다듬기 →
              </button>
            </div>
          )}
        </div>
      )}

      {ideas.length > 0 && (
        <div className="cards" style={{ marginTop: 22 }}>
          {ideas.map((idea, i) => (
            <div className="idea" key={i}>
              <h3>{idea.title}</h3>
              <p className="one">{idea.oneLiner}</p>
              {idea.anchoredTo.length > 0 && (
                <div className="anchors">
                  {idea.anchoredTo.map((a) => (
                    <span className="tag" key={a}>
                      {FIELD_LABEL[a] || a}
                    </span>
                  ))}
                </div>
              )}
              <dl>
                {idea.founderFit && (
                  <div>
                    <dt>왜 당신</dt>
                    <dd>{idea.founderFit}</dd>
                  </div>
                )}
                {idea.koreaReality && (
                  <div>
                    <dt>한국 현실</dt>
                    <dd>{idea.koreaReality}</dd>
                  </div>
                )}
                {idea.recipe && (
                  <div>
                    <dt>레시피</dt>
                    <dd>{idea.recipe}</dd>
                  </div>
                )}
                {idea.whyNow && (
                  <div>
                    <dt>왜 지금</dt>
                    <dd>{idea.whyNow}</dd>
                  </div>
                )}
                {idea.biggestRisk && (
                  <div>
                    <dt>가장 큰 리스크</dt>
                    <dd className="risk">{idea.biggestRisk}</dd>
                  </div>
                )}
              </dl>
              {idea.firstCheck && (
                <div className="firstcheck">
                  <b>이번 주 30분 확인</b> — {idea.firstCheck}
                </div>
              )}
              <button className="btn primary block" onClick={() => pickIdea(`${idea.title} — ${idea.oneLiner}`)}>
                이 아이디어로 압박 테스트 →
              </button>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 26, borderTop: "1px solid var(--line)", paddingTop: 20 }}>
        {!directOpen ? (
          <button className="link-btn" onClick={() => setDirectOpen(true)}>
            이미 아이디어가 있어요 — 직접 입력하기
          </button>
        ) : (
          <div className="field">
            <label htmlFor="direct">내 아이디어 직접 입력</label>
            <span className="fhint">한두 문장이면 충분합니다.</span>
            <textarea
              id="direct"
              rows={3}
              value={direct}
              onChange={(e) => setDirect(e.target.value)}
              placeholder="예: 중고 명품 감정을 카톡으로 대신 받아주는 서비스"
            />
            <div className="btn-row">
              <button
                className="btn primary"
                disabled={!direct.trim()}
                onClick={() => pickIdea(direct.trim())}
              >
                이 아이디어로 압박 테스트 →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
