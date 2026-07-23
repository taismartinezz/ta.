import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const body = await request.json().catch(() => null);
  const participantId = body?.participant_id;

  if (typeof participantId !== "string") {
    return NextResponse.json({ error: "participant_id is required" }, { status: 400 });
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

  const { error } = await supabase.from("nudges").insert({
    trip_id: trip.id,
    participant_id: participantId,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const { searchParams } = new URL(request.url);
  const participantId = searchParams.get("participant_id");

  if (!participantId) {
    return NextResponse.json({ error: "participant_id is required" }, { status: 400 });
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

  const { data: nudges, error } = await supabase
    .from("nudges")
    .select("id")
    .eq("trip_id", trip.id)
    .eq("participant_id", participantId)
    .limit(1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ nudged: (nudges ?? []).length > 0 });
}
