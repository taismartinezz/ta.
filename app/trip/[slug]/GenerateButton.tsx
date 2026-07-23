"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function GenerateButton({ slug }: { slug: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/trips/${slug}/generate`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }
      router.push(`/trip/${slug}/results`);
    } catch {
      setError("Something went wrong, try again");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleGenerate}
        disabled={loading}
        className="rounded-full bg-black px-5 py-2.5 text-center text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
      >
        {loading ? "Generating..." : "Generate itinerary options"}
      </button>
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
