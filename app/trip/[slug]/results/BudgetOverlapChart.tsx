// Anonymized on purpose — individual budgets stay private even here, per the
// same principle behind the private outlier-flagging flow on the submit form.
// Only the spread (min/median/max) is shown, never attributed to a name.
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
  const span = Math.max(max - min, 1);
  const sorted = [...amounts].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];

  return (
    <div className="rounded-xl border border-black/10 p-5 dark:border-white/10">
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
        Budget spread across the group
      </p>
      <p className="mt-1 text-xs text-zinc-500">
        Individual amounts stay anonymous — this only shows the range.
      </p>
      <div className="relative mt-6 h-2 rounded-full bg-zinc-100 dark:bg-zinc-900">
        {amounts.map((a, i) => {
          const left = ((a - min) / span) * 100;
          return (
            <div
              key={i}
              className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#2a78d6] ring-2 ring-white dark:bg-[#3987e5] dark:ring-zinc-950"
              style={{ left: `${left}%` }}
              title={`${currency} ${a.toLocaleString()}`}
            />
          );
        })}
      </div>
      <div className="mt-2 flex justify-between text-[10px] text-zinc-400">
        <span>
          {currency} {min.toLocaleString()}
        </span>
        <span>
          median ~{currency} {median.toLocaleString()}
        </span>
        <span>
          {currency} {max.toLocaleString()}
        </span>
      </div>
    </div>
  );
}
