import Link from "next/link";
import { redirect } from "next/navigation";
import { createAuthServerClient } from "@/lib/supabase/auth-server";
import { createClient } from "@/lib/supabase/server";
import type { Trip } from "@/lib/types";

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
      .select("id, slug, organizer_name, status, created_at")
      .eq("created_by", user.id),
    supabase
      .from("participants")
      .select("trips(id, slug, organizer_name, status, created_at)")
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

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-6 py-16 text-black dark:text-zinc-50">
      <div>
        <h1 className="text-2xl font-semibold">Your trips</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Trips you&apos;ve created or joined while logged in.
        </p>
      </div>

      {trips.length === 0 ? (
        <p className="text-sm text-zinc-500">
          No trips yet.{" "}
          <Link href="/" className="underline">
            Create one
          </Link>
          .
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {trips.map((trip) => (
            <li key={trip.id}>
              <Link
                href={`/trip/${trip.slug}`}
                className="block rounded-xl border border-black/10 p-4 hover:border-black/30 dark:border-white/10 dark:hover:border-white/30"
              >
                <p className="font-medium">{trip.organizer_name}&apos;s trip</p>
                <p className="mt-1 text-xs text-zinc-500">
                  Status: {trip.status} · Created {new Date(trip.created_at).toLocaleDateString()}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
