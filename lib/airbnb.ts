// Always links to a real, live Airbnb search — never a fabricated listing.
export function buildAirbnbSearchUrl(params: {
  destination: string;
  startDateISO: string | null;
  dayCount: number;
}): string {
  const url = new URL(`https://www.airbnb.com/s/${encodeURIComponent(params.destination)}/homes`);

  if (params.startDateISO && params.dayCount > 0) {
    const start = new Date(`${params.startDateISO}T00:00:00Z`);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + params.dayCount - 1);
    url.searchParams.set("checkin", params.startDateISO);
    url.searchParams.set("checkout", end.toISOString().slice(0, 10));
  }

  return url.toString();
}
