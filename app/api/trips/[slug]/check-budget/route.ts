import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkBudgetOutlier } from "@/lib/outlier-detection";

// Live check called while a participant is filling out the form — never
// persists anything. Lets them see and adjust privately before they submit.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const body = await request.json().catch(() => null);
  const budgetAmount = body?.budget_amount;
  // When editing an existing submission, exclude the participant's own prior
  // value from the comparison set — otherwise their old number skews their
  // own outlier check.
  const excludeParticipantId =
    typeof body?.participant_id === "string" ? body.participant_id : null;

  if (typeof budgetAmount !== "number" || !Number.isFinite(budgetAmount) || budgetAmount <= 0) {
    return NextResponse.json(
      { error: "budget_amount must be a positive number" },
      { status: 400 }
    );
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

  let query = supabase.from("submissions").select("participant_id, budget_amount").eq("trip_id", trip.id);
  if (excludeParticipantId) {
    query = query.neq("participant_id", excludeParticipantId);
  }
  const { data: submissions, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const existingBudgets = (submissions ?? []).map((s) => Number(s.budget_amount));
  const result = checkBudgetOutlier(budgetAmount, existingBudgets);

  return NextResponse.json({
    is_outlier: result.isOutlier,
    group_median: result.groupMedian,
    sample_size: result.sampleSize,
  });
}
