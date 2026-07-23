import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { GroupView } from "./GroupView";
import { GenerateButton } from "./GenerateButton";

export default async function TripPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: trip } = await supabase
    .from("trips")
    .select("id, slug, organizer_name, status")
    .eq("slug", slug)
    .single();

  if (!trip) {
    notFound();
  }

  const { data: participants } = await supabase
    .from("participants")
    .select("id, name")
    .eq("trip_id", trip.id)
    .order("created_at", { ascending: true });

  const { data: submissions } = await supabase
    .from("submissions")
    .select("participant_id")
    .eq("trip_id", trip.id);

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-6 py-16">
      <div>
        <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
          {trip.organizer_name}&apos;s trip
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Status: {trip.status}
        </p>
      </div>

      <div className="rounded-xl border border-black/10 p-4 dark:border-white/10">
        <p className="text-sm font-medium text-black dark:text-zinc-50">
          Share this link with your group
        </p>
        <code className="mt-2 block break-all rounded-lg bg-zinc-100 px-3 py-2 text-sm dark:bg-zinc-900">
          /trip/{trip.slug}/join
        </code>
      </div>

      <GroupView
        tripId={trip.id}
        slug={trip.slug}
        initialParticipants={participants ?? []}
        initialSubmittedIds={(submissions ?? []).map((s) => s.participant_id)}
      />

      <Link
        href={`/trip/${trip.slug}/join`}
        className="rounded-full bg-black px-5 py-2.5 text-center text-sm font-medium text-white dark:bg-white dark:text-black"
      >
        Join this trip
      </Link>

      <div className="flex items-center gap-4">
        <GenerateButton slug={trip.slug} />
        {trip.status !== "collecting" && (
          <Link href={`/trip/${trip.slug}/results`} className="text-sm underline">
            View latest itinerary
          </Link>
        )}
      </div>
    </div>
  );
}
