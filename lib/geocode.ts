import type { GeocodedLocation } from "./types";

// OpenStreetMap's free Nominatim geocoder — no API key, but its usage policy
// requires a descriptive User-Agent and caps requests at ~1/second, so this
// runs once at generation time (not per page view) and geocodes serially.
const NOMINATIM_ENDPOINT = "https://nominatim.openstreetmap.org/search";
const USER_AGENT = "ta-trip-planner/1.0 (+https://github.com/taismartinezz/ta)";
const RATE_LIMIT_MS = 1100;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function geocodePlaceNames(
  names: string[]
): Promise<Map<string, GeocodedLocation>> {
  const unique = Array.from(new Set(names.map((n) => n.trim()).filter(Boolean)));
  const results = new Map<string, GeocodedLocation>();

  for (const name of unique) {
    try {
      const url = `${NOMINATIM_ENDPOINT}?format=json&limit=1&q=${encodeURIComponent(name)}`;
      const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
      if (res.ok) {
        const data = (await res.json()) as { lat: string; lon: string }[];
        if (data[0]) {
          results.set(name, { name, lat: Number(data[0].lat), lon: Number(data[0].lon) });
        }
      }
    } catch {
      // Skip locations that fail to geocode — the map just shows fewer pins.
    }
    await sleep(RATE_LIMIT_MS);
  }

  return results;
}
