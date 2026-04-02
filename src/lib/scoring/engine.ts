import { defaultBenchmarkConfig } from "@/lib/benchmarks/defaults";
import {
  getCompetitivenessTier,
  getConfidenceLevel,
  predictGapYearRecommendation,
} from "@/lib/prediction/gap-year";
import {
  clamp,
  countUnique,
  createComparisonMetric,
  roundScore,
  scoreFromThresholds,
  scoreLowerIsBetter,
  textDepthScore,
  weightedAverage,
} from "@/lib/scoring/helpers";
import type { PremedProfileInput } from "@/lib/validation/premed-profile";
import type {
  BenchmarkConfig,
  CategoryBreakdown,
  CategoryKey,
  ComparisonMetric,
  ImprovementSuggestion,
  ScoreComputation,
} from "@/types/premed";

const CATEGORY_LABELS: Record<CategoryKey, string> = {
  academics: "Academics",
  clinicalExposure: "Clinical exposure",
  service: "Service",
  research: "Research",
  shadowing: "Shadowing",
  leadership: "Leadership",
  employmentContext: "Employment context",
  applicationReadiness: "Application readiness",
};

type CategoryEvaluation = {
  score: number;
  benchmarkTarget: number;
  highlights: string[];
};

function adjustWeights(
  config: BenchmarkConfig,
  profile: PremedProfileInput,
): Record<CategoryKey, number> {
  const weights = { ...config.weights };

  if (profile.researchHeavyPreference) {
    weights.research += config.adjustments.researchHeavyWeightShift;
    weights.service -= 2;
    weights.employmentContext -= 1;
    weights.shadowing -= 1;
    weights.applicationReadiness -= 1;
  }

  if (profile.serviceHeavyPreference) {
    weights.service += config.adjustments.serviceHeavyWeightShift;
    weights.research -= 3;
    weights.employmentContext -= 1;
    weights.shadowing -= 1;
  }

  const total = Object.values(weights).reduce((sum, value) => sum + value, 0);

  return Object.fromEntries(
    Object.entries(weights).map(([key, value]) => [
      key,
      roundScore((value / total) * 100),
    ]),
  ) as Record<CategoryKey, number>;
}

function adjustedAcademicsConfig(
  config: BenchmarkConfig,
  profile: PremedProfileInput,
) {
  if (profile.applicationInterest !== "DO") {
    return config.thresholds.academics;
  }

  return {
    cumulativeGpa: {
      ...config.thresholds.academics.cumulativeGpa,
      excellent:
        config.thresholds.academics.cumulativeGpa.excellent -
        config.adjustments.doGpaShift,
      strong:
        config.thresholds.academics.cumulativeGpa.strong -
        config.adjustments.doGpaShift,
      moderate:
        config.thresholds.academics.cumulativeGpa.moderate -
        config.adjustments.doGpaShift,
      minimum:
        config.thresholds.academics.cumulativeGpa.minimum -
        config.adjustments.doGpaShift,
    },
    scienceGpa: {
      ...config.thresholds.academics.scienceGpa,
      excellent:
        config.thresholds.academics.scienceGpa.excellent -
        config.adjustments.doScienceGpaShift,
      strong:
        config.thresholds.academics.scienceGpa.strong -
        config.adjustments.doScienceGpaShift,
      moderate:
        config.thresholds.academics.scienceGpa.moderate -
        config.adjustments.doScienceGpaShift,
      minimum:
        config.thresholds.academics.scienceGpa.minimum -
        config.adjustments.doScienceGpaShift,
    },
    mcatTotal: {
      ...config.thresholds.academics.mcatTotal,
      excellent:
        config.thresholds.academics.mcatTotal.excellent -
        config.adjustments.doMcatShift,
      strong:
        config.thresholds.academics.mcatTotal.strong -
        config.adjustments.doMcatShift,
      moderate:
        config.thresholds.academics.mcatTotal.moderate -
        config.adjustments.doMcatShift,
      minimum:
        config.thresholds.academics.mcatTotal.minimum -
        config.adjustments.doMcatShift,
    },
    mcatSectionFloor: {
      ...config.thresholds.academics.mcatSectionFloor,
      excellent: config.thresholds.academics.mcatSectionFloor.excellent - 1,
      strong: config.thresholds.academics.mcatSectionFloor.strong - 1,
      moderate: config.thresholds.academics.mcatSectionFloor.moderate - 1,
      minimum: config.thresholds.academics.mcatSectionFloor.minimum - 1,
    },
    withdrawals: config.thresholds.academics.withdrawals,
    lowGrades: config.thresholds.academics.lowGrades,
  };
}

function evaluateAcademics(
  profile: PremedProfileInput,
  config: BenchmarkConfig,
): CategoryEvaluation {
  const academicsConfig = adjustedAcademicsConfig(config, profile);
  const sectionScores = [
    profile.mcatChemPhys,
    profile.mcatCars,
    profile.mcatBioBiochem,
    profile.mcatPsychSoc,
  ].filter((value) => value > 0);

  const gpaScore = scoreFromThresholds(
    profile.cumulativeGpa,
    academicsConfig.cumulativeGpa,
  );
  const scienceScore = scoreFromThresholds(
    profile.scienceGpa,
    academicsConfig.scienceGpa,
  );
  const mcatScore =
    profile.mcatTotal === 0
      ? 25
      : scoreFromThresholds(profile.mcatTotal, academicsConfig.mcatTotal);
  const sectionFloorScore =
    sectionScores.length === 0
      ? 25
      : scoreFromThresholds(
          Math.min(...sectionScores),
          academicsConfig.mcatSectionFloor,
        );
  const withdrawalScore = scoreLowerIsBetter(
    profile.numberOfWithdrawals,
    academicsConfig.withdrawals,
  );
  const lowGradeScore = scoreLowerIsBetter(
    profile.numberOfCsOrLower,
    academicsConfig.lowGrades,
  );

  const rigorBonus =
    profile.schoolRigor === "HIGH"
      ? config.adjustments.highRigorBonus
      : profile.schoolRigor === "MEDIUM"
        ? config.adjustments.highRigorBonus / 2
        : 0;

  const contextBonus =
    (profile.upwardGradeTrend ? config.adjustments.upwardTrendBonus : 0) +
    (profile.honorsProgram ? config.adjustments.honorsBonus : 0) +
    rigorBonus;

  const score =
    weightedAverage([
      { score: gpaScore, weight: 28 },
      { score: scienceScore, weight: 24 },
      { score: mcatScore, weight: 28 },
      { score: sectionFloorScore, weight: 8 },
      { score: withdrawalScore, weight: 6 },
      { score: lowGradeScore, weight: 6 },
    ]) + contextBonus;

  return {
    score: clamp(score),
    benchmarkTarget: 80,
    highlights: [
      `Cumulative GPA ${profile.cumulativeGpa.toFixed(2)} and science GPA ${profile.scienceGpa.toFixed(2)} set the academic baseline.`,
      profile.mcatTotal > 0
        ? `MCAT ${profile.mcatTotal} ${
            profile.mcatTotal >= academicsConfig.mcatTotal.strong
              ? "supports"
              : "still trails"
          } typical readiness for many MD programs.`
        : "No MCAT score is entered, which lowers immediate application readiness.",
      profile.upwardGradeTrend
        ? "An upward grade trend adds useful context."
        : "Without an upward trend, the GPA profile depends more heavily on the final numbers.",
    ],
  };
}

function evaluateClinicalExposure(
  profile: PremedProfileInput,
  config: BenchmarkConfig,
): CategoryEvaluation {
  const clinicalHours = Math.max(
    profile.patientFacingHours,
    profile.paidClinicalHours + profile.clinicalVolunteerHours,
  );
  const typesCount = countUnique([
    ...profile.clinicalExperienceTypes,
    ...profile.customClinicalExperienceTypes,
  ]);
  const totalHoursScore = scoreFromThresholds(
    clinicalHours,
    config.thresholds.clinicalExposure.totalHours,
  );
  const patientFacingScore = scoreFromThresholds(
    profile.patientFacingHours,
    config.thresholds.clinicalExposure.patientFacingHours,
  );
  const typesScore = scoreFromThresholds(
    typesCount,
    config.thresholds.clinicalExposure.experienceTypes,
  );
  const reflectionScore = textDepthScore(profile.clinicalRoleDescription, 90, 220);
  const mixBonus =
    profile.paidClinicalHours > 0 && profile.clinicalVolunteerHours > 0 ? 4 : 0;

  return {
    score: clamp(
      weightedAverage([
        { score: totalHoursScore, weight: 45 },
        { score: patientFacingScore, weight: 30 },
        { score: typesScore, weight: 15 },
        { score: reflectionScore, weight: 10 },
      ]) + mixBonus,
    ),
    benchmarkTarget: 75,
    highlights: [
      `${clinicalHours} combined clinical hours and ${profile.patientFacingHours} patient-facing hours are the main signal here.`,
      `${typesCount || 0} distinct clinical role type${typesCount === 1 ? "" : "s"} broadens the narrative.`,
      mixBonus
        ? "Having both paid and volunteer clinical exposure strengthens consistency."
        : "A mix of paid and volunteer clinical work would make the clinical story more rounded.",
    ],
  };
}

function evaluateService(
  profile: PremedProfileInput,
  config: BenchmarkConfig,
): CategoryEvaluation {
  const categoriesCount = countUnique([
    ...profile.serviceCategories,
    ...profile.customServiceCategories,
  ]);
  const totalScore = scoreFromThresholds(
    profile.nonClinicalVolunteerHours,
    config.thresholds.service.totalHours,
  );
  const underservedScore = scoreFromThresholds(
    profile.underservedServiceHours,
    config.thresholds.service.underservedHours,
  );
  const categoriesScore = scoreFromThresholds(
    categoriesCount,
    config.thresholds.service.categories,
  );
  const narrativeScore = textDepthScore(profile.serviceExperience, 80, 200);
  const leadershipBonus = profile.serviceLeadership ? 5 : 0;

  return {
    score: clamp(
      weightedAverage([
        { score: totalScore, weight: 45 },
        { score: underservedScore, weight: 30 },
        { score: categoriesScore, weight: 15 },
        { score: narrativeScore, weight: 10 },
      ]) + leadershipBonus,
    ),
    benchmarkTarget: 72,
    highlights: [
      `${profile.nonClinicalVolunteerHours} non-clinical service hours and ${profile.underservedServiceHours} underserved-community hours drive this category.`,
      profile.serviceLeadership
        ? "Holding leadership in service roles adds depth beyond one-time service."
        : "Leadership within service work would raise this category further.",
      `${categoriesCount || 0} service category${categoriesCount === 1 ? "" : "ies"} shows the breadth of community engagement.`,
    ],
  };
}

function evaluateResearch(
  profile: PremedProfileInput,
  config: BenchmarkConfig,
): CategoryEvaluation {
  const hoursThreshold = profile.researchHeavyPreference
    ? {
        ...config.thresholds.research.hours,
        excellent: 600,
        strong: 400,
        moderate: 220,
      }
    : config.thresholds.research.hours;
  const outputs =
    profile.postersPresentationsCount +
    profile.publicationsCount +
    profile.abstractsCount;
  const hoursScore = scoreFromThresholds(profile.researchHours, hoursThreshold);
  const projectsScore = scoreFromThresholds(
    profile.researchProjectsCount,
    config.thresholds.research.projects,
  );
  const outputsScore = scoreFromThresholds(
    outputs,
    config.thresholds.research.outputs,
  );
  const contributionScore = textDepthScore(profile.researchContribution, 80, 220);
  const publicationBonus = profile.publicationsCount > 0 ? 4 : 0;

  return {
    score: clamp(
      weightedAverage([
        { score: hoursScore, weight: 45 },
        { score: projectsScore, weight: 20 },
        { score: outputsScore, weight: 20 },
        { score: contributionScore, weight: 15 },
      ]) + publicationBonus,
    ),
    benchmarkTarget: profile.researchHeavyPreference ? 78 : 65,
    highlights: [
      `${profile.researchHours} research hours across ${profile.researchProjectsCount} project${profile.researchProjectsCount === 1 ? "" : "s"} set the baseline.`,
      `${outputs} scholarly output${outputs === 1 ? "" : "s"} from posters, abstracts, and publications adds credibility.`,
      profile.researchHeavyPreference
        ? "Because the profile targets research-heavy schools, the research bar is higher."
        : "For service-forward school lists, research is important but not the dominant factor.",
    ],
  };
}

function evaluateShadowing(
  profile: PremedProfileInput,
  config: BenchmarkConfig,
): CategoryEvaluation {
  const totalScore = scoreFromThresholds(
    profile.shadowingTotalHours,
    config.thresholds.shadowing.totalHours,
  );
  const physiciansScore = scoreFromThresholds(
    profile.physiciansShadowed,
    config.thresholds.shadowing.physicians,
  );
  const primaryCareScore = scoreFromThresholds(
    profile.primaryCareShadowingHours,
    config.thresholds.shadowing.primaryCareHours,
  );
  const reflectionScore = textDepthScore(profile.shadowingReflection, 70, 180);
  const virtualShare =
    profile.shadowingTotalHours === 0
      ? 0
      : profile.virtualShadowingHours / profile.shadowingTotalHours;

  return {
    score: clamp(
      weightedAverage([
        { score: totalScore, weight: 50 },
        { score: physiciansScore, weight: 20 },
        { score: primaryCareScore, weight: 20 },
        { score: reflectionScore, weight: 10 },
      ]) - (virtualShare > 0.75 && profile.shadowingTotalHours < 40 ? 6 : 0),
    ),
    benchmarkTarget: 70,
    highlights: [
      `${profile.shadowingTotalHours} total shadowing hours and ${profile.physiciansShadowed} physician${profile.physiciansShadowed === 1 ? "" : "s"} shadowed determine most of this score.`,
      `${profile.primaryCareShadowingHours} hours in primary care helps show breadth beyond specialty observation.`,
      virtualShare > 0.75 && profile.shadowingTotalHours < 40
        ? "A heavy virtual-only shadowing mix weakens this section."
        : "The current shadowing mix is acceptable for a general readiness estimate.",
    ],
  };
}

function evaluateLeadership(
  profile: PremedProfileInput,
  config: BenchmarkConfig,
): CategoryEvaluation {
  const hoursScore = scoreFromThresholds(
    profile.leadershipHours,
    config.thresholds.leadership.hours,
  );
  const rolesScore = scoreFromThresholds(
    profile.leadershipRolesCount,
    config.thresholds.leadership.roles,
  );
  const levelScore =
    config.thresholds.leadership.levelScores[profile.highestLeadershipLevel];
  const narrativeScore = textDepthScore(profile.leadershipDescription, 70, 180);

  return {
    score: clamp(
      weightedAverage([
        { score: hoursScore, weight: 40 },
        { score: rolesScore, weight: 20 },
        { score: levelScore, weight: 25 },
        { score: narrativeScore, weight: 15 },
      ]),
    ),
    benchmarkTarget: 68,
    highlights: [
      `${profile.leadershipHours} leadership hours and ${profile.leadershipRolesCount} titled role${profile.leadershipRolesCount === 1 ? "" : "s"} support this area.`,
      `${profile.highestLeadershipLevel.replaceAll("_", " ").toLowerCase()} is the highest leadership tier reported.`,
      "Meaningful responsibility matters more than title count alone in this category.",
    ],
  };
}

function evaluateEmploymentContext(
  profile: PremedProfileInput,
  config: BenchmarkConfig,
): CategoryEvaluation {
  const totalEmploymentHours =
    profile.paidNonClinicalWorkHours + profile.paidClinicalWorkHours;
  const totalScore = scoreFromThresholds(
    totalEmploymentHours,
    config.thresholds.employmentContext.totalHours,
  );
  const clinicalScore = scoreFromThresholds(
    profile.paidClinicalWorkHours,
    config.thresholds.employmentContext.paidClinicalHours,
  );
  const narrativeScore = textDepthScore(profile.jobDescription, 70, 160);
  const contextBonus =
    (profile.workedDuringSemesters
      ? config.adjustments.workedDuringSchoolBonus
      : 0) +
    (profile.employmentWhileInSchool
      ? config.adjustments.employmentDuringSchoolBonus
      : 0);

  return {
    score: clamp(
      weightedAverage([
        { score: totalScore, weight: 55 },
        { score: clinicalScore, weight: 25 },
        { score: narrativeScore, weight: 20 },
      ]) + contextBonus,
    ),
    benchmarkTarget: 65,
    highlights: [
      `${totalEmploymentHours} total paid work hours provide context about time management and sustained responsibility.`,
      profile.workedDuringSemesters
        ? "Working during semesters adds positive context."
        : "Sustained work during semesters would provide more context.",
      profile.paidClinicalWorkHours > 0
        ? "Paid clinical work also supports the clinical story."
        : "Paid non-clinical work still adds context even when it is not directly clinical.",
    ],
  };
}

function evaluateApplicationReadiness(
  profile: PremedProfileInput,
  config: BenchmarkConfig,
): CategoryEvaluation {
  const letterScore =
    config.thresholds.applicationReadiness.letterStrengthScores[
      profile.letterStrength
    ];
  const personalStatementScore =
    config.thresholds.applicationReadiness.personalStatementScores[
      profile.personalStatementReadiness
    ];
  const activitiesScore =
    config.thresholds.applicationReadiness.activitiesScores[
      profile.activitiesReadiness
    ];
  const schoolListScore =
    config.thresholds.applicationReadiness.schoolListScores[
      profile.schoolListReadiness
    ];
  const schoolListSizeScore =
    profile.plannedSchoolListSize >= 20
      ? 90
      : profile.plannedSchoolListSize >= 12
        ? 75
        : profile.plannedSchoolListSize > 0
          ? 55
          : 25;

  return {
    score: clamp(
      weightedAverage([
        { score: letterScore, weight: 25 },
        { score: personalStatementScore, weight: 25 },
        { score: activitiesScore, weight: 20 },
        { score: schoolListScore, weight: 20 },
        { score: schoolListSizeScore, weight: 10 },
      ]),
    ),
    benchmarkTarget: 72,
    highlights: [
      `Application cycle planning is pointed at ${profile.plannedApplicationCycle}.`,
      `${profile.plannedSchoolListSize} planned schools and ${profile.schoolListReadiness.replaceAll("_", " ").toLowerCase()} school-list readiness shape logistical readiness.`,
      `${profile.personalStatementReadiness.replaceAll("_", " ").toLowerCase()} personal-statement status and ${profile.activitiesReadiness.replaceAll("_", " ").toLowerCase()} activities readiness drive the writing component.`,
    ],
  };
}

function buildComparisonMetrics(
  profile: PremedProfileInput,
  config: BenchmarkConfig,
  categoryScores: Record<CategoryKey, number>,
): ComparisonMetric[] {
  const academicsConfig = adjustedAcademicsConfig(config, profile);
  const researchTarget = profile.researchHeavyPreference
    ? 400
    : config.thresholds.research.hours.strong;

  return [
    createComparisonMetric(
      "cumulativeGpa",
      "Cumulative GPA",
      profile.cumulativeGpa,
      academicsConfig.cumulativeGpa.strong,
      "gpa",
    ),
    createComparisonMetric(
      "scienceGpa",
      "Science GPA",
      profile.scienceGpa,
      academicsConfig.scienceGpa.strong,
      "gpa",
    ),
    createComparisonMetric(
      "mcatTotal",
      "MCAT",
      profile.mcatTotal,
      academicsConfig.mcatTotal.strong,
      "score",
    ),
    createComparisonMetric(
      "clinicalHours",
      "Clinical hours",
      Math.max(
        profile.patientFacingHours,
        profile.paidClinicalHours + profile.clinicalVolunteerHours,
      ),
      config.thresholds.clinicalExposure.totalHours.strong,
      "hours",
    ),
    createComparisonMetric(
      "serviceHours",
      "Service hours",
      profile.nonClinicalVolunteerHours,
      config.thresholds.service.totalHours.strong,
      "hours",
    ),
    createComparisonMetric(
      "researchHours",
      "Research hours",
      profile.researchHours,
      researchTarget,
      "hours",
    ),
    createComparisonMetric(
      "shadowingHours",
      "Shadowing hours",
      profile.shadowingTotalHours,
      config.thresholds.shadowing.totalHours.strong,
      "hours",
    ),
    createComparisonMetric(
      "leadershipHours",
      "Leadership hours",
      profile.leadershipHours,
      config.thresholds.leadership.hours.strong,
      "hours",
    ),
    createComparisonMetric(
      "readiness",
      "Application readiness",
      categoryScores.applicationReadiness,
      72,
      "percent",
    ),
  ];
}

function getCategorySummary(highlights: string[]) {
  return highlights.slice(0, 2).join(" ");
}

function buildStrengths(
  categoryBreakdown: CategoryBreakdown[],
  comparisonMetrics: ComparisonMetric[],
) {
  const categoryStrengths = [...categoryBreakdown]
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((item) => `${item.label} is a current strength.`);

  const metricStrengths = comparisonMetrics
    .filter((metric) => metric.status === "ahead")
    .slice(0, 2)
    .map((metric) => `${metric.label} is at or above the current benchmark target.`);

  return Array.from(new Set([...categoryStrengths, ...metricStrengths])).slice(
    0,
    4,
  );
}

function buildWeaknesses(categoryBreakdown: CategoryBreakdown[]) {
  return [...categoryBreakdown]
    .sort((a, b) => a.score - b.score)
    .slice(0, 3)
    .map((item) => `${item.label} is one of the main limiting factors right now.`);
}

function buildImprovementPlan(
  profile: PremedProfileInput,
  comparisonMetrics: ComparisonMetric[],
  categoryBreakdown: CategoryBreakdown[],
): ImprovementSuggestion[] {
  const suggestions: ImprovementSuggestion[] = [];

  const clinicalMetric = comparisonMetrics.find(
    (metric) => metric.key === "clinicalHours",
  );
  if (clinicalMetric && clinicalMetric.status !== "ahead") {
    const gap = Math.max(0, clinicalMetric.targetValue - clinicalMetric.userValue);
    suggestions.push({
      area: "Clinical exposure",
      target: `Add about ${Math.round(gap)} more patient-facing or clinically grounded hours to reach roughly ${clinicalMetric.targetValue} total.`,
      rationale:
        "Clinical work is a high-weight category and is hard to replace with other strengths.",
      timeline: "Over the next 6 to 12 months",
    });
  }

  const serviceMetric = comparisonMetrics.find(
    (metric) => metric.key === "serviceHours",
  );
  if (serviceMetric && serviceMetric.status !== "ahead") {
    const gap = Math.max(0, serviceMetric.targetValue - serviceMetric.userValue);
    suggestions.push({
      area: "Service",
      target: `Build another ${Math.round(gap)} non-clinical service hours, ideally in consistent underserved-facing work.`,
      rationale:
        "Strong service helps round out the profile and matters especially for community-focused schools.",
      timeline: "Over the next 6 to 12 months",
    });
  }

  const researchMetric = comparisonMetrics.find(
    (metric) => metric.key === "researchHours",
  );
  if (researchMetric && researchMetric.status === "below") {
    const gap = Math.max(0, researchMetric.targetValue - researchMetric.userValue);
    suggestions.push({
      area: "Research",
      target: `Add roughly ${Math.round(gap)} research hours and aim for at least one tangible output if possible.`,
      rationale: profile.researchHeavyPreference
        ? "Research-heavy school preferences raise the expected research bar."
        : "More research is optional for many schools, but it can improve versatility.",
      timeline: "Over the next 6 to 12 months",
    });
  }

  if (profile.mcatTotal > 0 && profile.mcatTotal < 508) {
    suggestions.push({
      area: "MCAT",
      target:
        "Aim for an MCAT retake only after a study plan can realistically move the score into the 510+ range for MD-heavy lists.",
      rationale:
        "MCAT movement often changes academic competitiveness faster than GPA movement after graduation.",
      timeline: "After 8 to 12 focused weeks of prep",
    });
  } else if (profile.mcatTotal === 0) {
    suggestions.push({
      area: "MCAT timing",
      target: "Complete the MCAT before finalizing the application timeline.",
      rationale:
        "The model cannot rate immediate readiness confidently without an MCAT baseline.",
      timeline: "Before your intended application cycle",
    });
  }

  const lowestCategory = [...categoryBreakdown].sort((a, b) => a.score - b.score)[0];
  if (lowestCategory?.key === "applicationReadiness") {
    suggestions.push({
      area: "Application materials",
      target:
        "Finish a strong personal statement draft, complete the activities section, and build a school list before opening the cycle.",
      rationale:
        "Operational readiness can be the difference between a usable cycle and a rushed one.",
      timeline: "Over the next 2 to 4 months",
    });
  }

  if (profile.cumulativeGpa < 3.5 || profile.scienceGpa < 3.45) {
    suggestions.push({
      area: "Academic repair",
      target:
        "Protect every remaining science grade and consider post-bacc coursework if the GPA trend will remain below many MD medians.",
      rationale:
        "Extracurricular strength helps, but weaker academics should not stay unaddressed.",
      timeline: "Over the next 6 to 18 months",
    });
  }

  return suggestions.slice(0, 5);
}

function buildExplanation({
  prediction,
  competitivenessTier,
  categoryBreakdown,
  strengths,
  weaknesses,
}: {
  prediction: ScoreComputation["gapYearPrediction"];
  competitivenessTier: ScoreComputation["competitivenessTier"];
  categoryBreakdown: CategoryBreakdown[];
  strengths: string[];
  weaknesses: string[];
}) {
  const topAreas = [...categoryBreakdown]
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)
    .map((item) => item.label.toLowerCase())
    .join(" and ");

  const bottomAreas = [...categoryBreakdown]
    .sort((a, b) => a.score - b.score)
    .slice(0, 2)
    .map((item) => item.label.toLowerCase())
    .join(" and ");

  const predictionLabel =
    prediction === "NO_GAP"
      ? "likely no gap year needed"
      : prediction === "ONE_GAP"
        ? "likely one gap year recommended"
        : "likely two or more gap years recommended";

  const tierLabel = competitivenessTier.replaceAll("_", " ").toLowerCase();

  return `${predictionLabel} because the profile currently grades out as ${tierLabel}. The strongest areas are ${topAreas}, while ${bottomAreas} remain the biggest constraints. ${strengths[0]} ${weaknesses[0]}`;
}

export function calculateProfileReadiness(
  profile: PremedProfileInput,
  config: BenchmarkConfig = defaultBenchmarkConfig,
): ScoreComputation {
  const weights = adjustWeights(config, profile);
  const categoryEvaluations = {
    academics: evaluateAcademics(profile, config),
    clinicalExposure: evaluateClinicalExposure(profile, config),
    service: evaluateService(profile, config),
    research: evaluateResearch(profile, config),
    shadowing: evaluateShadowing(profile, config),
    leadership: evaluateLeadership(profile, config),
    employmentContext: evaluateEmploymentContext(profile, config),
    applicationReadiness: evaluateApplicationReadiness(profile, config),
  };

  const categoryScores = Object.fromEntries(
    Object.entries(categoryEvaluations).map(([key, value]) => [
      key,
      roundScore(value.score),
    ]),
  ) as Record<CategoryKey, number>;

  const rawWeightedScore = roundScore(
    Object.entries(categoryScores).reduce((sum, [key, value]) => {
      const categoryKey = key as CategoryKey;
      return sum + value * (weights[categoryKey] / 100);
    }, 0),
  );

  const contextAdjustment =
    (profile.upwardGradeTrend ? 1.5 : 0) +
    (profile.workedDuringSemesters ? 1 : 0) +
    (categoryScores.service >= 75 && categoryScores.leadership >= 70
      ? config.adjustments.strongServiceLeadershipOffset
      : 0);

  let overallScore = clamp(rawWeightedScore + contextAdjustment);

  if (categoryScores.academics < 45) {
    overallScore = Math.min(overallScore, 62);
  } else if (categoryScores.academics < 55) {
    overallScore = Math.min(overallScore, 72);
  }

  overallScore = roundScore(overallScore);

  const categoryBreakdown: CategoryBreakdown[] = (
    Object.keys(categoryEvaluations) as CategoryKey[]
  ).map((key) => ({
    key,
    label: CATEGORY_LABELS[key],
    score: roundScore(categoryEvaluations[key].score),
    weight: weights[key],
    weightedContribution: roundScore(
      categoryEvaluations[key].score * (weights[key] / 100),
    ),
    benchmarkTarget: categoryEvaluations[key].benchmarkTarget,
    highlights: categoryEvaluations[key].highlights,
    summary: getCategorySummary(categoryEvaluations[key].highlights),
  }));

  const comparisonMetrics = buildComparisonMetrics(profile, config, categoryScores);
  const competitivenessTier = getCompetitivenessTier(overallScore);
  const gapYearPrediction = predictGapYearRecommendation({
    overallScore,
    categoryScores,
    applicationInterest: profile.applicationInterest,
    config,
  });
  const confidenceLevel = getConfidenceLevel({
    overallScore,
    prediction: gapYearPrediction,
    categoryScores,
    config,
  });

  const strengths = buildStrengths(categoryBreakdown, comparisonMetrics);
  const weaknesses = buildWeaknesses(categoryBreakdown);
  const improvementPlan = buildImprovementPlan(
    profile,
    comparisonMetrics,
    categoryBreakdown,
  );
  const explanation = buildExplanation({
    prediction: gapYearPrediction,
    competitivenessTier,
    categoryBreakdown,
    strengths,
    weaknesses,
  });

  return {
    overallScore,
    rawWeightedScore,
    contextAdjustment: roundScore(contextAdjustment),
    competitivenessTier,
    gapYearPrediction,
    confidenceLevel,
    categoryBreakdown,
    categoryScores,
    dynamicWeights: weights,
    comparisonMetrics,
    strengths,
    weaknesses,
    improvementPlan,
    explanation,
    disclaimers: [
      "This tool estimates readiness. It does not guarantee admission.",
      "Medical school admissions are holistic and school-dependent.",
      "Use this score as a planning aid alongside advising, school research, and personal judgment.",
    ],
    narrative: {
      strongestAreas: strengths,
      weakestAreas: weaknesses,
      biggestBoosts: improvementPlan.map((item) => item.area),
    },
  };
}
