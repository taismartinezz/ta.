// Real photos, no API key: a single unauthenticated request to Wikipedia's
// public search API. Returns a stable, hotlinkable image URL directly, so
// there's no need to download/re-upload anything to our own storage.
const USER_AGENT = "ta-trip-planner/1.0 (+https://github.com/taismartinezz/ta)";

// Wikipedia's `piprop=original` returns the full source file, which for a
// place-name article is often a many-megabyte, several-thousand-pixel-wide
// photo; that's slow (sometimes multiple seconds) to download and can look
// like a blank box on the results page while it's still loading. Requesting
// a thumbnail keeps the same real photo but at a page-appropriate size.
const THUMBNAIL_WIDTH = 1200;

interface WikipediaPage {
  thumbnail?: { source?: string };
}

async function searchOnce(query: string): Promise<string | null> {
  const url = new URL("https://en.wikipedia.org/w/api.php");
  url.searchParams.set("action", "query");
  url.searchParams.set("generator", "search");
  url.searchParams.set("gsrsearch", query);
  url.searchParams.set("gsrlimit", "1");
  url.searchParams.set("prop", "pageimages");
  url.searchParams.set("piprop", "thumbnail");
  url.searchParams.set("pithumbsize", String(THUMBNAIL_WIDTH));
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
  return firstPage?.thumbnail?.source ?? null;
}

export async function fetchWikipediaImage(query: string): Promise<string | null> {
  const trimmed = query.trim();
  if (!trimmed) {
    return null;
  }

  try {
    const hit = await searchOnce(trimmed);
    if (hit) {
      return hit;
    }

    // The query is often "City, Country"; if that exact phrase doesn't turn
    // up an article with a photo, retrying on just the city name alone
    // covers most of the misses without risking a wildly different place.
    const simplified = trimmed.split(",")[0]?.trim();
    if (simplified && simplified !== trimmed) {
      return await searchOnce(simplified);
    }

    return null;
  } catch (err) {
    console.error("Failed to fetch Wikipedia image", err);
    return null;
  }
}
