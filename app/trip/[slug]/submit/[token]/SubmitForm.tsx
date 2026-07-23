"use client";

import { useEffect, useState, type FormEvent } from "react";
import { participantStorageKey, editTokenStorageKey } from "@/lib/participant-storage";
import { ACTIVITY_INTEREST_OPTIONS } from "@/lib/activity-options";
import { MIN_BUDGET_AMOUNT, MAX_BUDGET_AMOUNT } from "@/lib/constants";
import { getAuthHeaders } from "@/lib/supabase/auth-header";
import type { ActivityLevel, Submission, TripStatus } from "@/lib/types";

interface ReusableSubmission {
  budget_amount: number;
  budget_currency: string;
  activity_level: ActivityLevel;
  must_haves: string[];
  dealbreakers: string[];
  activity_interests: string[];
}

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

function toDateRangeInputs(dates: Submission["available_dates"] | undefined): DateRangeInput[] {
  if (!dates || dates.length === 0) {
    return [{ start: "", end: "" }];
  }
  return dates.map((d) => ({ start: d.start, end: d.end }));
}

export function SubmitForm({
  slug,
  token,
  tripStatus,
  initialSubmission,
}: {
  slug: string;
  token: string;
  tripStatus: TripStatus;
  initialSubmission: Submission | null;
}) {
  const isEditMode = initialSubmission !== null;

  const [budgetAmount, setBudgetAmount] = useState(
    initialSubmission ? String(initialSubmission.budget_amount) : ""
  );
  const [budgetCurrency, setBudgetCurrency] = useState(
    initialSubmission?.budget_currency ?? "USD"
  );
  const [dateRanges, setDateRanges] = useState<DateRangeInput[]>(
    toDateRangeInputs(initialSubmission?.available_dates)
  );
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(
    initialSubmission?.activity_level ?? "balanced"
  );
  const [mustHaves, setMustHaves] = useState((initialSubmission?.must_haves ?? []).join(", "));
  const [dealbreakers, setDealbreakers] = useState(
    (initialSubmission?.dealbreakers ?? []).join(", ")
  );
  const [activityInterests, setActivityInterests] = useState<string[]>(
    initialSubmission?.activity_interests ?? []
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [outlierResult, setOutlierResult] = useState<OutlierCheckResponse | null>(null);
  const [budgetAtFirstFlag, setBudgetAtFirstFlag] = useState<number | null>(null);
  const [sawOutlierFlag, setSawOutlierFlag] = useState(false);
  const [shareAnonymously, setShareAnonymously] = useState(false);
  const [wasNudged, setWasNudged] = useState(false);
  const [reusableSubmission, setReusableSubmission] = useState<ReusableSubmission | null>(null);
  const [prefilled, setPrefilled] = useState(false);

  useEffect(() => {
    // Sync this device's "who am I on this trip" storage from the edit link,
    // so results-page voting recognizes this participant too.
    localStorage.setItem(editTokenStorageKey(slug), token);
    fetch(`/api/trips/${slug}/submit?token=${token}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.participant_id) {
          localStorage.setItem(participantStorageKey(slug), data.participant_id);
        }
      })
      .catch(() => {
        // Best-effort — voting identity sync isn't required for this page to work.
      });
  }, [slug, token]);

  useEffect(() => {
    fetch(`/api/trips/${slug}/nudge?participant_id=${initialSubmission?.participant_id ?? ""}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.nudged) {
          setWasNudged(true);
        }
      })
      .catch(() => {
        // Best-effort — the banner just won't show if this fails.
      });
  }, [slug, initialSubmission?.participant_id]);

  useEffect(() => {
    if (isEditMode) return; // Prefill only makes sense for a first-time, blank submission.
    getAuthHeaders().then((headers) => {
      if (!headers.Authorization) return;
      fetch(`/api/me/last-submission`, { headers })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.submission) {
            setReusableSubmission(data.submission);
          }
        })
        .catch(() => {
          // Best-effort — the prefill button just won't show if this fails.
        });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function applyPrefill() {
    if (!reusableSubmission) return;
    setBudgetAmount(String(reusableSubmission.budget_amount));
    setBudgetCurrency(reusableSubmission.budget_currency);
    setActivityLevel(reusableSubmission.activity_level);
    setMustHaves(reusableSubmission.must_haves.join(", "));
    setDealbreakers(reusableSubmission.dealbreakers.join(", "));
    setActivityInterests(reusableSubmission.activity_interests);
    setPrefilled(true);
  }

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
        body: JSON.stringify({
          budget_amount: amount,
          participant_id: initialSubmission?.participant_id,
        }),
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
    setJustSaved(false);

    const budget = Number(budgetAmount);
    if (!Number.isFinite(budget) || budget < MIN_BUDGET_AMOUNT) {
      setError("Enter a valid budget");
      return;
    }
    if (budget > MAX_BUDGET_AMOUNT) {
      setError(`Budget must be ${MAX_BUDGET_AMOUNT.toLocaleString()} or less`);
      return;
    }

    const validDateRanges = dateRanges.filter((r) => r.start && r.end);
    if (validDateRanges.length === 0) {
      setError("Add at least one available date range");
      return;
    }

    if (validDateRanges.some((r) => r.end <= r.start)) {
      setError("End date must be after the start date for each date range");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/trips/${slug}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          edit_token: token,
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

      if (isEditMode) {
        setJustSaved(true);
      } else {
        setSubmitted(true);
      }
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
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Bookmark this page if you want to come back and edit your answers later.
        </p>
        <a href={`/trip/${slug}`} className="mt-3 inline-block text-sm underline">
          Back to the group view
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-8 text-black dark:text-zinc-50">
      {wasNudged && (
        <div className="rounded-lg border border-blue-300 bg-blue-50 p-3 text-sm text-blue-900 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200">
          👋 Your group is waiting on you to submit your preferences!
        </div>
      )}

      {reusableSubmission && !prefilled && (
        <div className="rounded-lg border border-black/10 p-3 text-sm dark:border-white/10">
          <p className="text-zinc-600 dark:text-zinc-400">
            You&apos;re logged in and have preferences from a previous trip.
          </p>
          <button
            type="button"
            onClick={applyPrefill}
            className="mt-2 rounded-full border border-black/10 px-3 py-1 text-xs dark:border-white/10"
          >
            Reuse my last preferences
          </button>
        </div>
      )}

      <fieldset className="flex flex-col gap-3">
        <legend className="text-sm font-semibold">Budget</legend>
        <div className="flex gap-3">
          <input
            type="number"
            min={MIN_BUDGET_AMOUNT}
            max={MAX_BUDGET_AMOUNT}
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

      {tripStatus !== "collecting" && (
        <p className="text-xs text-amber-700 dark:text-amber-400">
          Note: an itinerary already exists for this trip — saving here won&apos;t update it
          automatically.
        </p>
      )}

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      {justSaved && (
        <p className="text-sm text-green-600 dark:text-green-400">✓ Saved</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="rounded-full bg-black px-5 py-3 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
      >
        {loading ? "Saving..." : isEditMode ? "Save changes" : "Submit my preferences"}
      </button>
    </form>
  );
}
