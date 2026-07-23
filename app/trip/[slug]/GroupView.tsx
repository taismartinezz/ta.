"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { MIN_SUBMISSIONS_TO_GENERATE } from "@/lib/constants";

interface ParticipantRow {
  id: string;
  name: string;
}

export function GroupView({
  tripId,
  slug,
  initialParticipants,
  initialSubmittedIds,
}: {
  tripId: string;
  slug: string;
  initialParticipants: ParticipantRow[];
  initialSubmittedIds: string[];
}) {
  const router = useRouter();
  const [participants, setParticipants] = useState<ParticipantRow[]>(initialParticipants);
  const [submittedIds, setSubmittedIds] = useState<Set<string>>(
    () => new Set(initialSubmittedIds)
  );
  const [nudged, setNudged] = useState<Set<string>>(new Set());
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`trip-${tripId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "participants",
          filter: `trip_id=eq.${tripId}`,
        },
        (payload) => {
          const row = payload.new as ParticipantRow;
          setParticipants((prev) =>
            prev.some((p) => p.id === row.id) ? prev : [...prev, { id: row.id, name: row.name }]
          );
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "submission_events",
          filter: `trip_id=eq.${tripId}`,
        },
        (payload) => {
          const row = payload.new as { participant_id: string };
          setSubmittedIds((prev) => new Set(prev).add(row.participant_id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tripId]);

  async function handleNudge(participantId: string) {
    setNudged((prev) => new Set(prev).add(participantId));
    try {
      await fetch(`/api/trips/${slug}/nudge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participant_id: participantId }),
      });
    } catch {
      // Best-effort — if it fails, that person just won't see a banner next visit.
    }
  }

  async function handleGenerate() {
    setGenerateError(null);
    setGenerating(true);
    try {
      const res = await fetch(`/api/trips/${slug}/generate`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setGenerateError(data.error || "Something went wrong");
        return;
      }
      router.push(`/trip/${slug}/results`);
    } catch {
      setGenerateError("Something went wrong, try again");
    } finally {
      setGenerating(false);
    }
  }

  const canGenerate = submittedIds.size >= MIN_SUBMISSIONS_TO_GENERATE;

  return (
    <div className="rounded-xl border border-black/10 p-4 dark:border-white/10">
      <p className="text-sm font-medium text-black dark:text-zinc-50">
        {participants.length} joined · {submittedIds.size} submitted
      </p>
      <ul className="mt-3 flex flex-col gap-2">
        {participants.map((p) => (
          <li
            key={p.id}
            className="flex items-center justify-between text-sm text-black dark:text-zinc-50"
          >
            <span>{p.name}</span>
            {submittedIds.has(p.id) ? (
              <span className="text-green-600 dark:text-green-400">Submitted</span>
            ) : (
              <span className="flex items-center gap-2">
                <span className="text-zinc-400">Waiting</span>
                <button
                  type="button"
                  onClick={() => handleNudge(p.id)}
                  disabled={nudged.has(p.id)}
                  className="rounded-full border border-black/10 px-2 py-0.5 text-xs disabled:opacity-50 dark:border-white/10"
                >
                  {nudged.has(p.id) ? "Nudged" : "Nudge"}
                </button>
              </span>
            )}
          </li>
        ))}
        {participants.length === 0 && (
          <li className="text-sm text-zinc-400">No one has joined yet.</li>
        )}
      </ul>

      <div className="mt-4 flex flex-col gap-2 border-t border-black/10 pt-4 dark:border-white/10">
        <button
          type="button"
          onClick={handleGenerate}
          disabled={!canGenerate || generating}
          className="rounded-full bg-black px-5 py-2.5 text-center text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
        >
          {generating ? "Generating..." : "Generate itinerary options"}
        </button>
        {!canGenerate && (
          <p className="text-xs text-zinc-500">
            Need at least {MIN_SUBMISSIONS_TO_GENERATE} submissions before generating
            ({submittedIds.size}/{MIN_SUBMISSIONS_TO_GENERATE} so far).
          </p>
        )}
        {generateError && <p className="text-sm text-red-600 dark:text-red-400">{generateError}</p>}
      </div>
    </div>
  );
}
