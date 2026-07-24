import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateEditToken } from "@/lib/token";
import { getUserFromAuthHeader } from "@/lib/supabase/verify-token";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim() : null;

  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const user = await getUserFromAuthHeader(request.headers.get("authorization"));
  const supabase = await createClient();

  const { data: trip, error: tripError } = await supabase
    .from("trips")
    .select("id")
    .eq("slug", slug)
    .single();

  if (tripError || !trip) {
    return NextResponse.json({ error: "Trip not found" }, { status: 404 });
  }

  const { data: existing } = await supabase
    .from("participants")
    .select("id")
    .eq("trip_id", trip.id)
    .ilike("name", name);

  const duplicateName = (existing ?? []).length > 0;

  const { data: participant, error } = await supabase
    .from("participants")
    .insert({
      trip_id: trip.id,
      name,
      email,
      edit_token: generateEditToken(),
      user_id: user?.id ?? null,
    })
    .select("id, edit_token")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    {
      participant_id: participant.id,
      edit_token: participant.edit_token,
      duplicate_name: duplicateName,
    },
    { status: 201 }
  );
}
