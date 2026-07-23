// Below this, majority-vote destination logic and the "≥2 people interested"
// activity rule don't have enough signal to produce a meaningful itinerary.
export const MIN_SUBMISSIONS_TO_GENERATE = 2;

// Sanity bounds on a single person's trip budget — not a real financial
// limit, just enough to catch stray typos (e.g. an extra zero).
export const MIN_BUDGET_AMOUNT = 1;
export const MAX_BUDGET_AMOUNT = 1_000_000;
