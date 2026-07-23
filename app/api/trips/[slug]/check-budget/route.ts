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

  const { data: submissions, error } = await supabase
    .from("submissions")
    .select("budget_amount")
    .eq("trip_id", trip.id);

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
