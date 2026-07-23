import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateSlug } from "@/lib/slug";

const MAX_SLUG_ATTEMPTS = 5;
const UNIQUE_VIOLATION = "23505";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const organizerName =
    typeof body?.organizer_name === "string" ? body.organizer_name.trim() : "";

  if (!organizerName) {
    return NextResponse.json(
      { error: "organizer_name is required" },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  for (let attempt = 0; attempt < MAX_SLUG_ATTEMPTS; attempt++) {
    const slug = generateSlug();
    const { data, error } = await supabase
      .from("trips")
      .insert({ organizer_name: organizerName, slug })
      .select("slug")
      .single();

    if (!error) {
      return NextResponse.json({ slug: data.slug }, { status: 201 });
    }

    if (error.code !== UNIQUE_VIOLATION) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json(
    { error: "Could not generate a unique trip link, try again" },
    { status: 500 }
  );
}
