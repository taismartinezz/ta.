"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { participantStorageKey } from "@/lib/participant-storage";
import { buildICS, downloadICS } from "@/lib/ics";
import { buildAirbnbSearchUrl } from "@/lib/airbnb";
import { buildFlightSearchUrl } from "@/lib/flights";
import { VoiceInputButton } from "@/app/VoiceInputButton";
import {
  CheckCircleIcon,
  CalendarIcon,
  WarningIcon,
  ThumbsUpIcon,
  ThumbsDownIcon,
  HouseIcon,
  PlaneDepartureIcon,
  StarIcon,
} from "@/app/icons";
import { MapView } from "./MapView";
import { CostBreakdown } from "./CostBreakdown";
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
  majorityDepartureLocation,
}: {
  slug: string;
  outputId: string;
  tripLabel: string;
  itineraryOptions: ItineraryOption[];
  reactions: ReactionRow[];
  lockedOptionIndex: number | null;
  regenerationFeedback: string | null;
  recommendedStartDate: string | null;
  majorityDepartureLocation: string | null;
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
        // Best-effort, the budget flag just won't show if this fails.
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
        <p className="text-xs text-muted">
          This version was regenerated based on feedback: &quot;{regenerationFeedback}&quot;
        </p>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {itineraryOptions.map((option, i) => {
          const optionCounts = counts[i] ?? { up: 0, down: 0 };
          const mine = myReaction(i);
          const isThisLocked = lockedOptionIndex === i;
          const exceedsBudget =
            myBudget &&
            option.estimated_cost_per_person !== undefined &&
            option.estimated_cost_currency === myBudget.budget_currency &&
            option.estimated_cost_per_person > myBudget.budget_amount;
          const dayCount = option.days.length;
          const airbnbUrl = buildAirbnbSearchUrl({
            destination: option.destination,
            startDateISO: recommendedStartDate,
            dayCount,
          });
          const flightUrl = majorityDepartureLocation
            ? buildFlightSearchUrl({
                origin: majorityDepartureLocation,
                destination: option.destination,
                startDateISO: recommendedStartDate,
                dayCount,
              })
            : null;

          return (
            <div
              key={i}
              className={`card grain deckle flex flex-col overflow-hidden ${
                isThisLocked ? "!border-green-400 dark:!border-green-700" : ""
              } ${isThisLocked && justLocked ? "animate-lock-reveal" : ""}`}
            >
              {option.photo_url && (
                <div className="relative h-36 w-full">
                  <Image src={option.photo_url} alt="" fill className="object-cover" unoptimized />
                </div>
              )}
              <div className="p-5">
                <div className="flex items-center justify-between gap-2">
                  <p className="flex items-center gap-1.5 font-display text-lg font-semibold">
                    {i === 0 && <StarIcon size={15} className="shrink-0 text-gold" />}
                    {option.destination}
                  </p>
                  {isThisLocked && (
                    <span className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
                      <CheckCircleIcon size={13} />
                      Locked in
                    </span>
                  )}
                </div>
                <p className="text-xs uppercase tracking-wide text-rust">{option.label}</p>
                <p className="mt-2 text-sm text-muted">{option.destination_reasoning}</p>

                {option.estimated_cost_per_person !== undefined && (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-foreground">
                      Est. {option.estimated_cost_currency}{" "}
                      {option.estimated_cost_per_person.toLocaleString()} per person
                    </p>
                    {option.cost_breakdown && (
                      <CostBreakdown
                        breakdown={option.cost_breakdown}
                        currency={option.estimated_cost_currency ?? ""}
                      />
                    )}
                    {exceedsBudget && (
                      <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-400">
                        <WarningIcon size={14} className="shrink-0" />
                        This is above the budget you submitted ({myBudget.budget_currency}{" "}
                        {myBudget.budget_amount.toLocaleString()})
                      </p>
                    )}
                  </div>
                )}

                <div className="mt-2 flex flex-wrap gap-2">
                  <a
                    href={airbnbUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs"
                  >
                    <HouseIcon size={14} />
                    Search stays on Airbnb
                  </a>
                  {flightUrl && (
                    <a
                      href={flightUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs"
                    >
                      <PlaneDepartureIcon size={14} />
                      Search flights
                    </a>
                  )}
                </div>

                <div className="mt-4 flex flex-col gap-4">
                  {option.days.map((day) => (
                    <div key={day.day_number}>
                      <p className="text-sm font-semibold text-muted">Day {day.day_number}</p>
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
                    className="mt-4 flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm"
                  >
                    <CalendarIcon size={15} />
                    Add to calendar (.ics)
                  </button>
                )}

                {!isLocked && confirmingLockIndex === i && (
                  <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm dark:border-amber-800 dark:bg-amber-950">
                    <p className="text-amber-900 dark:text-amber-200">
                      Lock this in as the group&apos;s final choice? This can&apos;t be undone.
                    </p>
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleLock(i)}
                        disabled={locking}
                        className="btn-stamp bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground disabled:opacity-50"
                      >
                        {locking ? "Locking in..." : "Yes, lock it in"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmingLockIndex(null)}
                        disabled={locking}
                        className="rounded-full border border-border px-3 py-1.5 text-xs"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {!isLocked && confirmingLockIndex !== i && (
                  <div className="mt-4 flex items-center gap-3 border-t border-border pt-4">
                    <button
                      type="button"
                      onClick={() => handleReact(i, "up")}
                      disabled={!participantId}
                      className={`flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm disabled:opacity-40 ${
                        mine === "up" ? "border-accent bg-accent text-accent-foreground" : "border-border"
                      }`}
                    >
                      <ThumbsUpIcon size={14} />
                      {optionCounts.up}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleReact(i, "down")}
                      disabled={!participantId}
                      className={`flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm disabled:opacity-40 ${
                        mine === "down" ? "border-accent bg-accent text-accent-foreground" : "border-border"
                      }`}
                    >
                      <ThumbsDownIcon size={14} />
                      {optionCounts.down}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmingLockIndex(i)}
                      className="btn-stamp ml-auto bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground disabled:opacity-50"
                    >
                      Lock in this option
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {lockError && <p className="text-sm text-red-600 dark:text-red-400">{lockError}</p>}
      {!participantId && !isLocked && (
        <p className="text-xs text-muted">Join this trip to vote or lock in an option.</p>
      )}

      {!isLocked && (
        <div className="card grain p-5">
          <p className="text-sm font-semibold">Not quite right? Regenerate with feedback</p>
          <p className="mt-1 text-xs text-muted">
            e.g. &quot;more relaxing&quot;, &quot;cheaper&quot;, &quot;swap day 3 for something
            outdoors&quot;
          </p>
          <div className="mt-3 flex items-start gap-2">
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={2}
              placeholder="What should change?"
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
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
            className="btn-stamp mt-3 bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground disabled:opacity-50"
          >
            {regenerating ? "Regenerating..." : "Regenerate itinerary"}
          </button>
        </div>
      )}

      {isLocked && (
        <p className="text-sm text-muted">
          The group has locked in a final choice. Voting and regeneration are closed.
        </p>
      )}
    </div>
  );
}
