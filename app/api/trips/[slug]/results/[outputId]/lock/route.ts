import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string; outputId: string }> }
) {
  const { slug, outputId } = await params;
  const body = await request.json().catch(() => null);
  const optionIndex = body?.option_index;

  if (typeof optionIndex !== "number" || !Number.isInteger(optionIndex) || optionIndex < 0) {
    return NextResponse.json({ error: "option_index is invalid" }, { status: 400 });
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

  const { data: output, error } = await supabase
    .from("generated_outputs")
    .update({ locked_option_index: optionIndex, locked_at: new Date().toISOString() })
    .eq("id", outputId)
    .eq("trip_id", trip.id)
    .select("id")
    .single();

  if (error || !output) {
    return NextResponse.json({ error: error?.message ?? "Output not found" }, { status: 404 });
  }

  await supabase.from("trips").update({ status: "finalized" }).eq("id", trip.id);

  return NextResponse.json({ ok: true });
}
