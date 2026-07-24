// Kayak's search URL accepts free-text city slugs (not just airport codes) in
// the /flights/{origin}-{destination}/{depart}/{return} path, so this works
// even though submissions only collect a plain-text departure city.
export function buildFlightSearchUrl(params: {
  origin: string;
  destination: string;
  startDateISO: string | null;
  dayCount: number;
}): string {
  const originSlug = encodeURIComponent(params.origin.trim());
  const destSlug = encodeURIComponent(params.destination.trim());
  const url = new URL(`https://www.kayak.com/flights/${originSlug}-${destSlug}`);

  if (params.startDateISO) {
    let path = url.pathname + `/${params.startDateISO}`;
    if (params.dayCount > 0) {
      const start = new Date(`${params.startDateISO}T00:00:00Z`);
      const end = new Date(start);
      end.setUTCDate(end.getUTCDate() + params.dayCount - 1);
      path += `/${end.toISOString().slice(0, 10)}`;
    }
    url.pathname = path;
  }

  return url.toString();
}

// The group's own departure cities can differ; pick the most common one so
// there's a single representative search link rather than one per person.
export function majorityDepartureLocation(locations: (string | null)[]): string | null {
  const counts = new Map<string, number>();
  for (const loc of locations) {
    const trimmed = loc?.trim();
    if (!trimmed) continue;
    counts.set(trimmed, (counts.get(trimmed) ?? 0) + 1);
  }
  if (counts.size === 0) return null;
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
}
