import { GoogleGenAI } from "@google/genai";
import type { Submission } from "./types";

// "gemini-2.5-flash" is no longer available to new API keys as of mid-2026 —
// use Google's rolling flash alias so this doesn't go stale again as models rotate.
const MODEL = "gemini-flash-latest";

const SYSTEM_INSTRUCTION = `You are helping a friend group reconcile trip planning requirements into a decision-ready output.

Input: an array of participant submissions, each with budget, available dates, activity level, must-haves, dealbreakers, and activity interests.

Rules you MUST follow:
1. Pick ONE destination/accommodation approach based on majority alignment across submissions (budget range overlap + activity level fit). Do not just average — reason about which option most participants' constraints support.
2. Generate exactly TWO day-by-day itinerary options that differ meaningfully by budget level and vibe (e.g. one lower-cost/relaxed, one higher-budget/adventurous).
3. For EVERY activity you include in either itinerary, at least 2 participants' activity_interests must support it. If fewer than 2 people want an activity, do not include it, even if it fits the vibe.
4. List any open questions the group still needs to resolve as a group (e.g. unresolved date conflicts, a dealbreaker that conflicts with the majority pick).
5. Do not mention any participant by name in a way that singles them out negatively (e.g. don't say "X's dealbreaker forced us to avoid Y") — describe constraints in aggregate.

Return ONLY valid JSON matching this exact schema, no other text:
{
  "destination_pick": string,
  "destination_reasoning": string,
  "itinerary_options": [
    {
      "label": string, // e.g. "Budget-friendly & relaxed"
      "days": [ { "day_number": number, "activities": [string] } ]
    },
    {
      "label": string,
      "days": [ { "day_number": number, "activities": [string] } ]
    }
  ],
  "open_questions": [string]
}

Submissions:
{{submissions_json}}`;

export interface GeneratedTripPlan {
  destination_pick: string;
  destination_reasoning: string;
  itinerary_options: {
    label: string;
    days: { day_number: number; activities: string[] }[];
  }[];
  open_questions: string[];
}

function buildPrompt(submissions: Submission[]): string {
  const submissionsForPrompt = submissions.map((s) => ({
    budget_amount: s.budget_amount,
    budget_currency: s.budget_currency,
    available_dates: s.available_dates,
    activity_level: s.activity_level,
    must_haves: s.must_haves,
    dealbreakers: s.dealbreakers,
    activity_interests: s.activity_interests,
  }));

  return SYSTEM_INSTRUCTION.replace(
    "{{submissions_json}}",
    JSON.stringify(submissionsForPrompt, null, 2)
  );
}

export async function generateTripPlan(
  submissions: Submission[]
): Promise<{ plan: GeneratedTripPlan; raw: Record<string, unknown> }> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: buildPrompt(submissions),
    config: {
      responseMimeType: "application/json",
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error("Gemini returned an empty response");
  }

  const plan = JSON.parse(text) as GeneratedTripPlan;

  return {
    plan,
    // Only pull known plain fields — the SDK response object itself carries
    // getters/class internals that don't survive JSON serialization cleanly.
    raw: {
      text,
      modelVersion: response.modelVersion ?? null,
      usageMetadata: response.usageMetadata ?? null,
    },
  };
}
