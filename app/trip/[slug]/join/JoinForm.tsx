"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { participantStorageKey, editTokenStorageKey } from "@/lib/participant-storage";
import { getAuthHeaders } from "@/lib/supabase/auth-header";

interface PendingJoin {
  participantId: string;
  editToken: string;
}

interface ExistingJoin {
  name: string;
  editToken: string;
}

export function JoinForm({ slug }: { slug: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingDuplicate, setPendingDuplicate] = useState<PendingJoin | null>(null);
  const [checkingExisting, setCheckingExisting] = useState(true);
  const [existingJoin, setExistingJoin] = useState<ExistingJoin | null>(null);
  const [joinAsNew, setJoinAsNew] = useState(false);

  // Prevents the most common cause of duplicate participants: re-opening the
  // group's invite link on a device that already joined this trip.
  useEffect(() => {
    const existingToken = localStorage.getItem(editTokenStorageKey(slug));
    if (!existingToken) {
      setCheckingExisting(false);
      return;
    }

    fetch(`/api/trips/${slug}/submit?token=${existingToken}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.participant_name) {
          setExistingJoin({ name: data.participant_name, editToken: existingToken });
        }
      })
      .catch(() => {
        // Best-effort — if this fails, just fall through to the normal join form.
      })
      .finally(() => setCheckingExisting(false));
  }, [slug]);

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
        body: JSON.stringify({ name: name.trim(), email: email.trim() || undefined }),
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

  if (checkingExisting) {
    return null;
  }

  if (existingJoin && !joinAsNew) {
    return (
      <div className="mt-6 flex flex-col gap-3">
        <div className="rounded-lg border border-border bg-surface p-3 text-sm">
          Looks like you already joined this trip as <strong>{existingJoin.name}</strong>.
        </div>
        <button
          type="button"
          onClick={() => router.push(`/trip/${slug}/submit/${existingJoin.editToken}`)}
          className="rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground"
        >
          Continue to my preferences
        </button>
        <button type="button" onClick={() => setJoinAsNew(true)} className="text-sm text-accent underline">
          This isn&apos;t me — join as someone else on this device
        </button>
      </div>
    );
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
          className="rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground"
        >
          Continue anyway
        </button>
        <button
          type="button"
          onClick={() => setPendingDuplicate(null)}
          className="text-sm text-accent underline"
        >
          Go back
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
      <label className="text-sm font-medium text-muted">
        Your name
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Sam"
          className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-foreground"
        />
      </label>
      <label className="text-sm font-medium text-muted">
        Email (optional)
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="so we can nudge you if the group needs your input"
          className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-foreground"
        />
      </label>
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="mt-2 rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground disabled:opacity-50"
      >
        {loading ? "Joining..." : "Continue"}
      </button>
    </form>
  );
}
