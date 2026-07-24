import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { GroupView } from "./GroupView";
import { CopyLinkButton } from "./CopyLinkButton";

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
        <h1 className="text-2xl font-semibold text-foreground">
          {trip.organizer_name}&apos;s trip
        </h1>
        <p className="mt-1 text-sm text-muted">
          Status: {trip.status}
        </p>
      </div>

      <div className="card grain p-4">
        <p className="text-sm font-medium text-foreground">
          Share this link with your group
        </p>
        <code className="mt-2 block break-all rounded-lg bg-accent-soft px-3 py-2 text-sm">
          /trip/{trip.slug}/join
        </code>
        <CopyLinkButton slug={trip.slug} />
      </div>

      <GroupView
        tripId={trip.id}
        slug={trip.slug}
        initialParticipants={participants ?? []}
        initialSubmittedIds={(submissions ?? []).map((s) => s.participant_id)}
      />

      <div className="flex flex-col gap-2">
        <Link
          href={`/trip/${trip.slug}/join`}
          className="btn-stamp bg-accent px-5 py-2.5 text-center text-sm font-medium text-accent-foreground"
        >
          Join this trip
        </Link>
        <p className="text-center text-xs text-muted">
          Creating the trip doesn&apos;t automatically add you as a participant. Click above
          if you want to submit your own preferences too.
        </p>
      </div>

      {trip.status !== "collecting" && (
        <Link href={`/trip/${trip.slug}/results`} className="text-sm text-accent underline">
          View latest itinerary
        </Link>
      )}
    </div>
  );
}
