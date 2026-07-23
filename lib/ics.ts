import type { ItineraryOption } from "./types";

function formatDate(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function escapeText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

// Anchors each day_number to a real calendar date starting from the
// LLM-recommended start date, one all-day event per day.
export function buildICS(
  tripLabel: string,
  option: ItineraryOption,
  startDateISO: string
): string {
  const startDate = new Date(`${startDateISO}T00:00:00Z`);
  const lines: string[] = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Ta Trip Planner//EN"];

  option.days.forEach((day, index) => {
    const dayStart = addDays(startDate, day.day_number - 1);
    const dayEnd = addDays(dayStart, 1);
    lines.push(
      "BEGIN:VEVENT",
      `UID:${startDateISO}-day${day.day_number}-${index}@ta-trip-planner`,
      `DTSTART;VALUE=DATE:${formatDate(dayStart)}`,
      `DTEND;VALUE=DATE:${formatDate(dayEnd)}`,
      `SUMMARY:${escapeText(`${tripLabel} — Day ${day.day_number}`)}`,
      `DESCRIPTION:${escapeText(day.activities.join("\n"))}`,
      "END:VEVENT"
    );
  });

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

export function downloadICS(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
