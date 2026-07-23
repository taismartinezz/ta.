import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateTripPlan } from "@/lib/gemini";
import type { Submission } from "@/lib/types";

const MIN_SUBMISSIONS_TO_GENERATE = 2;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: trip, error: tripError } = await supabase
    .from("trips")
    .select("id")
    .eq("slug", slug)
    .single();

  if (tripError || !trip) {
    return NextResponse.json({ error: "Trip not found" }, { status: 404 });
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
    const result = await generateTripPlan(submissions as Submission[]);
    plan = result.plan;
    raw = result.raw;
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to generate trip plan" },
      { status: 502 }
    );
  }

  const { data: output, error: insertError } = await supabase
    .from("generated_outputs")
    .insert({
      trip_id: trip.id,
      raw_llm_response: raw,
      destination_pick: plan.destination_pick,
      itinerary_options: plan.itinerary_options,
      open_questions: plan.open_questions,
    })
    .select("id")
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  await supabase.from("trips").update({ status: "generated" }).eq("id", trip.id);

  return NextResponse.json({ generated_output_id: output.id }, { status: 201 });
}
