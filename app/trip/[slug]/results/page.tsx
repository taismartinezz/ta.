import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

interface ItineraryDay {
  day_number: number;
  activities: string[];
}

interface ItineraryOption {
  label: string;
  days: ItineraryDay[];
}

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: trip } = await supabase
    .from("trips")
    .select("id, organizer_name")
    .eq("slug", slug)
    .single();

  if (!trip) {
    notFound();
  }

  const { data: output } = await supabase
    .from("generated_outputs")
    .select("destination_pick, itinerary_options, open_questions, raw_llm_response")
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

  return (
    <div className="mx-auto flex min-h-screen max-w-4xl flex-col gap-8 px-6 py-16 text-black dark:text-zinc-50">
      <div>
        <Link href={`/trip/${slug}`} className="text-sm underline">
          ← Back to the group view
        </Link>
        <h1 className="mt-4 text-2xl font-semibold">{trip.organizer_name}&apos;s trip plan</h1>
      </div>

      <div className="rounded-xl border border-black/10 p-5 dark:border-white/10">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Destination pick
        </p>
        <p className="mt-2 text-xl font-semibold">{output.destination_pick}</p>
        {destinationReasoning && (
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{destinationReasoning}</p>
        )}
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Itinerary options
        </p>
        <div className="mt-3 grid grid-cols-1 gap-6 md:grid-cols-2">
          {itineraryOptions.map((option, i) => (
            <div key={i} className="rounded-xl border border-black/10 p-5 dark:border-white/10">
              <p className="text-lg font-semibold">{option.label}</p>
              <div className="mt-4 flex flex-col gap-4">
                {option.days.map((day) => (
                  <div key={day.day_number}>
                    <p className="text-sm font-semibold text-zinc-500">Day {day.day_number}</p>
                    <ul className="mt-1 list-inside list-disc text-sm">
                      {day.activities.map((activity, j) => (
                        <li key={j}>{activity}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

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
