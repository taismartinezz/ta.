import type { ItineraryOption } from "@/lib/types";
import { StarIcon } from "@/app/icons";

export function ComparatorTable({ options }: { options: ItineraryOption[] }) {
  if (options.length === 0) {
    return null;
  }

  return (
    <div className="card grain deckle overflow-x-auto p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">
        Compare the three options
      </p>
      <table className="mt-3 w-full min-w-[480px] border-collapse text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wide text-muted">
            <th className="py-2 pr-4 font-medium"></th>
            {options.map((option, i) => (
              <th key={i} className="py-2 pr-4 font-medium">
                <span className="flex items-center gap-1.5 font-display text-base normal-case text-foreground">
                  {i === 0 && <StarIcon size={13} className="text-gold" />}
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
                {option.label}
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
  );
}
