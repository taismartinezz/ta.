// Anonymized on purpose — individual budgets stay private even here, per the
// same principle behind the private outlier-flagging flow on the submit form.
// No per-person marks at all (even unlabeled dots let a small group infer who
// submitted what) — only the aggregate range and median are ever rendered.
export function BudgetOverlapChart({
  amounts,
  currency,
}: {
  amounts: number[];
  currency: string;
}) {
  if (amounts.length === 0) {
    return null;
  }

  const min = Math.min(...amounts);
  const max = Math.max(...amounts);
  const sorted = [...amounts].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  // A band around the median, not a point, so the median itself can't be
  // reverse-engineered as "someone's exact number" when the group is small.
  const bandLeft = min === max ? 0 : (Math.max(median - (max - min) * 0.08, min) - min) / (max - min) * 100;
  const bandWidth = min === max ? 100 : ((Math.min(median + (max - min) * 0.08, max) - min) / (max - min)) * 100 - bandLeft;

  return (
    <div className="card grain p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">
        Budget spread across the group
      </p>
      <p className="mt-1 text-xs text-muted">
        Individual amounts stay anonymous. This only shows the aggregate range.
      </p>
      <div className="relative mt-6 h-2 rounded-full bg-border">
        <div
          className="absolute inset-y-0 rounded-full bg-accent-soft"
          style={{ left: 0, width: "100%" }}
        />
        <div
          className="absolute inset-y-0 rounded-full bg-accent"
          style={{ left: `${bandLeft}%`, width: `${bandWidth}%` }}
        />
      </div>
      <div className="mt-2 flex justify-between text-[10px] text-muted">
        <span>
          {currency} {min.toLocaleString()}
        </span>
        <span className="font-medium text-accent">
          median ~{currency} {median.toLocaleString()}
        </span>
        <span>
          {currency} {max.toLocaleString()}
        </span>
      </div>
    </div>
  );
}
