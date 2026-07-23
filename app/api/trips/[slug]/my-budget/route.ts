import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

  const { data: submission } = await supabase
    .from("submissions")
    .select("budget_amount, budget_currency")
    .eq("trip_id", trip.id)
    .eq("participant_id", participantId)
    .maybeSingle();

  return NextResponse.json({ submission: submission ?? null });
}
