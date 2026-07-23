"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError("Enter your email");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (signInError) {
        setError(signInError.message);
        return;
      }
      setSent(true);
    } catch {
      setError("Something went wrong, try again");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-6 dark:bg-black">
      <div className="w-full max-w-md rounded-2xl border border-black/10 bg-white p-8 dark:border-white/10 dark:bg-zinc-950">
        <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">Log in</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Optional — logging in lets you see a history of trips you&apos;ve created or joined,
          and reuse your preferences on future trips. You don&apos;t need an account to plan a
          trip via a shared link.
        </p>

        {sent ? (
          <p className="mt-6 text-sm text-green-600 dark:text-green-400">
            Check your email for a magic link to log in.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-black dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-50"
              />
            </label>
            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 rounded-full bg-black px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
            >
              {loading ? "Sending..." : "Send magic link"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
