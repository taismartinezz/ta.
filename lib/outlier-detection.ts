export interface OutlierCheckResult {
  isOutlier: boolean;
  groupMedian: number | null;
  sampleSize: number;
}

// Need at least this many other submissions before a comparison is meaningful.
const MIN_SAMPLE_SIZE = 2;
// Flag when a budget is more than 40% below the group median.
const OUTLIER_THRESHOLD_RATIO = 0.6;

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

export function checkBudgetOutlier(
  candidateBudget: number,
  existingBudgets: number[]
): OutlierCheckResult {
  if (existingBudgets.length < MIN_SAMPLE_SIZE) {
    return { isOutlier: false, groupMedian: null, sampleSize: existingBudgets.length };
  }

  const groupMedian = median(existingBudgets);

  return {
    isOutlier: candidateBudget < groupMedian * OUTLIER_THRESHOLD_RATIO,
    groupMedian,
    sampleSize: existingBudgets.length,
  };
}
