"use client";

import { useState } from "react";
import { DayPicker, type DateRange } from "react-day-picker";
import { format, isSameDay, parseISO } from "date-fns";
import { CalendarIcon } from "./icons";

function toDate(value: string): Date | undefined {
  return value ? parseISO(value) : undefined;
}

function toIso(date: Date | undefined): string {
  return date ? format(date, "yyyy-MM-dd") : "";
}

const dayButton =
  "flex h-9 w-9 items-center justify-center rounded-full text-sm transition-colors hover:bg-accent-soft";

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
    // starts a new range, treat that as "start picked, waiting for the end
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
        className="flex w-full items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-left text-sm text-foreground"
      >
        <CalendarIcon size={16} className="shrink-0 text-muted" />
        {label}
      </button>
      {open && (
        <div className="card grain deckle absolute z-20 mt-2 p-4">
          <DayPicker
            mode="range"
            selected={selected}
            onSelect={handleSelect}
            defaultMonth={selected?.from}
            classNames={{
              root: "font-sans text-foreground",
              months: "flex",
              month: "flex flex-col gap-2",
              month_caption: "flex items-center justify-center py-1 font-display text-base",
              nav: "flex items-center justify-between absolute inset-x-0 top-1",
              button_previous:
                "flex h-7 w-7 items-center justify-center rounded-full text-accent hover:bg-accent-soft",
              button_next:
                "flex h-7 w-7 items-center justify-center rounded-full text-accent hover:bg-accent-soft",
              month_grid: "mt-2 border-collapse",
              weekdays: "flex",
              weekday: "w-9 text-center text-xs uppercase tracking-wide text-muted",
              week: "flex mt-1",
              day: "p-0 text-center",
              day_button: dayButton,
              today: "font-semibold text-rust",
              selected: "!bg-accent !text-accent-foreground",
              range_start: "!bg-accent !text-accent-foreground rounded-full",
              range_end: "!bg-accent !text-accent-foreground rounded-full",
              range_middle: "!bg-accent-soft !text-foreground !rounded-none",
              outside: "text-muted opacity-50",
              disabled: "text-muted opacity-30",
            }}
          />
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="btn-stamp mt-2 w-full bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground"
          >
            Done
          </button>
        </div>
      )}
    </div>
  );
}
