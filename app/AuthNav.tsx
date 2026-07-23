"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export function AuthNav() {
  const [email, setEmail] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getSession().then(({ data }) => {
      setEmail(data.session?.user.email ?? null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user.email ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  if (email === undefined) {
    return null;
  }

  return (
    <div className="flex items-center justify-end gap-4 px-6 py-3 text-sm text-zinc-600 dark:text-zinc-400">
      {email ? (
        <>
          <Link href="/trips" className="underline">
            My trips
          </Link>
          <span className="text-zinc-400">{email}</span>
          <button type="button" onClick={handleLogout} className="underline">
            Log out
          </button>
        </>
      ) : (
        <Link href="/login" className="underline">
          Log in
        </Link>
      )}
    </div>
  );
}
