import { GoogleGenAI } from "@google/genai";
import type { Submission } from "./types";

// "gemini-2.5-flash" is no longer available to new API keys as of mid-2026;
// use Google's rolling flash alias so this doesn't go stale again as models rotate.
const MODEL = "gemini-flash-latest";

const SYSTEM_INSTRUCTION = `You are helping a friend group reconcile trip planning requirements into a decision-ready output.

Input: an array of participant submissions, each with budget, available dates, a desired trip length in days, a departure location, activity level, must-haves, dealbreakers, and activity interests. Some submissions may also include optional personalization signals: favorite_cuisines, languages_spoken, bucket_list_interest (low/medium/high appetite for adventurous "once in a lifetime" activities), nightlife_interest (low/medium/high), and pace_preference (relaxed/balanced/packed).

Rules you MUST follow:
1. Propose exactly THREE distinct destination options, each a genuinely different place (not the same city with two budget tiers). Rank them: the first is your top recommendation based on majority alignment across submissions (budget range overlap plus activity level fit), the second and third are reasonable alternatives that still fit the group's constraints but trade off differently (e.g. cheaper, more adventurous, more relaxed, closer for the group's departure locations). Do not just average. Reason about which destinations most participants' constraints actually support.
2. Pick ONE recommended trip start date that best fits the overlap across everyone's available_dates windows, shared across all three options. If there is no full overlap, pick the date that satisfies the most participants and mention the conflict in open_questions.
3. The trip length is an EXPLICIT input, not something to infer or shorten: take the most common desired_trip_length_days value across submissions (or the median if there's no clear majority), and ALL THREE options MUST have exactly that many days, never fewer, even if the available_dates window is technically wider or narrower than that. If desired_trip_length_days is missing for everyone, fall back to the shortest shared available_dates overlap. EVERY day in EVERY option must list at least one activity; a day with an empty activities list is never acceptable.
4. Activities that correspond to one of the specific activity_interests categories submitted (e.g. hiking, museums, nightlife, beach) may only be included if at least 2 participants indicated interest in that category. If fewer than 2 people want a specific-interest activity, do not include it, even if it fits the vibe.
5. General itinerary anchors that are NOT tied to a specific interest category (arrival/departure logistics, meals, checking into lodging, free time, walking around the area, or light general sightseeing/relaxation appropriate to the group's overall activity_level) do NOT require 2-person interest support and should always be used to fill out each day. Use these to guarantee every day has real, concrete content, especially when few activity_interests categories reach the 2-person threshold.
6. For each day, also list 1-3 concrete, real, mappable place names for that day's activities (e.g. "El Yunque National Forest, Puerto Rico", not "a nice hiking trail"), specific enough to be geocoded on a map. Omit this if a day is genuinely just unstructured free time with no specific place.
7. For each of the three options, estimate a realistic total cost per person for the whole trip, in the currency most participants used, reasoning from typical real-world costs for that destination and vibe, not just copying a submitted budget number. Break the estimate down into five categories: lodging, food, activities, local_transport, and flights (a realistic round-trip flight cost from each participant's departure_location to that option's destination, averaged if departure cities differ). The five category values must sum to (approximately) the option's total estimated_cost_per_person.
8. List any open questions the group still needs to resolve as a group (e.g. unresolved date conflicts, a dealbreaker that conflicts with the top pick, wildly different flight costs by departure_location, or the fact that few shared activity interests were submitted).
9. Do not mention any participant by name in a way that singles them out negatively (e.g. don't say "X's dealbreaker forced us to avoid Y"). Describe constraints in aggregate.
10. Personalization signals (favorite_cuisines, languages_spoken, bucket_list_interest, nightlife_interest, pace_preference) are soft bias only, not hard requirements. Never apply the 2-person threshold from rule 4 to these, and never let a missing personalization field block or change anything. Use them only to season activity choices, meal/restaurant-style suggestions, and overall day density (e.g. pace_preference should visibly affect how packed each day's schedule is) when enough participants share a signal to make it a reasonable group-level nudge.
11. Writing style: never use an em dash (the "—" character) anywhere in any generated text (reasoning, activities, open questions, labels, taglines). Use a period, comma, or semicolon instead.
12. For each option, also write a one-line, evocative tagline (under 10 words) that captures the mood of that destination for this specific group, e.g. "Cobblestone mornings and slow, sunlit dinners." Poetic and specific to the destination and vibe, never generic filler like "A trip to remember."

Return ONLY valid JSON matching this exact schema, no other text:
{
  "recommended_start_date": string, // YYYY-MM-DD, shared across all three options
  "itinerary_options": [
    {
      "destination": string,
      "destination_reasoning": string,
      "destination_photo_query": string, // short, clean place name for a Wikipedia photo search, e.g. "Cancún, Mexico" or "San Juan, Puerto Rico", no accommodation descriptors, no parentheticals
      "tagline": string, // one poetic line evoking the destination's mood, under 10 words
      "label": string, // e.g. "Top pick", "Cheaper alternative", "More adventurous"
      "estimated_cost_per_person": number,
      "estimated_cost_currency": string,
      "cost_breakdown": {
        "lodging": number,
        "food": number,
        "activities": number,
        "local_transport": number,
        "flights": number
      },
      "days": [ { "day_number": number, "activities": [string], "locations": [string] } ]
    }
  ], // exactly 3 entries, ranked best first
  "open_questions": [string]
}

Submissions:
{{submissions_json}}`;

export interface CostBreakdown {
  lodging: number;
  food: number;
  activities: number;
  local_transport: number;
  flights: number;
}

export interface GeneratedItineraryOption {
  destination: string;
  destination_reasoning: string;
  destination_photo_query: string;
  tagline: string;
  label: string;
  estimated_cost_per_person: number;
  estimated_cost_currency: string;
  cost_breakdown: CostBreakdown;
  days: { day_number: number; activities: string[]; locations?: string[] }[];
}

export interface GeneratedTripPlan {
  recommended_start_date: string;
  itinerary_options: GeneratedItineraryOption[];
  open_questions: string[];
}

function buildPrompt(submissions: Submission[], feedback: string | null): string {
  const submissionsForPrompt = submissions.map((s) => ({
    budget_amount: s.budget_amount,
    budget_currency: s.budget_currency,
    available_dates: s.available_dates,
    desired_trip_length_days: s.desired_trip_length_days ?? undefined,
    departure_location: s.departure_location ?? undefined,
    activity_level: s.activity_level,
    must_haves: s.must_haves,
    dealbreakers: s.dealbreakers,
    activity_interests: s.activity_interests,
    favorite_cuisines: s.favorite_cuisines ?? undefined,
    languages_spoken: s.languages_spoken ?? undefined,
    bucket_list_interest: s.bucket_list_interest ?? undefined,
    nightlife_interest: s.nightlife_interest ?? undefined,
    pace_preference: s.pace_preference ?? undefined,
  }));

  let prompt = SYSTEM_INSTRUCTION.replace(
    "{{submissions_json}}",
    JSON.stringify(submissionsForPrompt, null, 2)
  );

  if (feedback) {
    prompt += `\n\nThe group already reviewed a previous version of this plan and asked for the following changes. Incorporate this feedback while still following every rule above:\n${feedback}`;
  }

  return prompt;
}

export async function generateTripPlan(
  submissions: Submission[],
  feedback: string | null = null
): Promise<{ plan: GeneratedTripPlan; raw: Record<string, unknown> }> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: buildPrompt(submissions, feedback),
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
    // Only pull known plain fields; the SDK response object itself carries
    // getters/class internals that don't survive JSON serialization cleanly.
    raw: {
      text,
      modelVersion: response.modelVersion ?? null,
      usageMetadata: response.usageMetadata ?? null,
    },
  };
}
