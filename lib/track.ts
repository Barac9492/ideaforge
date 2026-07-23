import { track } from "@vercel/analytics";

// Funnel events (Vercel Web Analytics custom events, Pro). Cookieless, no PII —
// we send only step-transition names so we can measure the 3→4 handoff, which
// is the product's north-star metric.
export const funnel = {
  inventorySaved: () => track("inventory_saved"),
  ideasGenerated: () => track("ideas_generated"),
  pressureTestDone: () => track("pressure_test_done"), // step 3 verdict shown (denominator)
  goToRealityCheck: () => track("go_to_reality_check"), // step 3 → step 4 click (numerator)
  experimentVerdict: (verdict: string) => track("experiment_verdict", { verdict }),
};
