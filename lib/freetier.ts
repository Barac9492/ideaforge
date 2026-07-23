// Pure env predicate — no redis import, so it is trivially testable.
// Free tier is ON only when ALL five are configured. Missing any one => BYO only.
export function freeTierConfigured(env: NodeJS.ProcessEnv = process.env): boolean {
  return !!(
    env.ANTHROPIC_API_KEY &&
    env.UPSTASH_REDIS_REST_URL &&
    env.UPSTASH_REDIS_REST_TOKEN &&
    env.TURNSTILE_SECRET_KEY &&
    env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
  );
}
