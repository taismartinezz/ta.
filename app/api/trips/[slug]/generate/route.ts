import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateTripPlan } from "@/lib/gemini";
import { geocodePlaceNames } from "@/lib/geocode";
import { fetchWikipediaImage } from "@/lib/wikipedia-image";
import { MIN_SUBMISSIONS_TO_GENERATE } from "@/lib/constants";
import type { Submission, ItineraryOption } from "@/lib/types";

// Geocoding (rate-limited to ~1 req/sec) plus the LLM calls can comfortably
// exceed Vercel's default function timeout.
export const maxDuration = 60;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const body = await request.json().catch(() => ({}));
  const feedback = typeof body?.feedback === "string" ? body.feedback.trim() : null;

  const supabase = await createClient();

  const { data: trip, error: tripError } = await supabase
    .from("trips")
    .select("id")
    .eq("slug", slug)
    .single();

  if (tripError || !trip) {
    return NextResponse.json({ error: "Trip not found" }, { status: 404 });
  }

  const { data: latestOutput } = await supabase
    .from("generated_outputs")
    .select("locked_option_index")
    .eq("trip_id", trip.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestOutput?.locked_option_index !== null && latestOutput?.locked_option_index !== undefined) {
    return NextResponse.json(
      { error: "The group already locked in a final choice for this trip" },
      { status: 409 }
    );
  }

  const { data: submissions, error: submissionsError } = await supabase
    .from("submissions")
    .select("*")
    .eq("trip_id", trip.id);

  if (submissionsError) {
    return NextResponse.json({ error: submissionsError.message }, { status: 500 });
  }

  if (!submissions || submissions.length < MIN_SUBMISSIONS_TO_GENERATE) {
    return NextResponse.json(
      { error: `Need at least ${MIN_SUBMISSIONS_TO_GENERATE} submissions before generating` },
      { status: 400 }
    );
  }

  let plan;
  let raw;
  try {
    const result = await generateTripPlan(submissions as Submission[], feedback);
    plan = result.plan;
    raw = result.raw;
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to generate trip plan" },
      { status: 502 }
    );
  }

  // Geocode once here (not per page view) — cheap relative to the LLM call,
  // and keeps us well within Nominatim's usage policy. Runs alongside the
  // Wikipedia photo lookup since neither depends on the other.
  const allPlaceNames = plan.itinerary_options.flatMap((option) =>
    option.days.flatMap((day) => day.locations ?? [])
  );

  const [geocoded, coverImageUrl] = await Promise.all([
    allPlaceNames.length > 0 ? geocodePlaceNames(allPlaceNames) : Promise.resolve(new Map()),
    fetchWikipediaImage(plan.destination_photo_query || plan.destination_pick),
  ]);

  if (coverImageUrl) {
    await supabase.from("trips").update({ cover_image_url: coverImageUrl }).eq("id", trip.id);
  }

  const itineraryOptionsWithGeo: ItineraryOption[] = plan.itinerary_options.map((option) => ({
    label: option.label,
    estimated_cost_per_person: option.estimated_cost_per_person,
    estimated_cost_currency: option.estimated_cost_currency,
    days: option.days.map((day) => ({
      day_number: day.day_number,
      activities: day.activities,
      locations: (day.locations ?? [])
        .map((name) => geocoded.get(name.trim()))
        .filter((loc): loc is NonNullable<typeof loc> => loc !== undefined),
    })),
  }));

  const { data: output, error: insertError } = await supabase
    .from("generated_outputs")
    .insert({
      trip_id: trip.id,
      raw_llm_response: raw,
      destination_pick: plan.destination_pick,
      itinerary_options: itineraryOptionsWithGeo,
      open_questions: plan.open_questions,
      regeneration_feedback: feedback,
      recommended_start_date: plan.recommended_start_date || null,
    })
    .select("id")
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  await supabase.from("trips").update({ status: "generated" }).eq("id", trip.id);

  return NextResponse.json({ generated_output_id: output.id }, { status: 201 });
}
