// Real photos, no API key — a single unauthenticated request to Wikipedia's
// public search API. Returns a stable, hotlinkable image URL directly, so
// there's no need to download/re-upload anything to our own storage.
const USER_AGENT = "ta-trip-planner/1.0 (+https://github.com/taismartinezz/ta)";

interface WikipediaPage {
  original?: { source?: string };
}

export async function fetchWikipediaImage(query: string): Promise<string | null> {
  if (!query.trim()) {
    return null;
  }

  try {
    const url = new URL("https://en.wikipedia.org/w/api.php");
    url.searchParams.set("action", "query");
    url.searchParams.set("generator", "search");
    url.searchParams.set("gsrsearch", query);
    url.searchParams.set("gsrlimit", "1");
    url.searchParams.set("prop", "pageimages");
    url.searchParams.set("piprop", "original");
    url.searchParams.set("format", "json");
    url.searchParams.set("origin", "*");

    const res = await fetch(url.toString(), { headers: { "User-Agent": USER_AGENT } });
    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    const pages = data?.query?.pages as Record<string, WikipediaPage> | undefined;
    if (!pages) {
      return null;
    }

    const firstPage = Object.values(pages)[0];
    return firstPage?.original?.source ?? null;
  } catch (err) {
    console.error("Failed to fetch Wikipedia image", err);
    return null;
  }
}
