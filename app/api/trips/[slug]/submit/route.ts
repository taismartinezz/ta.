import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { MIN_BUDGET_AMOUNT, MAX_BUDGET_AMOUNT } from "@/lib/constants";
import type { ActivityLevel, InterestLevel, PacePreference } from "@/lib/types";

const ACTIVITY_LEVELS: ActivityLevel[] = ["relaxing", "balanced", "adventurous"];
const INTEREST_LEVELS: InterestLevel[] = ["low", "medium", "high"];
const PACE_PREFERENCES: PacePreference[] = ["relaxed", "balanced", "packed"];

function optionalInterestLevel(value: unknown): InterestLevel | null {
  return typeof value === "string" && INTEREST_LEVELS.includes(value as InterestLevel)
    ? (value as InterestLevel)
    : null;
}

function optionalPacePreference(value: unknown): PacePreference | null {
  return typeof value === "string" && PACE_PREFERENCES.includes(value as PacePreference)
    ? (value as PacePreference)
    : null;
}

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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "token is required" }, { status: 400 });
  }

  const supabase = await createClient();

  const { data: trip, error: tripError } = await supabase
    .from("trips")
    .select("id, status")
    .eq("slug", slug)
    .single();

  if (tripError || !trip) {
    return NextResponse.json({ error: "Trip not found" }, { status: 404 });
  }

  const { data: participant, error: participantError } = await supabase
    .from("participants")
    .select("id, name")
    .eq("trip_id", trip.id)
    .eq("edit_token", token)
    .single();

  if (participantError || !participant) {
    return NextResponse.json({ error: "Invalid edit link" }, { status: 404 });
  }

  const { data: submission } = await supabase
    .from("submissions")
    .select("*")
    .eq("participant_id", participant.id)
    .maybeSingle();

  return NextResponse.json({
    participant_id: participant.id,
    participant_name: participant.name,
    trip_status: trip.status,
    submission: submission ?? null,
  });
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
    edit_token,
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
    favorite_cuisines,
    languages_spoken,
    bucket_list_interest,
    nightlife_interest,
    pace_preference,
    departure_location,
    desired_trip_length_days,
  } = body;

  if (typeof edit_token !== "string") {
    return NextResponse.json({ error: "edit_token is required" }, { status: 400 });
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
  if (
    desired_trip_length_days !== undefined &&
    desired_trip_length_days !== null &&
    (!Number.isInteger(desired_trip_length_days) ||
      desired_trip_length_days < 1 ||
      desired_trip_length_days > 60)
  ) {
    return NextResponse.json(
      { error: "desired_trip_length_days must be a whole number between 1 and 60" },
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
    .eq("trip_id", trip.id)
    .eq("edit_token", edit_token)
    .single();

  if (participantError || !participant) {
    return NextResponse.json({ error: "Invalid edit link" }, { status: 404 });
  }

  const { data: submission, error } = await supabase
    .from("submissions")
    .upsert(
      {
        trip_id: trip.id,
        participant_id: participant.id,
        budget_amount,
        budget_currency: typeof budget_currency === "string" ? budget_currency : "USD",
        available_dates,
        activity_level,
        must_haves: Array.isArray(must_haves) ? must_haves : [],
        dealbreakers: Array.isArray(dealbreakers) ? dealbreakers : [],
        activity_interests: Array.isArray(activity_interests) ? activity_interests : [],
        favorite_cuisines: Array.isArray(favorite_cuisines) ? favorite_cuisines : null,
        languages_spoken: Array.isArray(languages_spoken) ? languages_spoken : null,
        bucket_list_interest: optionalInterestLevel(bucket_list_interest),
        nightlife_interest: optionalInterestLevel(nightlife_interest),
        pace_preference: optionalPacePreference(pace_preference),
        departure_location:
          typeof departure_location === "string" && departure_location.trim()
            ? departure_location.trim()
            : null,
        desired_trip_length_days: desired_trip_length_days ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "participant_id" }
    )
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
