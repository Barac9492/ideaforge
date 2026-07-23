import { Redis } from "@upstash/redis";

// Free-tier caps. Conservative defaults keep the bill tiny.
const PER_IP = Number(process.env.FREE_RUNS_PER_IP_PER_DAY || 5);
const GLOBAL = Number(process.env.FREE_RUNS_GLOBAL_PER_DAY || 200);

let _redis: Redis | null | undefined;

function getRedis(): Redis | null {
  if (_redis !== undefined) return _redis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  _redis = url && token ? new Redis({ url, token }) : null;
  return _redis;
}

// Quota keys reset on the KST (UTC+9) calendar day, not UTC.
function kstDayKey(): string {
  const kst = new Date(Date.now() + 9 * 3600 * 1000);
  return `${kst.getUTCFullYear()}-${kst.getUTCMonth() + 1}-${kst.getUTCDate()}`;
}

export type LimitResult =
  | { ok: true; remaining: number }
  | { ok: false; reason: "ip" | "global" | "unconfigured" };

export async function checkFreeAllowance(ip: string): Promise<LimitResult> {
  const r = getRedis();
  if (!r) return { ok: false, reason: "unconfigured" };

  const day = kstDayKey();

  // per-IP daily limit (KST day)
  const ipKey = `ideaforge:ip:${day}:${ip}`;
  const ipCount = await r.incr(ipKey);
  if (ipCount === 1) await r.expire(ipKey, 60 * 60 * 26);
  if (ipCount > PER_IP) return { ok: false, reason: "ip" };

  // global daily budget kill-switch (KST day)
  const gk = `ideaforge:global:${day}`;
  const gCount = await r.incr(gk);
  if (gCount === 1) await r.expire(gk, 60 * 60 * 26);
  if (gCount > GLOBAL) return { ok: false, reason: "global" };

  return { ok: true, remaining: Math.max(0, PER_IP - ipCount) };
}

// Cloudflare Turnstile. Free tier requires the secret (enforced by freeTierConfigured),
// so on the free path a valid token is always required.
export async function verifyTurnstile(token: string | undefined, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true; // BYO path (secret not set) — nothing to verify
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
