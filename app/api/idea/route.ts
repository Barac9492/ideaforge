import Anthropic from "@anthropic-ai/sdk";
import { EVALUATE_INSTRUCTION, FRAMEWORK, GENERATE_INSTRUCTION } from "@/lib/framework";
import { checkFreeAllowance, verifyTurnstile } from "@/lib/limits";
import { freeTierConfigured } from "@/lib/freetier";
import { InsufficientInputError, normalizeEvaluation, normalizeIdeas, SchemaError } from "@/lib/schema";
import { PAPER_WARNING } from "@/lib/lessons";
import type { Inventory } from "@/lib/store";

export const runtime = "nodejs";
export const maxDuration = 60;

type Body = {
  mode: "generate" | "evaluate";
  inventory?: Partial<Inventory>;
  idea?: string;
  apiKey?: string;
  turnstileToken?: string;
};

// Abuse / safety guards
const MAX_INPUT = 5000;
const MAX_API_KEY = 300; // Anthropic keys are ~108 chars; reject anything absurd
const MODEL = "claude-sonnet-5"; // official Sonnet id; free and BYO both use it, Opus never exposed
const MAX_TOKENS = 2200;

function getIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  return fwd?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
}

function jsonError(message: string, status: number, extra: Record<string, unknown> = {}) {
  return Response.json({ error: message, ...extra }, { status });
}

function extractJson(text: string): any {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced ? fenced[1] : text;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1) throw new SchemaError("no json object");
  return JSON.parse(raw.slice(start, end + 1));
}

function buildInventoryText(inv?: Partial<Inventory>): string {
  if (!inv) return "";
  const rows = [
    ["지금까지 해온 일", inv.career],
    ["남들보다 잘하는 것", inv.strength],
    ["직접 겪은 문제", inv.problemLived],
    ["나만의 접근권", inv.unfairAccess],
    ["제약 조건", inv.constraints],
  ].filter(([, v]) => v && String(v).trim());
  return rows.map(([k, v]) => `- ${k}: ${String(v).trim()}`).join("\n");
}

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return jsonError("요청 형식이 올바르지 않습니다.", 400);
  }

  if (body.mode !== "generate" && body.mode !== "evaluate")
    return jsonError("알 수 없는 요청입니다.", 400);

  // ── Assemble prompt input per mode ──────────────────────────────────────
  const inventory = body.inventory;
  let userContent = "";
  if (body.mode === "generate") {
    const problem = (inventory?.problemLived || "").trim();
    if (!buildInventoryText(inventory))
      return jsonError("먼저 1단계에서 재료를 채워주세요.", 400, { needInventory: true });
    // Deterministic guard: no lived problem => observation task, no AI call, no cost.
    if (problem === "없음" || problem === "")
      return Response.json({ data: { observation: true } });
    userContent = `내 재료:\n${buildInventoryText(inventory)}\n\n이 재료에서만 아이디어 3개를 꺼내줘.`;
  } else {
    const idea = (body.idea || "").trim();
    if (!idea) return jsonError("평가할 아이디어가 없습니다.", 400);
    const invText = buildInventoryText(inventory);
    userContent =
      `평가할 아이디어:\n${idea}\n\n` +
      (invText ? `창업자 재료(1단계):\n${invText}\n` : `창업자 재료(1단계): 제공되지 않음. 1번 질문은 unknown으로.\n`);
  }

  if (userContent.length > MAX_INPUT)
    return jsonError("입력이 너무 깁니다. 더 간결하게 줄여주세요.", 413);

  // ── Key selection + abuse controls ──────────────────────────────────────
  const ownKey = body.apiKey?.trim();
  if (ownKey && ownKey.length > MAX_API_KEY)
    return jsonError("API 키 형식이 올바르지 않습니다.", 400);

  let apiKey: string;
  if (ownKey) {
    apiKey = ownKey; // BYO: user pays, no rate limit
  } else {
    if (!freeTierConfigured())
      return jsonError(
        "지금은 무료 사용이 준비되지 않았습니다. ‘고급 설정’에서 본인 Anthropic API 키를 넣어주세요.",
        401,
        { needKey: true }
      );
    const ip = getIp(req);
    const human = await verifyTurnstile(body.turnstileToken, ip);
    if (!human) return jsonError("사람 확인에 실패했습니다. 확인 상자를 다시 시도해 주세요.", 403);

    const allow = await checkFreeAllowance(ip);
    if (!allow.ok) {
      const msg =
        allow.reason === "global"
          ? "오늘 무료 사용량이 모두 소진되었습니다. ‘고급 설정’에서 본인 API 키를 넣으면 계속 쓸 수 있어요."
          : "오늘 무료 사용량을 다 썼습니다. 내일 다시 오거나, ‘고급 설정’에서 본인 API 키를 넣어주세요.";
      return jsonError(msg, 429, { needKey: true });
    }
    apiKey = process.env.ANTHROPIC_API_KEY as string;
  }

  // ── Call the model (generic errors; never leak provider details) ────────
  const client = new Anthropic({ apiKey });
  const instruction = body.mode === "generate" ? GENERATE_INSTRUCTION : EVALUATE_INSTRUCTION;

  let text: string;
  try {
    const msg = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: `${FRAMEWORK}\n\n${instruction}`,
      messages: [{ role: "user", content: userContent }],
    });
    text = msg.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");
  } catch (err: any) {
    const status = err?.status || 500;
    const msg =
      status === 401 || status === 403
        ? "API 키가 올바르지 않거나 권한이 없습니다. 키를 확인해 주세요."
        : status === 429
        ? "요청이 많아 잠시 후 다시 시도해 주세요."
        : "AI 호출 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.";
    return jsonError(msg, status);
  }

  // ── Parse + validate (Korean errors; distinguish thin input) ────────────
  try {
    const parsed = extractJson(text);
    if (body.mode === "generate") {
      const ideas = normalizeIdeas(parsed, inventory || {});
      return Response.json({ data: { ideas } });
    }
    const evaluation = normalizeEvaluation(parsed);
    return Response.json({ data: { ...evaluation, paperWarning: PAPER_WARNING } });
  } catch (e) {
    if (e instanceof InsufficientInputError)
      return jsonError(
        "지금 재료로는 당신만의 아이디어를 만들기 어렵습니다. 1단계에서 ‘직접 겪은 문제’나 ‘나만의 접근권’을 더 구체적으로 적어주세요.",
        422,
        { needInventory: true }
      );
    return jsonError("결과를 제대로 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.", 502);
  }
}
