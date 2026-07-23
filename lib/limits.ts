import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Free-tier caps. Override via env; conservative defaults keep the bill tiny.
const PER_IP = Number(process.env.FREE_RUNS_PER_IP_PER_DAY || 5);
const GLOBAL = Number(process.env.FREE_RUNS_GLOBAL_PER_DAY || 200);

let _redis: Redis | null | undefined;
let _ipLimiter: Ratelimit | null = null;

function getRedis(): Redis | null {
  if (_redis !== undefined) return _redis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  _redis = url && token ? new Redis({ url, token }) : null;
  return _redis;
}

// Free tier is live ONLY when a server key AND a rate-limit store both exist.
// Missing either => no free runs => zero cost exposure. Safe by default.
export function freeTierConfigured(): boolean {
  return !!process.env.ANTHROPIC_API_KEY && !!getRedis();
}

function ipLimiter(r: Redis): Ratelimit {
  if (!_ipLimiter) {
    _ipLimiter = new Ratelimit({
      redis: r,
      limiter: Ratelimit.fixedWindow(PER_IP, "1 d"),
      prefix: "ideaforge:ip",
      analytics: false,
    });
  }
  return _ipLimiter;
}

function dayKey(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}-${d.getUTCDate()}`;
}

export type LimitResult =
  | { ok: true; remaining: number }
  | { ok: false; reason: "ip" | "global" | "unconfigured" };

export async function checkFreeAllowance(ip: string): Promise<LimitResult> {
  const r = getRedis();
  if (!r) return { ok: false, reason: "unconfigured" };

  // 1) per-IP daily limit
  const perIp = await ipLimiter(r).limit(ip);
  if (!perIp.success) return { ok: false, reason: "ip" };

  // 2) global daily budget kill-switch
  const gk = `ideaforge:global:${dayKey()}`;
  const count = await r.incr(gk);
  if (count === 1) await r.expire(gk, 60 * 60 * 26);
  if (count > GLOBAL) return { ok: false, reason: "global" };

  return { ok: true, remaining: perIp.remaining };
}

// Cloudflare Turnstile. If no secret is set, verification is skipped (returns true).
export async function verifyTurnstile(token: string | undefined, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (!token) return false;
  try {
    const form = new URLSearchParams();
    form.set("secret", secret);
    form.set("response", token);
    form.set("remoteip", ip);
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: form,
    });
    const data = (await res.json()) as { success?: boolean };
    return !!data.success;
  } catch {
    return false;
  }
}
