"use client";

import { useState } from "react";
import { DayPicker, type DateRange } from "react-day-picker";
import { format, isSameDay, parseISO } from "date-fns";
import "react-day-picker/style.css";

function toDate(value: string): Date | undefined {
  return value ? parseISO(value) : undefined;
}

function toIso(date: Date | undefined): string {
  return date ? format(date, "yyyy-MM-dd") : "";
}

export function DateRangePicker({
  start,
  end,
  onChange,
}: {
  start: string;
  end: string;
  onChange: (range: { start: string; end: string }) => void;
}) {
  const [open, setOpen] = useState(false);

  const selected: DateRange | undefined = toDate(start)
    ? { from: toDate(start), to: toDate(end) }
    : undefined;

  function handleSelect(range: DateRange | undefined) {
    // react-day-picker's range mode sets `to = from` on the very click that
    // starts a new range — treat that as "start picked, waiting for the end
    // date" rather than a complete (and invalid, per the app's own
    // end-after-start rule) same-day range, otherwise the popup would close
    // after a single click and the user could never pick a real range.
    if (range?.from && range?.to && isSameDay(range.from, range.to)) {
      onChange({ start: toIso(range.from), end: "" });
      return;
    }
    onChange({ start: toIso(range?.from), end: toIso(range?.to) });
    if (range?.from && range?.to) {
      setOpen(false);
    }
  }

  const label =
    start && end
      ? `${format(parseISO(start), "MMM d, yyyy")} – ${format(parseISO(end), "MMM d, yyyy")}`
      : start
        ? `${format(parseISO(start), "MMM d, yyyy")} – ?`
        : "Pick your dates";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-left text-sm"
      >
        {label}
      </button>
      {open && (
        <div className="absolute z-20 mt-2 rounded-xl border border-border bg-surface p-3 shadow-lg">
          <DayPicker
            mode="range"
            selected={selected}
            onSelect={handleSelect}
            defaultMonth={selected?.from}
            style={
              {
                "--rdp-accent-color": "var(--accent)",
                "--rdp-accent-background-color": "var(--accent-soft)",
              } as React.CSSProperties
            }
          />
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="mt-1 w-full rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground"
          >
            Done
          </button>
        </div>
      )}
    </div>
  );
}
