"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { getAuthHeaders } from "@/lib/supabase/auth-header";

export default function Home() {
  const router = useRouter();
  const [organizerName, setOrganizerName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!organizerName.trim()) {
      setError("Enter your name to create a trip");
      return;
    }

    setLoading(true);
    try {
      const authHeaders = await getAuthHeaders();
      const res = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ organizer_name: organizerName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }
      router.push(`/trip/${data.slug}`);
    } catch {
      setError("Something went wrong, try again");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-8">
        <h1 className="text-2xl font-semibold text-foreground">
          Plan a trip with your friends
        </h1>
        <p className="mt-2 text-sm text-muted">
          Create a trip, share the link, and everyone submits their own budget,
          dates, and vibe privately.
        </p>
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
          <label className="text-sm font-medium text-muted">
            Your name
            <input
              type="text"
              value={organizerName}
              onChange={(e) => setOrganizerName(e.target.value)}
              placeholder="e.g. Jordan"
              className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-foreground"
            />
          </label>
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create trip"}
          </button>
        </form>
      </div>
    </div>
  );
}
