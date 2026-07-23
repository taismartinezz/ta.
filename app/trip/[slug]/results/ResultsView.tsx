"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { participantStorageKey } from "@/lib/participant-storage";
import { buildICS, downloadICS } from "@/lib/ics";
import { VoiceInputButton } from "@/app/VoiceInputButton";
import { MapView } from "./MapView";
import type { ItineraryOption, ReactionType } from "@/lib/types";

interface ReactionRow {
  participant_id: string;
  option_index: number;
  reaction: ReactionType;
}

interface MyBudget {
  budget_amount: number;
  budget_currency: string;
}

export function ResultsView({
  slug,
  outputId,
  tripLabel,
  itineraryOptions,
  reactions,
  lockedOptionIndex,
  regenerationFeedback,
  recommendedStartDate,
}: {
  slug: string;
  outputId: string;
  tripLabel: string;
  itineraryOptions: ItineraryOption[];
  reactions: ReactionRow[];
  lockedOptionIndex: number | null;
  regenerationFeedback: string | null;
  recommendedStartDate: string | null;
}) {
  const router = useRouter();
  const [participantId] = useState<string | null>(() =>
    typeof window === "undefined" ? null : localStorage.getItem(participantStorageKey(slug))
  );
  const [reactionRows, setReactionRows] = useState<ReactionRow[]>(reactions);
  const [locking, setLocking] = useState(false);
  const [lockError, setLockError] = useState<string | null>(null);
  const [confirmingLockIndex, setConfirmingLockIndex] = useState<number | null>(null);
  const [feedback, setFeedback] = useState("");
  const [regenerating, setRegenerating] = useState(false);
  const [regenerateError, setRegenerateError] = useState<string | null>(null);
  const [myBudget, setMyBudget] = useState<MyBudget | null>(null);
  const [justLocked, setJustLocked] = useState(false);

  const isLocked = lockedOptionIndex !== null;

  useEffect(() => {
    if (!participantId) return;
    fetch(`/api/trips/${slug}/my-budget?participant_id=${participantId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.submission) {
          setMyBudget(data.submission);
        }
      })
      .catch(() => {
        // Best-effort — the budget flag just won't show if this fails.
      });
  }, [slug, participantId]);

  const counts = useMemo(() => {
    const result: Record<number, { up: number; down: number }> = {};
    for (const row of reactionRows) {
      result[row.option_index] ??= { up: 0, down: 0 };
      result[row.option_index][row.reaction]++;
    }
    return result;
  }, [reactionRows]);

  function myReaction(optionIndex: number): ReactionType | null {
    if (!participantId) return null;
    const row = reactionRows.find(
      (r) => r.option_index === optionIndex && r.participant_id === participantId
    );
    return row?.reaction ?? null;
  }

  async function handleReact(optionIndex: number, reaction: ReactionType) {
    if (!participantId) return;

    setReactionRows((prev) => [
      ...prev.filter((r) => !(r.option_index === optionIndex && r.participant_id === participantId)),
      { participant_id: participantId, option_index: optionIndex, reaction },
    ]);

    try {
      await fetch(`/api/trips/${slug}/results/${outputId}/react`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participant_id: participantId, option_index: optionIndex, reaction }),
      });
    } catch {
      // Optimistic update stands even if the network call fails silently.
    }
  }

  async function handleLock(optionIndex: number) {
    setLockError(null);
    setLocking(true);
    try {
      const res = await fetch(`/api/trips/${slug}/results/${outputId}/lock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ option_index: optionIndex }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLockError(data.error || "Something went wrong");
        return;
      }
      setConfirmingLockIndex(null);
      setJustLocked(true);
      router.refresh();
    } catch {
      setLockError("Something went wrong, try again");
    } finally {
      setLocking(false);
    }
  }

  async function handleRegenerate() {
    setRegenerateError(null);
    setRegenerating(true);
    try {
      const res = await fetch(`/api/trips/${slug}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback: feedback.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setRegenerateError(data.error || "Something went wrong");
        return;
      }
      setFeedback("");
      router.refresh();
    } catch {
      setRegenerateError("Something went wrong, try again");
    } finally {
      setRegenerating(false);
    }
  }

  function handleExport(option: ItineraryOption) {
    if (!recommendedStartDate) return;
    const ics = buildICS(tripLabel, option, recommendedStartDate);
    downloadICS(`${tripLabel.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-itinerary.ics`, ics);
  }

  return (
    <div className="flex flex-col gap-6">
      {regenerationFeedback && (
        <p className="text-xs text-zinc-500">
          This version was regenerated based on feedback: &quot;{regenerationFeedback}&quot;
        </p>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {itineraryOptions.map((option, i) => {
          const optionCounts = counts[i] ?? { up: 0, down: 0 };
          const mine = myReaction(i);
          const isThisLocked = lockedOptionIndex === i;
          const exceedsBudget =
            myBudget &&
            option.estimated_cost_per_person !== undefined &&
            option.estimated_cost_currency === myBudget.budget_currency &&
            option.estimated_cost_per_person > myBudget.budget_amount;

          return (
            <div
              key={i}
              className={`rounded-xl border p-5 ${
                isThisLocked
                  ? "border-green-400 dark:border-green-700"
                  : "border-black/10 dark:border-white/10"
              } ${isThisLocked && justLocked ? "animate-lock-reveal" : ""}`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-lg font-semibold">{option.label}</p>
                {isThisLocked && (
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
                    ✅ Locked in
                  </span>
                )}
              </div>

              {option.estimated_cost_per_person !== undefined && (
                <div className="mt-2">
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Est. {option.estimated_cost_currency} {option.estimated_cost_per_person.toLocaleString()}{" "}
                    per person
                  </p>
                  {exceedsBudget && (
                    <p className="mt-1 text-xs font-medium text-amber-700 dark:text-amber-400">
                      ⚠️ This is above the budget you submitted ({myBudget.budget_currency}{" "}
                      {myBudget.budget_amount.toLocaleString()})
                    </p>
                  )}
                </div>
              )}

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

              <MapView days={option.days} />

              {isThisLocked && recommendedStartDate && (
                <button
                  type="button"
                  onClick={() => handleExport(option)}
                  className="mt-4 rounded-full border border-black/10 px-3 py-1.5 text-sm dark:border-white/10"
                >
                  📅 Add to calendar (.ics)
                </button>
              )}

              {!isLocked && confirmingLockIndex === i && (
                <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm dark:border-amber-800 dark:bg-amber-950">
                  <p className="text-amber-900 dark:text-amber-200">
                    Lock this in as the group&apos;s final choice? This can&apos;t be undone.
                  </p>
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleLock(i)}
                      disabled={locking}
                      className="rounded-full bg-black px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
                    >
                      {locking ? "Locking in..." : "Yes, lock it in"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmingLockIndex(null)}
                      disabled={locking}
                      className="rounded-full border border-black/10 px-3 py-1.5 text-xs dark:border-white/10"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {!isLocked && confirmingLockIndex !== i && (
                <div className="mt-4 flex items-center gap-4 border-t border-black/10 pt-4 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => handleReact(i, "up")}
                    disabled={!participantId}
                    className={`rounded-full border px-3 py-1.5 text-sm disabled:opacity-40 ${
                      mine === "up"
                        ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black"
                        : "border-black/10 dark:border-white/10"
                    }`}
                  >
                    👍 {optionCounts.up}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReact(i, "down")}
                    disabled={!participantId}
                    className={`rounded-full border px-3 py-1.5 text-sm disabled:opacity-40 ${
                      mine === "down"
                        ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black"
                        : "border-black/10 dark:border-white/10"
                    }`}
                  >
                    👎 {optionCounts.down}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmingLockIndex(i)}
                    className="ml-auto rounded-full bg-black px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
                  >
                    Lock in this option
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {lockError && <p className="text-sm text-red-600 dark:text-red-400">{lockError}</p>}
      {!participantId && !isLocked && (
        <p className="text-xs text-zinc-500">Join this trip to vote or lock in an option.</p>
      )}

      {!isLocked && (
        <div className="rounded-xl border border-black/10 p-5 dark:border-white/10">
          <p className="text-sm font-semibold">Not quite right? Regenerate with feedback</p>
          <p className="mt-1 text-xs text-zinc-500">
            e.g. &quot;more relaxing&quot;, &quot;cheaper&quot;, &quot;swap day 3 for something
            outdoors&quot;
          </p>
          <div className="mt-3 flex items-start gap-2">
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={2}
              placeholder="What should change?"
              className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/10 dark:bg-zinc-900"
            />
            <VoiceInputButton
              onTranscribed={(text) =>
                setFeedback((prev) => (prev ? `${prev} ${text}` : text))
              }
            />
          </div>
          {regenerateError && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{regenerateError}</p>
          )}
          <button
            type="button"
            onClick={handleRegenerate}
            disabled={regenerating}
            className="mt-3 rounded-full bg-black px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
          >
            {regenerating ? "Regenerating..." : "Regenerate itinerary"}
          </button>
        </div>
      )}

      {isLocked && (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          The group has locked in a final choice — voting and regeneration are closed.
        </p>
      )}
    </div>
  );
}
