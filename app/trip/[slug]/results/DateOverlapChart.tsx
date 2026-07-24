import { CATEGORICAL_SLOT_CLASSES } from "@/lib/chart-colors";
import type { DateRange } from "@/lib/types";

interface ParticipantDateRanges {
  name: string;
  ranges: DateRange[];
}

function toTime(iso: string): number {
  return new Date(`${iso}T00:00:00Z`).getTime();
}

export function DateOverlapChart({ participants }: { participants: ParticipantDateRanges[] }) {
  const allTimes = participants.flatMap((p) =>
    p.ranges.flatMap((r) => [toTime(r.start), toTime(r.end)])
  );

  if (allTimes.length === 0) {
    return null;
  }

  const min = Math.min(...allTimes);
  const max = Math.max(...allTimes);
  const span = Math.max(max - min, 1);

  return (
    <div className="card grain p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">
        Date availability overlap
      </p>
      <div className="mt-4 flex flex-col gap-2">
        {participants.map((p, i) => (
          <div key={`${p.name}-${i}`} className="flex items-center gap-3">
            <span className="w-24 shrink-0 truncate text-xs text-muted">
              {p.name}
            </span>
            <div className="relative h-4 flex-1 rounded-full bg-border">
              {p.ranges.map((r, j) => {
                const left = ((toTime(r.start) - min) / span) * 100;
                const width = Math.max(((toTime(r.end) - toTime(r.start)) / span) * 100, 2);
                return (
                  <div
                    key={j}
                    className={`absolute top-0 h-4 rounded-full ${
                      CATEGORICAL_SLOT_CLASSES[i % CATEGORICAL_SLOT_CLASSES.length]
                    }`}
                    style={{ left: `${left}%`, width: `${width}%` }}
                    title={`${p.name}: ${r.start} to ${r.end}`}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[10px] text-muted">
        <span>{new Date(min).toISOString().slice(0, 10)}</span>
        <span>{new Date(max).toISOString().slice(0, 10)}</span>
      </div>
    </div>
  );
}
