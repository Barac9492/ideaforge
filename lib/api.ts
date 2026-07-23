import { KEYS, load, type Inventory } from "./store";

export type IdeaApiResult = {
  ok: boolean;
  data?: any;
  error?: string;
  needKey?: boolean;
  needInventory?: boolean;
  status?: number;
};

type Payload =
  | { mode: "generate"; inventory: Partial<Inventory> }
  | { mode: "evaluate"; idea: string; inventory?: Partial<Inventory> };

export function openAdvanced() {
  if (typeof window !== "undefined")
    window.dispatchEvent(new CustomEvent("ideaforge:openAdvanced"));
}

export async function callIdea(payload: Payload): Promise<IdeaApiResult> {
  const apiKey = load<string>(KEYS.apiKey, "");
  const turnstileToken =
    typeof window !== "undefined" ? (window as any).__ifTokenValue : undefined;
  try {
    const res = await fetch("/api/idea", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, apiKey: apiKey || undefined, turnstileToken }),
    });
    // Turnstile tokens are single-use — refresh for the next free call.
    if (typeof window !== "undefined") (window as any).__ifResetTurnstile?.();
    // Gateway errors (e.g. a 504 timeout) return non-JSON bodies — don't let
    // the parse failure masquerade as a network error.
    let json: any = null;
    try {
      json = await res.json();
    } catch {}
    if (!res.ok) {
      const fallback =
        res.status === 504
          ? "응답 생성이 너무 오래 걸렸습니다. 잠시 후 다시 시도해 주세요."
          : "요청에 실패했습니다. 잠시 후 다시 시도해 주세요.";
      return {
        ok: false,
        error: json?.error || fallback,
        needKey: !!json?.needKey,
        needInventory: !!json?.needInventory,
        status: res.status,
      };
    }
    return { ok: true, data: json?.data };
  } catch {
    return { ok: false, error: "네트워크 오류가 발생했습니다. 잠시 후 다시 시도해 주세요." };
  }
}
