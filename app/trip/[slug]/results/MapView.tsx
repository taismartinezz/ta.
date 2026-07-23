"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import type { ItineraryDay } from "@/lib/types";

// Day-indexed hue, distinct from the participant palette used elsewhere on
// this page so a day pin is never mistaken for a participant's bar.
const DAY_COLORS = [
  "#2a78d6",
  "#eb6834",
  "#1baf7a",
  "#eda100",
  "#e87ba4",
  "#008300",
  "#4a3aa7",
  "#e34948",
];

export function MapView({ days }: { days: ItineraryDay[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);

  const pins = days.flatMap((day) =>
    (day.locations ?? []).map((loc) => ({ ...loc, dayNumber: day.day_number }))
  );

  useEffect(() => {
    if (!containerRef.current || pins.length === 0) {
      return;
    }

    let map: import("leaflet").Map | undefined;

    import("leaflet").then((L) => {
      if (!containerRef.current || mapRef.current) {
        return;
      }

      // Leaflet's default marker icon URLs assume a specific static asset
      // layout that Next.js's bundler doesn't preserve — point them at the
      // package's own bundled images explicitly instead.
      delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      map = L.map(containerRef.current).setView([pins[0].lat, pins[0].lon], 11);
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 18,
      }).addTo(map);

      const bounds = L.latLngBounds(pins.map((p) => [p.lat, p.lon]));

      pins.forEach((pin) => {
        const color = DAY_COLORS[(pin.dayNumber - 1) % DAY_COLORS.length];
        L.circleMarker([pin.lat, pin.lon], {
          radius: 8,
          color,
          fillColor: color,
          fillOpacity: 0.9,
          weight: 2,
        })
          .addTo(map!)
          .bindPopup(`<strong>Day ${pin.dayNumber}</strong><br/>${pin.name}`);
      });

      if (pins.length > 1) {
        map.fitBounds(bounds, { padding: [24, 24] });
      }
    });

    return () => {
      map?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (pins.length === 0) {
    return null;
  }

  return (
    <div className="mt-4">
      <div ref={containerRef} className="h-64 w-full overflow-hidden rounded-lg" />
      <p className="mt-1 text-[10px] text-zinc-400">Map data © OpenStreetMap contributors</p>
    </div>
  );
}
