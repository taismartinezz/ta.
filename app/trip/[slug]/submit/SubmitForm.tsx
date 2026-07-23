"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { participantStorageKey } from "@/lib/participant-storage";
import { ACTIVITY_INTEREST_OPTIONS } from "@/lib/activity-options";
import type { ActivityLevel } from "@/lib/types";

interface DateRangeInput {
  start: string;
  end: string;
}

interface OutlierCheckResponse {
  is_outlier: boolean;
  group_median: number | null;
}

const ACTIVITY_LEVELS: { value: ActivityLevel; label: string }[] = [
  { value: "relaxing", label: "Relaxing" },
  { value: "balanced", label: "Balanced" },
  { value: "adventurous", label: "Adventurous" },
];

function parseTags(value: string): string[] {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function SubmitForm({ slug }: { slug: string }) {
  const router = useRouter();
  const [participantId] = useState<string | null>(() =>
    typeof window === "undefined" ? null : localStorage.getItem(participantStorageKey(slug))
  );
  const [budgetAmount, setBudgetAmount] = useState("");
  const [budgetCurrency, setBudgetCurrency] = useState("USD");
  const [dateRanges, setDateRanges] = useState<DateRangeInput[]>([{ start: "", end: "" }]);
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>("balanced");
  const [mustHaves, setMustHaves] = useState("");
  const [dealbreakers, setDealbreakers] = useState("");
  const [activityInterests, setActivityInterests] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [outlierResult, setOutlierResult] = useState<OutlierCheckResponse | null>(null);
  const [budgetAtFirstFlag, setBudgetAtFirstFlag] = useState<number | null>(null);
  const [sawOutlierFlag, setSawOutlierFlag] = useState(false);
  const [shareAnonymously, setShareAnonymously] = useState(false);

  useEffect(() => {
    if (!participantId) {
      router.replace(`/trip/${slug}/join`);
    }
  }, [participantId, slug, router]);

  function updateDateRange(index: number, field: keyof DateRangeInput, value: string) {
    setDateRanges((prev) =>
      prev.map((range, i) => (i === index ? { ...range, [field]: value } : range))
    );
  }

  function addDateRange() {
    setDateRanges((prev) => [...prev, { start: "", end: "" }]);
  }

  function removeDateRange(index: number) {
    setDateRanges((prev) => prev.filter((_, i) => i !== index));
  }

  function toggleActivityInterest(option: string) {
    setActivityInterests((prev) =>
      prev.includes(option) ? prev.filter((o) => o !== option) : [...prev, option]
    );
  }

  async function handleBudgetBlur() {
    const amount = Number(budgetAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      return;
    }

    try {
      const res = await fetch(`/api/trips/${slug}/check-budget`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ budget_amount: amount }),
      });
      if (!res.ok) {
        return;
      }
      const data: OutlierCheckResponse = await res.json();
      setOutlierResult(data);
      if (data.is_outlier) {
        setSawOutlierFlag(true);
        setBudgetAtFirstFlag((prev) => prev ?? amount);
      }
    } catch {
      // Outlier check is a soft UX nicety — never blocks submission if it fails.
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!participantId) {
      setError("You need to join this trip first");
      return;
    }

    const budget = Number(budgetAmount);
    if (!Number.isFinite(budget) || budget <= 0) {
      setError("Enter a valid budget");
      return;
    }

    const validDateRanges = dateRanges.filter((r) => r.start && r.end);
    if (validDateRanges.length === 0) {
      setError("Add at least one available date range");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/trips/${slug}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participant_id: participantId,
          budget_amount: budget,
          budget_currency: budgetCurrency,
          available_dates: validDateRanges,
          activity_level: activityLevel,
          must_haves: parseTags(mustHaves),
          dealbreakers: parseTags(dealbreakers),
          activity_interests: activityInterests,
          flagged_as_outlier: sawOutlierFlag,
          participant_adjusted: sawOutlierFlag && budgetAtFirstFlag !== null && budget !== budgetAtFirstFlag,
          shared_to_group_anonymously: sawOutlierFlag && shareAnonymously,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }
      setSubmitted(true);
    } catch {
      setError("Something went wrong, try again");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="mt-8 rounded-xl border border-black/10 p-6 text-center dark:border-white/10">
        <p className="text-lg font-medium text-black dark:text-zinc-50">
          Thanks — your preferences are saved.
        </p>
        <a href={`/trip/${slug}`} className="mt-3 inline-block text-sm underline">
          Back to the group view
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-8 text-black dark:text-zinc-50">
      <fieldset className="flex flex-col gap-3">
        <legend className="text-sm font-semibold">Budget</legend>
        <div className="flex gap-3">
          <input
            type="number"
            min="0"
            value={budgetAmount}
            onChange={(e) => setBudgetAmount(e.target.value)}
            onBlur={handleBudgetBlur}
            placeholder="Amount"
            className="w-full rounded-lg border border-black/10 px-3 py-2 dark:border-white/10 dark:bg-zinc-900"
          />
          <select
            value={budgetCurrency}
            onChange={(e) => setBudgetCurrency(e.target.value)}
            className="rounded-lg border border-black/10 px-3 py-2 dark:border-white/10 dark:bg-zinc-900"
          >
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
          </select>
        </div>
        {outlierResult?.is_outlier && (
          <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm dark:border-amber-800 dark:bg-amber-950">
            <p className="text-amber-900 dark:text-amber-200">
              Your budget looks noticeably lower than what others in the group have
              entered so far (group median ~{outlierResult.group_median} {budgetCurrency}).
              This is only visible to you — feel free to adjust the amount above.
            </p>
            <label className="mt-2 flex items-center gap-2 text-amber-900 dark:text-amber-200">
              <input
                type="checkbox"
                checked={shareAnonymously}
                onChange={(e) => setShareAnonymously(e.target.checked)}
              />
              Flag this to the group anonymously (optional — no one will know it&apos;s you)
            </label>
          </div>
        )}
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="text-sm font-semibold">Available dates</legend>
        {dateRanges.map((range, index) => (
          <div key={index} className="flex items-center gap-3">
            <input
              type="date"
              value={range.start}
              onChange={(e) => updateDateRange(index, "start", e.target.value)}
              className="rounded-lg border border-black/10 px-3 py-2 dark:border-white/10 dark:bg-zinc-900"
            />
            <span className="text-sm text-zinc-500">to</span>
            <input
              type="date"
              value={range.end}
              onChange={(e) => updateDateRange(index, "end", e.target.value)}
              className="rounded-lg border border-black/10 px-3 py-2 dark:border-white/10 dark:bg-zinc-900"
            />
            {dateRanges.length > 1 && (
              <button
                type="button"
                onClick={() => removeDateRange(index)}
                className="text-sm text-zinc-400 hover:text-zinc-600"
              >
                Remove
              </button>
            )}
          </div>
        ))}
        <button type="button" onClick={addDateRange} className="self-start text-sm underline">
          + Add another window
        </button>
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="text-sm font-semibold">Vibe</legend>
        <div className="flex gap-2">
          {ACTIVITY_LEVELS.map((level) => (
            <button
              key={level.value}
              type="button"
              onClick={() => setActivityLevel(level.value)}
              className={`rounded-full px-4 py-2 text-sm ${
                activityLevel === level.value
                  ? "bg-black text-white dark:bg-white dark:text-black"
                  : "border border-black/10 dark:border-white/10"
              }`}
            >
              {level.label}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="text-sm font-semibold">Activities you&apos;re interested in</legend>
        <div className="flex flex-wrap gap-2">
          {ACTIVITY_INTEREST_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => toggleActivityInterest(option)}
              className={`rounded-full px-3 py-1.5 text-sm capitalize ${
                activityInterests.includes(option)
                  ? "bg-black text-white dark:bg-white dark:text-black"
                  : "border border-black/10 dark:border-white/10"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="text-sm font-semibold">Must-haves</legend>
        <input
          type="text"
          value={mustHaves}
          onChange={(e) => setMustHaves(e.target.value)}
          placeholder="e.g. pool, private rooms, walkable to town"
          className="rounded-lg border border-black/10 px-3 py-2 dark:border-white/10 dark:bg-zinc-900"
        />
        <p className="text-xs text-zinc-500">Comma-separated</p>
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="text-sm font-semibold">Dealbreakers</legend>
        <input
          type="text"
          value={dealbreakers}
          onChange={(e) => setDealbreakers(e.target.value)}
          placeholder="e.g. no camping, no red-eye flights"
          className="rounded-lg border border-black/10 px-3 py-2 dark:border-white/10 dark:bg-zinc-900"
        />
        <p className="text-xs text-zinc-500">Comma-separated</p>
      </fieldset>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="rounded-full bg-black px-5 py-3 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
      >
        {loading ? "Saving..." : "Submit my preferences"}
      </button>
    </form>
  );
}
