import Anthropic from "@anthropic-ai/sdk";
import { FRAMEWORK } from "@/lib/framework";

export const runtime = "nodejs";
export const maxDuration = 60;

type Body = {
  mode: "generate" | "evaluate";
  input: string; // founder background (generate) OR the idea (evaluate)
  constraints?: string; // optional: budget/time/industry
  count?: number;
  apiKey?: string;
  model?: string;
};

const GENERATE_INSTRUCTION = (count: number) => `MODE: GENERATE.
The user will give you their background: jobs, skills, lived experiences, problems they've personally hit, and interests. Generate ${count} startup ideas that are GOOD IDEAS *FOR THEM* — anchored in founder-market fit. Favor recipes 1 (what they're great at) and 2 (problems they've personally hit). Each idea must be a promising starting point that can morph, not a finished plan. Avoid tarpits; if an idea flirts with one, only include it if you can name why this person could beat the barrier.

Return ONLY valid JSON, no prose, no code fences, matching exactly:
{"ideas":[{"title":"","oneLiner":"","recipe":"which of the 7 recipes + why","founderFit":"why THIS person specifically, tied to their stated background","whyNow":"the recent change making this possible/urgent, or 'none obvious' honestly","risk":"the single biggest honest risk"}]}`;

const EVALUATE_INSTRUCTION = `MODE: EVALUATE.
The user will give you a startup idea. Run the full framework honestly. Do not flatter. A strong idea doesn't need every yes, but each no is a risk that needs a plan.

Return ONLY valid JSON, no prose, no code fences, matching exactly:
{
 "mistakes":[{"name":"Solution in search of a problem","verdict":"pass|warn|fail","note":""},{"name":"Tarpit idea","verdict":"pass|warn|fail","note":"if warn/fail, name the exact structural barrier"},{"name":"Jumping on first idea","verdict":"pass|warn|fail","note":""},{"name":"Waiting for perfect idea","verdict":"pass|warn|fail","note":""}],
 "questions":[{"q":"Founder-market fit","verdict":"yes|mixed|no","note":"","nextAction":""},{"q":"Market size","verdict":"yes|mixed|no","note":"","nextAction":""},{"q":"How acute is the problem","verdict":"yes|mixed|no","note":"","nextAction":""},{"q":"Competition","verdict":"yes|mixed|no","note":"","nextAction":""},{"q":"Do people you know want it","verdict":"yes|mixed|no","note":"","nextAction":""},{"q":"Why now","verdict":"yes|mixed|no","note":"","nextAction":""},{"q":"Is there a proxy","verdict":"yes|mixed|no","note":"","nextAction":""},{"q":"Would you work on it for years","verdict":"yes|mixed|no","note":"","nextAction":""},{"q":"Is it scalable","verdict":"yes|mixed|no","note":"","nextAction":""},{"q":"Is it a good idea space","verdict":"yes|mixed|no","note":"","nextAction":""}],
 "signals":[{"name":"Hard to get started (schlep)","present":true,"note":""},{"name":"Boring space","present":true,"note":""},{"name":"Already has competitors","present":true,"note":""}],
 "verdict":"honest 2-3 sentence overall read",
 "testNext":"the single most important assumption to test now, and how"
}`;

function extractJson(text: string): any {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced ? fenced[1] : text;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("no json");
  return JSON.parse(raw.slice(start, end + 1));
}

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return Response.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const apiKey = body.apiKey?.trim() || process.env.ANTHROPIC_API_KEY;
  if (!apiKey)
    return Response.json(
      { error: "Anthropic API key required. Paste one above, or set ANTHROPIC_API_KEY on the server." },
      { status: 401 }
    );
  if (!body.input?.trim())
    return Response.json({ error: "입력이 비어 있습니다." }, { status: 400 });

  const model = body.model || "claude-sonnet-5";
  const client = new Anthropic({ apiKey });

  const instruction =
    body.mode === "generate"
      ? GENERATE_INSTRUCTION(Math.min(Math.max(body.count || 5, 1), 8))
      : EVALUATE_INSTRUCTION;

  const userContent =
    body.mode === "generate"
      ? `My background:\n${body.input}\n\n${body.constraints ? `Constraints: ${body.constraints}\n\n` : ""}Generate ideas for me.`
      : `Evaluate this idea:\n${body.input}`;

  try {
    const msg = await client.messages.create({
      model,
      max_tokens: 3000,
      system: `${FRAMEWORK}\n\n${instruction}`,
      messages: [{ role: "user", content: userContent }],
    });
    const text = msg.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");
    try {
      return Response.json({ data: extractJson(text) });
    } catch {
      return Response.json({ error: "모델 응답을 파싱하지 못했습니다.", raw: text }, { status: 502 });
    }
  } catch (err: any) {
    const message = err?.error?.error?.message || err?.message || "오류가 발생했습니다.";
    return Response.json({ error: message }, { status: err?.status || 500 });
  }
}
