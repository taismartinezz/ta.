import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createAuthServerClient } from "@/lib/supabase/auth-server";
import { createClient } from "@/lib/supabase/server";
import { CATEGORICAL_SLOT_CLASSES } from "@/lib/chart-colors";
import { SuitcaseIcon } from "@/app/icons";
import type { Trip, TripStatus } from "@/lib/types";

const STATUS_LABEL: Record<TripStatus, string> = {
  collecting: "Planning",
  generated: "Options ready",
  finalized: "Locked in",
};

interface ParticipantSummary {
  id: string;
  name: string;
}

interface OutputSummary {
  recommended_start_date: string | null;
  day_count: number;
}

export default async function TripsHistoryPage() {
  const authClient = await createAuthServerClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const supabase = await createClient();

  const [{ data: createdTrips }, { data: joinedParticipants }] = await Promise.all([
    supabase
      .from("trips")
      .select("id, slug, organizer_name, status, cover_image_url, created_at")
      .eq("created_by", user.id),
    supabase
      .from("participants")
      .select("trips(id, slug, organizer_name, status, cover_image_url, created_at)")
      .eq("user_id", user.id),
  ]);

  const joinedTrips = (joinedParticipants ?? [])
    .map((p) => p.trips as unknown as Trip | null)
    .filter((t): t is Trip => t !== null);

  const allTrips = new Map<string, Trip>();
  for (const trip of [...(createdTrips ?? []), ...joinedTrips]) {
    allTrips.set(trip.id, trip);
  }
  const trips = Array.from(allTrips.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const tripIds = trips.map((t) => t.id);
  const participantsByTrip = new Map<string, ParticipantSummary[]>();
  const outputByTrip = new Map<string, OutputSummary>();

  if (tripIds.length > 0) {
    const [{ data: allParticipants }, { data: allOutputs }] = await Promise.all([
      supabase.from("participants").select("id, trip_id, name").in("trip_id", tripIds),
      supabase
        .from("generated_outputs")
        .select("trip_id, recommended_start_date, itinerary_options, created_at")
        .in("trip_id", tripIds)
        .order("created_at", { ascending: false }),
    ]);

    for (const p of allParticipants ?? []) {
      const list = participantsByTrip.get(p.trip_id) ?? [];
      list.push({ id: p.id, name: p.name });
      participantsByTrip.set(p.trip_id, list);
    }

    for (const o of allOutputs ?? []) {
      if (outputByTrip.has(o.trip_id)) continue; // already have the latest (sorted desc)
      const options = (o.itinerary_options ?? []) as { days?: unknown[] }[];
      outputByTrip.set(o.trip_id, {
        recommended_start_date: o.recommended_start_date,
        day_count: options[0]?.days?.length ?? 0,
      });
    }
  }

  function dateRangeLabel(tripId: string): string {
    const output = outputByTrip.get(tripId);
    if (!output?.recommended_start_date || output.day_count === 0) {
      return "Dates TBD";
    }
    const start = new Date(`${output.recommended_start_date}T00:00:00Z`);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + output.day_count - 1);
    const fmt = (d: Date) => d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    return `${fmt(start)} – ${fmt(end)}`;
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 px-6 py-16 text-foreground">
      <div>
        <h1 className="text-2xl font-semibold">Your trips</h1>
        <p className="mt-1 text-sm text-muted">
          Trips you&apos;ve created or joined while logged in.
        </p>
      </div>

      {trips.length === 0 ? (
        <p className="text-sm text-muted">
          No trips yet.{" "}
          <Link href="/" className="text-accent underline">
            Create one
          </Link>
          .
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3">
          {trips.map((trip) => {
            const participants = participantsByTrip.get(trip.id) ?? [];
            return (
              <Link
                key={trip.id}
                href={`/trip/${trip.slug}`}
                className="group overflow-hidden rounded-xl border border-border"
              >
                <div className="relative h-32 w-full bg-accent-soft">
                  {trip.cover_image_url ? (
                    <Image
                      src={trip.cover_image_url}
                      alt=""
                      fill
                      className="photo-grade object-cover transition-transform group-hover:scale-105"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <SuitcaseIcon size={32} className="text-muted" />
                    </div>
                  )}
                  <span className="badge-stamp absolute right-2 top-2 bg-black/70 text-xs font-medium text-white">
                    {STATUS_LABEL[trip.status]}
                  </span>
                </div>
                <div className="p-4">
                  <p className="font-medium">{trip.organizer_name}&apos;s trip</p>
                  <p className="mt-1 text-xs text-muted">{dateRangeLabel(trip.id)}</p>
                  <div className="mt-3 flex items-center -space-x-2">
                    {participants.slice(0, 5).map((p, i) => (
                      <span
                        key={p.id}
                        title={p.name}
                        className={`flex h-7 w-7 items-center justify-center rounded-full border-2 border-white text-xs font-medium text-white dark:border-zinc-950 ${
                          CATEGORICAL_SLOT_CLASSES[i % CATEGORICAL_SLOT_CLASSES.length]
                        }`}
                      >
                        {p.name.charAt(0).toUpperCase()}
                      </span>
                    ))}
                    {participants.length > 5 && (
                      <span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-zinc-300 text-xs font-medium text-zinc-700 dark:border-zinc-950 dark:bg-zinc-700 dark:text-zinc-200">
                        +{participants.length - 5}
                      </span>
                    )}
                    {participants.length === 0 && (
                      <span className="text-xs text-muted">No one joined yet</span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
