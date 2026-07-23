import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ReactionType } from "@/lib/types";

const REACTIONS: ReactionType[] = ["up", "down"];

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string; outputId: string }> }
) {
  const { slug, outputId } = await params;
  const body = await request.json().catch(() => null);
  const participantId = body?.participant_id;
  const optionIndex = body?.option_index;
  const reaction = body?.reaction;

  if (typeof participantId !== "string") {
    return NextResponse.json({ error: "participant_id is required" }, { status: 400 });
  }
  if (typeof optionIndex !== "number" || !Number.isInteger(optionIndex) || optionIndex < 0) {
    return NextResponse.json({ error: "option_index is invalid" }, { status: 400 });
  }
  if (!REACTIONS.includes(reaction)) {
    return NextResponse.json({ error: "reaction must be 'up' or 'down'" }, { status: 400 });
  }

  const supabase = await createClient();

  const { data: trip, error: tripError } = await supabase
    .from("trips")
    .select("id")
    .eq("slug", slug)
    .single();

  if (tripError || !trip) {
    return NextResponse.json({ error: "Trip not found" }, { status: 404 });
  }

  const { data: participant, error: participantError } = await supabase
    .from("participants")
    .select("id")
    .eq("id", participantId)
    .eq("trip_id", trip.id)
    .single();

  if (participantError || !participant) {
    return NextResponse.json({ error: "Participant not found on this trip" }, { status: 404 });
  }

  const { error } = await supabase.from("itinerary_reactions").upsert(
    {
      generated_output_id: outputId,
      participant_id: participantId,
      option_index: optionIndex,
      reaction,
    },
    { onConflict: "generated_output_id,participant_id,option_index" }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: reactions, error: fetchError } = await supabase
    .from("itinerary_reactions")
    .select("option_index, reaction")
    .eq("generated_output_id", outputId);

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  const counts: Record<number, { up: number; down: number }> = {};
  for (const r of reactions ?? []) {
    counts[r.option_index] ??= { up: 0, down: 0 };
    counts[r.option_index][r.reaction as ReactionType]++;
  }

  return NextResponse.json({ counts });
}
