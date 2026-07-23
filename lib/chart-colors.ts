// Validated categorical palette (8 slots, fixed order — never cycle by rank).
// Light/dark hex pairs from the dataviz reference palette; worst adjacent
// CVD ΔE 9.1 light / 8.4 dark, worst adjacent normal-vision ΔE 19.6 light /
// 19.3 dark — both clear the accessibility gates unmodified.
export const CATEGORICAL_SLOT_CLASSES = [
  "bg-[#2a78d6] dark:bg-[#3987e5]",
  "bg-[#eb6834] dark:bg-[#d95926]",
  "bg-[#1baf7a] dark:bg-[#199e70]",
  "bg-[#eda100] dark:bg-[#c98500]",
  "bg-[#e87ba4] dark:bg-[#d55181]",
  "bg-[#008300] dark:bg-[#008300]",
  "bg-[#4a3aa7] dark:bg-[#9085e9]",
  "bg-[#e34948] dark:bg-[#e66767]",
];
