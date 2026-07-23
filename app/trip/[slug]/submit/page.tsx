import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SubmitForm } from "./SubmitForm";

export default async function SubmitPage({
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
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col px-6 py-16">
      <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
        Your trip preferences
      </h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Only you can see these until the group itinerary is generated.
      </p>
      <SubmitForm slug={slug} />
    </div>
  );
}
