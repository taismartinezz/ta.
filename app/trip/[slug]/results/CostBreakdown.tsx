import type { CostBreakdown as CostBreakdownData } from "@/lib/types";
import { CATEGORICAL_SLOT_CLASSES } from "@/lib/chart-colors";

const CATEGORY_LABELS: { key: keyof CostBreakdownData; label: string }[] = [
  { key: "lodging", label: "Lodging" },
  { key: "food", label: "Food" },
  { key: "activities", label: "Activities" },
  { key: "local_transport", label: "Local transport" },
  { key: "flights", label: "Flights" },
];

export function CostBreakdown({
  breakdown,
  currency,
}: {
  breakdown: CostBreakdownData;
  currency: string;
}) {
  const total = CATEGORY_LABELS.reduce((sum, { key }) => sum + (breakdown[key] ?? 0), 0);
  if (total <= 0) {
    return null;
  }

  return (
    <div className="mt-3">
      <div className="flex h-2.5 gap-0.5 overflow-hidden rounded-full">
        {CATEGORY_LABELS.map(({ key }, i) => {
          const value = breakdown[key] ?? 0;
          if (value <= 0) return null;
          return (
            <div
              key={key}
              className={`${CATEGORICAL_SLOT_CLASSES[i]} h-full`}
              style={{ width: `${(value / total) * 100}%` }}
              title={`${key}: ${currency} ${value.toLocaleString()}`}
            />
          );
        })}
      </div>
      <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-muted sm:grid-cols-3">
        {CATEGORY_LABELS.map(({ key, label }, i) => (
          <li key={key} className="flex items-center gap-1.5">
            <span className={`h-2 w-2 shrink-0 rounded-full ${CATEGORICAL_SLOT_CLASSES[i]}`} />
            {label}: {currency} {(breakdown[key] ?? 0).toLocaleString()}
          </li>
        ))}
      </ul>
    </div>
  );
}
