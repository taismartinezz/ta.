import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserFromAuthHeader } from "@/lib/supabase/verify-token";

export async function GET(request: Request) {
  const user = await getUserFromAuthHeader(request.headers.get("authorization"));
  if (!user) {
    return NextResponse.json({ submission: null });
  }

  const supabase = await createClient();

  const { data: participants } = await supabase
    .from("participants")
    .select("id")
    .eq("user_id", user.id);

  const participantIds = (participants ?? []).map((p) => p.id);
  if (participantIds.length === 0) {
    return NextResponse.json({ submission: null });
  }

  const { data: submission } = await supabase
    .from("submissions")
    .select(
      "budget_amount, budget_currency, activity_level, must_haves, dealbreakers, activity_interests"
    )
    .in("participant_id", participantIds)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return NextResponse.json({ submission: submission ?? null });
}
