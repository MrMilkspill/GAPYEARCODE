export const competitivenessTierLabels = {
  VERY_STRONG: "Very strong",
  STRONG: "Strong",
  BORDERLINE: "Borderline",
  NEEDS_IMPROVEMENT: "Needs improvement",
} as const;

export const gapYearPredictionLabels = {
  NO_GAP: "Likely no gap year needed",
  ONE_GAP: "Likely 1 gap year recommended",
  TWO_PLUS_GAPS: "Likely 2+ gap years recommended",
} as const;

export const confidenceLevelLabels = {
  LOW: "Low",
  MODERATE: "Moderate",
  HIGH: "High",
} as const;

export function scoreTone(score: number) {
  if (score >= 80) {
    return "text-emerald-700";
  }
  if (score >= 65) {
    return "text-sky-700";
  }
  if (score >= 50) {
    return "text-amber-700";
  }
  return "text-rose-700";
}
