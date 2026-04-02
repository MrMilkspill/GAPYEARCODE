export type CategoryKey =
  | "academics"
  | "clinicalExposure"
  | "service"
  | "research"
  | "shadowing"
  | "leadership"
  | "employmentContext"
  | "applicationReadiness";

export type CompetitivenessTier =
  | "VERY_STRONG"
  | "STRONG"
  | "BORDERLINE"
  | "NEEDS_IMPROVEMENT";

export type GapYearPrediction = "NO_GAP" | "ONE_GAP" | "TWO_PLUS_GAPS";

export type ConfidenceLevel = "LOW" | "MODERATE" | "HIGH";

export type MetricUnit = "gpa" | "score" | "hours" | "count" | "percent";

export type ComparisonStatus = "ahead" | "on_track" | "below";

export interface BenchmarkRange {
  excellent: number;
  strong: number;
  moderate: number;
  minimum: number;
}

export interface LowerIsBetterRange {
  excellent: number;
  strong: number;
  moderate: number;
  caution: number;
}

export interface BenchmarkConfig {
  version: string;
  lastUpdated: string;
  weights: Record<CategoryKey, number>;
  thresholds: {
    academics: {
      cumulativeGpa: BenchmarkRange;
      scienceGpa: BenchmarkRange;
      mcatTotal: BenchmarkRange;
      mcatSectionFloor: BenchmarkRange;
      withdrawals: LowerIsBetterRange;
      lowGrades: LowerIsBetterRange;
    };
    clinicalExposure: {
      totalHours: BenchmarkRange;
      patientFacingHours: BenchmarkRange;
      experienceTypes: BenchmarkRange;
    };
    service: {
      totalHours: BenchmarkRange;
      underservedHours: BenchmarkRange;
      categories: BenchmarkRange;
    };
    research: {
      hours: BenchmarkRange;
      projects: BenchmarkRange;
      outputs: BenchmarkRange;
    };
    shadowing: {
      totalHours: BenchmarkRange;
      physicians: BenchmarkRange;
      primaryCareHours: BenchmarkRange;
    };
    leadership: {
      hours: BenchmarkRange;
      roles: BenchmarkRange;
      levelScores: Record<string, number>;
    };
    employmentContext: {
      totalHours: BenchmarkRange;
      paidClinicalHours: BenchmarkRange;
    };
    applicationReadiness: {
      letterStrengthScores: Record<string, number>;
      personalStatementScores: Record<string, number>;
      activitiesScores: Record<string, number>;
      schoolListScores: Record<string, number>;
    };
  };
  adjustments: {
    upwardTrendBonus: number;
    highRigorBonus: number;
    honorsBonus: number;
    workedDuringSchoolBonus: number;
    employmentDuringSchoolBonus: number;
    strongServiceLeadershipOffset: number;
    researchHeavyWeightShift: number;
    serviceHeavyWeightShift: number;
    doGpaShift: number;
    doScienceGpaShift: number;
    doMcatShift: number;
    doOverallLift: number;
    noGapThreshold: number;
    oneGapThreshold: number;
    noGapAcademicFloor: number;
    noGapClinicalFloor: number;
    noGapServiceFloor: number;
    noGapShadowingFloor: number;
    strongOverallCap: number;
    eliteOverallCap: number;
    excellentCategoryFloor: number;
    minExcellentCategoriesForStrongCap: number;
    minExcellentCategoriesForEliteCap: number;
    highConfidenceMargin: number;
    lowConfidenceMargin: number;
  };
}

export interface CategoryBreakdown {
  key: CategoryKey;
  label: string;
  score: number;
  weight: number;
  weightedContribution: number;
  benchmarkTarget: number;
  summary: string;
  highlights: string[];
}

export interface ComparisonMetric {
  key: string;
  label: string;
  userValue: number;
  targetValue: number;
  unit: MetricUnit;
  status: ComparisonStatus;
}

export interface ImprovementSuggestion {
  area: string;
  target: string;
  rationale: string;
  timeline: string;
}

export interface ScoreNarrative {
  strongestAreas: string[];
  weakestAreas: string[];
  biggestBoosts: string[];
}

export interface ScoreComputation {
  overallScore: number;
  rawWeightedScore: number;
  contextAdjustment: number;
  competitivenessTier: CompetitivenessTier;
  gapYearPrediction: GapYearPrediction;
  confidenceLevel: ConfidenceLevel;
  categoryBreakdown: CategoryBreakdown[];
  categoryScores: Record<CategoryKey, number>;
  dynamicWeights: Record<CategoryKey, number>;
  comparisonMetrics: ComparisonMetric[];
  strengths: string[];
  weaknesses: string[];
  improvementPlan: ImprovementSuggestion[];
  explanation: string;
  disclaimers: string[];
  narrative: ScoreNarrative;
}
