import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { MIN_BUDGET_AMOUNT, MAX_BUDGET_AMOUNT } from "@/lib/constants";
import type { ActivityLevel } from "@/lib/types";

const ACTIVITY_LEVELS: ActivityLevel[] = ["relaxing", "balanced", "adventurous"];

function isDateRangeArray(value: unknown): value is { start: string; end: string }[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every(
      (r) =>
        r &&
        typeof r === "object" &&
        typeof (r as Record<string, unknown>).start === "string" &&
        typeof (r as Record<string, unknown>).end === "string"
    )
  );
}

function hasInvalidDateOrder(dateRanges: { start: string; end: string }[]): boolean {
  return dateRanges.some((r) => r.end <= r.start);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const body = await request.json().catch(() => null);

  if (!body) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const {
    participant_id,
    budget_amount,
    budget_currency,
    available_dates,
    activity_level,
    must_haves,
    dealbreakers,
    activity_interests,
    flagged_as_outlier,
    participant_adjusted,
    shared_to_group_anonymously,
  } = body;

  if (typeof participant_id !== "string") {
    return NextResponse.json({ error: "participant_id is required" }, { status: 400 });
  }
  if (
    typeof budget_amount !== "number" ||
    !Number.isFinite(budget_amount) ||
    budget_amount < MIN_BUDGET_AMOUNT
  ) {
    return NextResponse.json(
      { error: "budget_amount must be a positive number" },
      { status: 400 }
    );
  }
  if (budget_amount > MAX_BUDGET_AMOUNT) {
    return NextResponse.json(
      { error: `budget_amount must be ${MAX_BUDGET_AMOUNT} or less` },
      { status: 400 }
    );
  }
  if (!ACTIVITY_LEVELS.includes(activity_level)) {
    return NextResponse.json({ error: "activity_level is invalid" }, { status: 400 });
  }
  if (!isDateRangeArray(available_dates)) {
    return NextResponse.json(
      { error: "available_dates must be a non-empty array of {start, end}" },
      { status: 400 }
    );
  }
  if (hasInvalidDateOrder(available_dates)) {
    return NextResponse.json(
      { error: "End date must be after the start date for each date range" },
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

  const { data: participant, error: participantError } = await supabase
    .from("participants")
    .select("id")
    .eq("id", participant_id)
    .eq("trip_id", trip.id)
    .single();

  if (participantError || !participant) {
    return NextResponse.json(
      { error: "Participant not found on this trip" },
      { status: 404 }
    );
  }

  const { data: submission, error } = await supabase
    .from("submissions")
    .insert({
      trip_id: trip.id,
      participant_id,
      budget_amount,
      budget_currency: typeof budget_currency === "string" ? budget_currency : "USD",
      available_dates,
      activity_level,
      must_haves: Array.isArray(must_haves) ? must_haves : [],
      dealbreakers: Array.isArray(dealbreakers) ? dealbreakers : [],
      activity_interests: Array.isArray(activity_interests) ? activity_interests : [],
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (flagged_as_outlier === true) {
    const { error: flagError } = await supabase.from("budget_flags").insert({
      submission_id: submission.id,
      flagged_as_outlier: true,
      participant_adjusted: participant_adjusted === true,
      shared_to_group_anonymously: shared_to_group_anonymously === true,
    });

    if (flagError) {
      console.error("Failed to record budget flag", flagError);
    }
  }

  return NextResponse.json({ submission_id: submission.id }, { status: 201 });
}
