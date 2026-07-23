import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { JoinForm } from "./JoinForm";

export default async function JoinPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: trip } = await supabase
    .from("trips")
    .select("organizer_name")
    .eq("slug", slug)
    .single();

  if (!trip) {
    notFound();
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
      <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
        Join {trip.organizer_name}&apos;s trip
      </h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Enter your name to submit your own trip preferences privately.
      </p>
      <JoinForm slug={slug} />
    </div>
  );
}
