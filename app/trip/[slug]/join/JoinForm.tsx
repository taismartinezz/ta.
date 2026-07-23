"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { participantStorageKey, editTokenStorageKey } from "@/lib/participant-storage";
import { getAuthHeaders } from "@/lib/supabase/auth-header";

interface PendingJoin {
  participantId: string;
  editToken: string;
}

export function JoinForm({ slug }: { slug: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingDuplicate, setPendingDuplicate] = useState<PendingJoin | null>(null);

  function proceedToSubmit(join: PendingJoin) {
    localStorage.setItem(participantStorageKey(slug), join.participantId);
    localStorage.setItem(editTokenStorageKey(slug), join.editToken);
    router.push(`/trip/${slug}/submit/${join.editToken}`);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Enter your name to join");
      return;
    }

    setLoading(true);
    try {
      const authHeaders = await getAuthHeaders();
      const res = await fetch(`/api/trips/${slug}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }

      const join: PendingJoin = { participantId: data.participant_id, editToken: data.edit_token };

      if (data.duplicate_name) {
        setPendingDuplicate(join);
        return;
      }

      proceedToSubmit(join);
    } catch {
      setError("Something went wrong, try again");
    } finally {
      setLoading(false);
    }
  }

  if (pendingDuplicate) {
    return (
      <div className="mt-6 flex flex-col gap-3">
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
          There&apos;s already someone named &quot;{name.trim()}&quot; on this trip. If that&apos;s
          you and you already submitted preferences, use the edit link you saved instead of
          joining again — otherwise, continue below to join as a separate person.
        </div>
        <button
          type="button"
          onClick={() => proceedToSubmit(pendingDuplicate)}
          className="rounded-full bg-black px-5 py-2.5 text-sm font-medium text-white dark:bg-white dark:text-black"
        >
          Continue anyway
        </button>
        <button
          type="button"
          onClick={() => setPendingDuplicate(null)}
          className="text-sm underline"
        >
          Go back
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
      <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
        Your name
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Sam"
          className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-black dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-50"
        />
      </label>
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="mt-2 rounded-full bg-black px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
      >
        {loading ? "Joining..." : "Continue"}
      </button>
    </form>
  );
}
