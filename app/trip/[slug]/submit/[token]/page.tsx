import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Submission, TripStatus } from "@/lib/types";
import { SubmitForm } from "./SubmitForm";

export default async function SubmitPage({
  params,
}: {
  params: Promise<{ slug: string; token: string }>;
}) {
  const { slug, token } = await params;
  const supabase = await createClient();

  const { data: trip } = await supabase
    .from("trips")
    .select("id, status")
    .eq("slug", slug)
    .single();

  if (!trip) {
    notFound();
  }

  const { data: participant } = await supabase
    .from("participants")
    .select("id, name")
    .eq("trip_id", trip.id)
    .eq("edit_token", token)
    .single();

  if (!participant) {
    notFound();
  }

  const { data: submission } = await supabase
    .from("submissions")
    .select("*")
    .eq("participant_id", participant.id)
    .maybeSingle();

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col px-6 py-16">
      <h1 className="text-2xl font-semibold text-foreground">
        {submission ? "Edit your trip preferences" : "Your trip preferences"}
      </h1>
      <p className="mt-2 text-sm text-muted">
        Only you can see these until the group itinerary is generated.
      </p>
      <div className="mt-3 rounded-lg border border-rose-300 bg-rose-50 p-3 text-sm text-rose-900 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-200">
        🔒 This link is private to you — it&apos;s how you&apos;ll come back to edit your own
        answers. Don&apos;t share it with the group; use the invite link on the trip&apos;s group
        page instead.
      </div>
      {submission && (
        <p className="mt-1 text-xs text-muted">
          Last updated {new Date(submission.updated_at).toLocaleString()} — bookmark this
          page to come back and edit later.
        </p>
      )}
      {trip.status !== "collecting" && (
        <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
          An itinerary has already been generated for this trip. Changes you make here
          won&apos;t be reflected until the group regenerates it.
        </div>
      )}
      <SubmitForm
        slug={slug}
        token={token}
        tripStatus={trip.status as TripStatus}
        initialSubmission={(submission as Submission | null) ?? null}
      />
    </div>
  );
}
