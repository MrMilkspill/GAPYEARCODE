import type { ScoreResult as PrismaScoreResult } from "@prisma/client";

import type { ScoreComputation } from "@/types/premed";

export function hydrateScoreResult(
  scoreResult: PrismaScoreResult | null,
): ScoreComputation | null {
  if (!scoreResult) {
    return null;
  }

  return {
    overallScore: scoreResult.overallScore,
    rawWeightedScore: scoreResult.rawWeightedScore,
    contextAdjustment: scoreResult.contextAdjustment,
    competitivenessTier: scoreResult.competitivenessTier,
    gapYearPrediction: scoreResult.gapYearPrediction,
    confidenceLevel: scoreResult.confidenceLevel,
    explanation: scoreResult.explanation,
    strengths: scoreResult.strengths,
    weaknesses: scoreResult.weaknesses,
    disclaimers: scoreResult.disclaimers,
    categoryBreakdown:
      scoreResult.categoryBreakdown as unknown as ScoreComputation["categoryBreakdown"],
    categoryScores:
      scoreResult.categoryScores as unknown as ScoreComputation["categoryScores"],
    dynamicWeights:
      scoreResult.dynamicWeights as unknown as ScoreComputation["dynamicWeights"],
    comparisonMetrics:
      scoreResult.comparisonMetrics as unknown as ScoreComputation["comparisonMetrics"],
    improvementPlan:
      scoreResult.improvementPlan as unknown as ScoreComputation["improvementPlan"],
    narrative: scoreResult.narrative as unknown as ScoreComputation["narrative"],
  };
}

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
