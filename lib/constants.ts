// Below this, majority-vote destination logic and the "≥2 people interested"
// activity rule don't have enough signal to produce a meaningful itinerary.
export const MIN_SUBMISSIONS_TO_GENERATE = 2;

// Sanity bounds on a single person's trip budget — not a real financial
// limit, just enough to catch stray typos (e.g. an extra zero). 1,000,000
// was too loose for this domain (a per-person friend-trip budget) — it let
// obviously-implausible values like 999,999 through untouched.
export const MIN_BUDGET_AMOUNT = 1;
export const MAX_BUDGET_AMOUNT = 100_000;
