import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { buildAirbnbSearchUrl } from "@/lib/airbnb";
import type { ItineraryOption } from "@/lib/types";
import { ResultsView } from "./ResultsView";
import { DateOverlapChart } from "./DateOverlapChart";
import { BudgetOverlapChart } from "./BudgetOverlapChart";
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
      "id, destination_pick, itinerary_options, open_questions, raw_llm_response, locked_option_index, regeneration_feedback, recommended_start_date"
    )
    .eq("trip_id", trip.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!output) {
    return (
      <div className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-4 px-6 py-16 text-center text-black dark:text-zinc-50">
        <p className="text-lg font-medium">No itinerary has been generated for this trip yet.</p>
        <Link href={`/trip/${slug}`} className="text-sm underline">
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
        .select("participant_id, available_dates, budget_amount, budget_currency")
        .eq("trip_id", trip.id),
      supabase
        .from("trip_recommendations")
        .select("id, participant_id, place_name, note")
        .eq("trip_id", trip.id),
    ]);

  let destinationReasoning: string | null = null;
  try {
    const rawText = (output.raw_llm_response as { text?: string } | null)?.text;
    if (rawText) {
      const parsed = JSON.parse(rawText);
      if (typeof parsed.destination_reasoning === "string") {
        destinationReasoning = parsed.destination_reasoning;
      }
    }
  } catch {
    destinationReasoning = null;
  }

  const itineraryOptions = (output.itinerary_options ?? []) as ItineraryOption[];
  const openQuestions = (output.open_questions ?? []) as string[];
  const dayCount = itineraryOptions[0]?.days.length ?? 0;
  const airbnbUrl = output.destination_pick
    ? buildAirbnbSearchUrl({
        destination: output.destination_pick,
        startDateISO: output.recommended_start_date,
        dayCount,
      })
    : null;

  const nameByParticipantId = new Map((participants ?? []).map((p) => [p.id, p.name]));
  const dateParticipants = (submissions ?? [])
    .filter((s) => Array.isArray(s.available_dates) && s.available_dates.length > 0)
    .map((s) => ({
      name: nameByParticipantId.get(s.participant_id) ?? "Someone",
      ranges: s.available_dates as { start: string; end: string }[],
    }));
  const budgetAmounts = (submissions ?? []).map((s) => Number(s.budget_amount));
  const primaryCurrency = (submissions ?? [])[0]?.budget_currency ?? "USD";
  const recommendationRows = (recommendations ?? []).map((r) => ({
    id: r.id,
    place_name: r.place_name,
    note: r.note,
    participant_name: nameByParticipantId.get(r.participant_id) ?? "Someone",
  }));

  return (
    <div className="mx-auto flex min-h-screen max-w-4xl flex-col gap-8 px-6 py-16 text-black dark:text-zinc-50">
      <div>
        <Link href={`/trip/${slug}`} className="text-sm underline">
          ← Back to the group view
        </Link>
        <h1 className="mt-4 text-2xl font-semibold">{trip.organizer_name}&apos;s trip plan</h1>
      </div>

      <div className="overflow-hidden rounded-xl border border-black/10 dark:border-white/10">
        {trip.cover_image_url && (
          <div className="relative h-48 w-full bg-zinc-100 dark:bg-zinc-900">
            <Image
              src={trip.cover_image_url}
              alt=""
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        )}
        <div className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Destination pick
          </p>
          <p className="mt-2 text-xl font-semibold">{output.destination_pick}</p>
          {destinationReasoning && (
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{destinationReasoning}</p>
          )}
          {airbnbUrl && (
            <a
              href={airbnbUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block rounded-full border border-black/10 px-3 py-1.5 text-sm dark:border-white/10"
            >
              🏠 Search stays on Airbnb ↗
            </a>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <DateOverlapChart participants={dateParticipants} />
        <BudgetOverlapChart amounts={budgetAmounts} currency={primaryCurrency} />
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Itinerary options
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
