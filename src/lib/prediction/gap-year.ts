import type {
  BenchmarkConfig,
  CategoryKey,
  ConfidenceLevel,
  CompetitivenessTier,
  GapYearPrediction,
} from "@/types/premed";

type CategoryScores = Record<CategoryKey, number>;

export function getCompetitivenessTier(score: number): CompetitivenessTier {
  if (score >= 85) {
    return "VERY_STRONG";
  }
  if (score >= 72) {
    return "STRONG";
  }
  if (score >= 58) {
    return "BORDERLINE";
  }
  return "NEEDS_IMPROVEMENT";
}

export function predictGapYearRecommendation({
  overallScore,
  categoryScores,
  applicationInterest,
  config,
}: {
  overallScore: number;
  categoryScores: CategoryScores;
  applicationInterest: "MD" | "DO" | "BOTH";
  config: BenchmarkConfig;
}): GapYearPrediction {
  const thresholdLift =
    applicationInterest === "DO" ? config.adjustments.doOverallLift : 0;

  const noGapThreshold = config.adjustments.noGapThreshold - thresholdLift;
  const oneGapThreshold = config.adjustments.oneGapThreshold - thresholdLift;
  const academicsFloor = config.adjustments.noGapAcademicFloor - thresholdLift;
  const clinicalFloor = config.adjustments.noGapClinicalFloor - thresholdLift;
  const serviceFloor = config.adjustments.noGapServiceFloor - thresholdLift;
  const shadowingFloor = config.adjustments.noGapShadowingFloor - thresholdLift;

  const qualifiesForNoGap =
    overallScore >= noGapThreshold &&
    categoryScores.academics >= academicsFloor &&
    categoryScores.clinicalExposure >= clinicalFloor &&
    categoryScores.service >= serviceFloor &&
    categoryScores.shadowing >= shadowingFloor &&
    categoryScores.applicationReadiness >= 55;

  if (qualifiesForNoGap) {
    return "NO_GAP";
  }

  const needsExtendedRunway =
    overallScore < oneGapThreshold ||
    categoryScores.academics < 45 ||
    categoryScores.clinicalExposure < 40 ||
    categoryScores.service < 35;

  if (needsExtendedRunway) {
    return "TWO_PLUS_GAPS";
  }

  return "ONE_GAP";
}

export function getConfidenceLevel({
  overallScore,
  prediction,
  categoryScores,
  config,
}: {
  overallScore: number;
  prediction: GapYearPrediction;
  categoryScores: CategoryScores;
  config: BenchmarkConfig;
}): ConfidenceLevel {
  const noGapDistance = Math.abs(overallScore - config.adjustments.noGapThreshold);
  const oneGapDistance = Math.abs(overallScore - config.adjustments.oneGapThreshold);
  const boundaryDistance = Math.min(noGapDistance, oneGapDistance);

  const weakAreas = Object.values(categoryScores).filter((score) => score < 45).length;
  const strongAreas = Object.values(categoryScores).filter((score) => score >= 75).length;

  if (
    boundaryDistance >= config.adjustments.highConfidenceMargin &&
    (prediction === "NO_GAP" ? strongAreas >= 4 : weakAreas >= 2)
  ) {
    return "HIGH";
  }

  if (
    boundaryDistance <= config.adjustments.lowConfidenceMargin ||
    (prediction === "ONE_GAP" && strongAreas >= 3 && weakAreas >= 2)
  ) {
    return "LOW";
  }

  return "MODERATE";
}
