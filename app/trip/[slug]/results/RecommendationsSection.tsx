"use client";

import { useState } from "react";
import { participantStorageKey } from "@/lib/participant-storage";
import { VoiceInputButton } from "@/app/VoiceInputButton";

interface RecommendationRow {
  id: string;
  place_name: string;
  note: string | null;
  participant_name: string;
}

export function RecommendationsSection({
  slug,
  initialRecommendations,
}: {
  slug: string;
  initialRecommendations: RecommendationRow[];
}) {
  const [recommendations, setRecommendations] = useState(initialRecommendations);
  const [placeName, setPlaceName] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [participantId] = useState<string | null>(() =>
    typeof window === "undefined" ? null : localStorage.getItem(participantStorageKey(slug))
  );

  async function handleSubmit() {
    setError(null);
    if (!participantId) {
      setError("Join this trip to leave a recommendation");
      return;
    }
    if (!placeName.trim()) {
      setError("Enter a place name");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/trips/${slug}/recommendations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participant_id: participantId,
          place_name: placeName.trim(),
          note: note.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }
      setRecommendations((prev) => [
        ...prev,
        {
          id: data.recommendation_id,
          place_name: placeName.trim(),
          note: note.trim() || null,
          participant_name: "You",
        },
      ]);
      setPlaceName("");
      setNote("");
    } catch {
      setError("Something went wrong, try again");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card grain p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">
        Recommendations from the group
      </p>
      <p className="mt-1 text-xs text-muted">
        Favorite spots worth passing on to future trips here.
      </p>

      {recommendations.length > 0 && (
        <ul className="mt-3 flex flex-col gap-2">
          {recommendations.map((r) => (
            <li key={r.id} className="text-sm">
              <span className="font-medium">{r.place_name}</span>
              {r.note && <span className="text-muted"> ({r.note})</span>}
              <p className="text-xs text-muted">Recommended by {r.participant_name}</p>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 flex flex-col gap-2 border-t border-border pt-4">
        <input
          type="text"
          value={placeName}
          onChange={(e) => setPlaceName(e.target.value)}
          placeholder="Place name (e.g. Taco Maria)"
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm"
        />
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Why do you recommend it? (optional)"
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
          />
          <VoiceInputButton
            onTranscribed={(text) => setNote((prev) => (prev ? `${prev} ${text}` : text))}
          />
        </div>
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="btn-stamp self-start bg-accent px-4 py-2 text-sm font-medium text-accent-foreground disabled:opacity-50"
        >
          {loading ? "Adding..." : "Add recommendation"}
        </button>
      </div>
    </div>
  );
}
