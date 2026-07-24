import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { majorityDepartureLocation } from "@/lib/flights";
import type { ItineraryOption } from "@/lib/types";
import { ArrowLeftIcon } from "@/app/icons";
import { ResultsView } from "./ResultsView";
import { DateOverlapChart } from "./DateOverlapChart";
import { BudgetOverlapChart } from "./BudgetOverlapChart";
import { ComparatorTable } from "./ComparatorTable";
import { RecommendationsSection } from "./RecommendationsSection";

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: trip } = await supabase
    .from("trips")
    .select("id, organizer_name, cover_image_url")
    .eq("slug", slug)
    .single();

  if (!trip) {
    notFound();
  }

  const { data: output } = await supabase
    .from("generated_outputs")
    .select(
      "id, itinerary_options, open_questions, locked_option_index, regeneration_feedback, recommended_start_date"
    )
    .eq("trip_id", trip.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!output) {
    return (
      <div className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-4 px-6 py-16 text-center text-foreground">
        <p className="text-lg font-medium">No itinerary has been generated for this trip yet.</p>
        <Link href={`/trip/${slug}`} className="flex items-center gap-1 text-sm text-accent underline">
          <ArrowLeftIcon size={14} />
          Back to the group view
        </Link>
      </div>
    );
  }

  const [{ data: reactions }, { data: participants }, { data: submissions }, { data: recommendations }] =
    await Promise.all([
      supabase
        .from("itinerary_reactions")
        .select("participant_id, option_index, reaction")
        .eq("generated_output_id", output.id),
      supabase.from("participants").select("id, name").eq("trip_id", trip.id),
      supabase
        .from("submissions")
        .select("participant_id, available_dates, budget_amount, budget_currency, departure_location")
        .eq("trip_id", trip.id),
      supabase
        .from("trip_recommendations")
        .select("id, participant_id, place_name, note")
        .eq("trip_id", trip.id),
    ]);

  const itineraryOptions = (output.itinerary_options ?? []) as ItineraryOption[];
  const openQuestions = (output.open_questions ?? []) as string[];

  const nameByParticipantId = new Map((participants ?? []).map((p) => [p.id, p.name]));
  const dateParticipants = (submissions ?? [])
    .filter((s) => Array.isArray(s.available_dates) && s.available_dates.length > 0)
    .map((s) => ({
      name: nameByParticipantId.get(s.participant_id) ?? "Someone",
      ranges: s.available_dates as { start: string; end: string }[],
    }));
  const budgetAmounts = (submissions ?? []).map((s) => Number(s.budget_amount));
  const primaryCurrency = (submissions ?? [])[0]?.budget_currency ?? "USD";
  const majorityDeparture = majorityDepartureLocation(
    (submissions ?? []).map((s) => s.departure_location)
  );
  const recommendationRows = (recommendations ?? []).map((r) => ({
    id: r.id,
    place_name: r.place_name,
    note: r.note,
    participant_name: nameByParticipantId.get(r.participant_id) ?? "Someone",
  }));

  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-6 py-16 text-foreground">
      <div>
        <Link href={`/trip/${slug}`} className="flex items-center gap-1 text-sm text-accent underline">
          <ArrowLeftIcon size={14} />
          Back to the group view
        </Link>
        <h1 className="mt-4 text-2xl font-semibold">{trip.organizer_name}&apos;s trip plan</h1>
      </div>

      {trip.cover_image_url && (
        <div className="card grain deckle relative h-48 w-full overflow-hidden">
          <Image src={trip.cover_image_url} alt="" fill className="object-cover" unoptimized />
        </div>
      )}

      <ComparatorTable options={itineraryOptions} />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <DateOverlapChart participants={dateParticipants} />
        <BudgetOverlapChart amounts={budgetAmounts} currency={primaryCurrency} />
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
          Your three options
        </p>
        <div className="mt-3">
          <ResultsView
            slug={slug}
            outputId={output.id}
            tripLabel={`${trip.organizer_name}'s trip`}
            itineraryOptions={itineraryOptions}
            reactions={reactions ?? []}
            lockedOptionIndex={output.locked_option_index}
            regenerationFeedback={output.regeneration_feedback}
            recommendedStartDate={output.recommended_start_date}
            majorityDepartureLocation={majorityDeparture}
          />
        </div>
      </div>

      <RecommendationsSection slug={slug} initialRecommendations={recommendationRows} />

      {openQuestions.length > 0 && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-5 dark:border-amber-800 dark:bg-amber-950">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-300">
            Open questions for the group
          </p>
          <ul className="mt-2 list-inside list-disc text-sm text-amber-900 dark:text-amber-200">
            {openQuestions.map((q, i) => (
              <li key={i}>{q}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
