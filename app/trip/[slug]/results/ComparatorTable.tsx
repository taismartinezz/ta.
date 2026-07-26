import type { ItineraryOption } from "@/lib/types";
import { SunburstIcon } from "@/app/icons";

export function ComparatorTable({ options }: { options: ItineraryOption[] }) {
  if (options.length === 0) {
    return null;
  }

  return (
    <div className="card grain deckle p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">
        Compare the three options
      </p>

      {/* Below `sm` a 3-column comparison table has no room to breathe even
          with horizontal scroll enabled — a flex/grid ancestor's default
          min-width:auto lets the table's own min-width push the whole page
          wider than the viewport. Stack each option as its own summary card
          instead, and only switch to the side-by-side table once there's
          actually room for it. */}
      <div className="mt-3 flex flex-col gap-3 sm:hidden">
        {options.map((option, i) => (
          <div key={i} className="rounded-lg border border-border p-3">
            <p className="flex items-center gap-1.5 font-display text-base text-foreground">
              {i === 0 && <SunburstIcon size={13} className="shrink-0 text-gold" />}
              {option.destination}
            </p>
            <span className="badge-stamp mt-1.5 inline-flex bg-rust-soft text-xs font-medium text-rust">
              {option.label}
            </span>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-muted">Est. cost / person</span>
              <span className="font-medium text-accent">
                {option.estimated_cost_currency} {option.estimated_cost_per_person?.toLocaleString()}
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between text-sm">
              <span className="text-muted">Days</span>
              <span>{option.days.length}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="hidden overflow-x-auto sm:block">
        <table className="mt-3 w-full min-w-[480px] border-collapse text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-muted">
              <th className="py-2 pr-4 font-medium"></th>
              {options.map((option, i) => (
                <th key={i} className="py-2 pr-4 font-medium">
                  <span className="flex items-center gap-1.5 font-display text-base normal-case text-foreground">
                    {i === 0 && <SunburstIcon size={13} className="text-gold" />}
                    {option.destination}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="[&>tr]:border-t [&>tr]:border-border">
            <tr>
              <td className="py-2 pr-4 text-muted">Vibe</td>
              {options.map((option, i) => (
                <td key={i} className="py-2 pr-4">
                  <span className="badge-stamp bg-rust-soft text-xs font-medium text-rust">
                    {option.label}
                  </span>
                </td>
              ))}
            </tr>
            <tr>
              <td className="py-2 pr-4 text-muted">Est. cost / person</td>
              {options.map((option, i) => (
                <td key={i} className="py-2 pr-4 font-medium text-accent">
                  {option.estimated_cost_currency} {option.estimated_cost_per_person?.toLocaleString()}
                </td>
              ))}
            </tr>
            <tr>
              <td className="py-2 pr-4 text-muted">Days</td>
              {options.map((option, i) => (
                <td key={i} className="py-2 pr-4">
                  {option.days.length}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
