import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const body = await request.json().catch(() => null);
  const participantId = body?.participant_id;
  const placeName = typeof body?.place_name === "string" ? body.place_name.trim() : "";
  const note = typeof body?.note === "string" ? body.note.trim() : null;

  if (typeof participantId !== "string") {
    return NextResponse.json({ error: "participant_id is required" }, { status: 400 });
  }
  if (!placeName) {
    return NextResponse.json({ error: "place_name is required" }, { status: 400 });
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

  const { data: recommendation, error } = await supabase
    .from("trip_recommendations")
    .insert({ trip_id: trip.id, participant_id: participantId, place_name: placeName, note })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ recommendation_id: recommendation.id }, { status: 201 });
}
