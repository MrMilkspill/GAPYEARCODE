import { defaultBenchmarkConfig } from "@/lib/benchmarks/defaults";
import { sampleProfiles } from "@/lib/sample-profiles";
import { calculateProfileReadiness } from "@/lib/scoring/engine";

describe("calculateProfileReadiness", () => {
  it("rates the strongest sample as ready without a gap year", () => {
    const result = calculateProfileReadiness(
      sampleProfiles[0],
      defaultBenchmarkConfig,
    );

    expect(result.overallScore).toBeGreaterThanOrEqual(78);
    expect(result.overallScore).toBeLessThan(88);
    expect(result.gapYearPrediction).toBe("NO_GAP");
    expect(result.competitivenessTier).toBe("STRONG");
  });

  it("reserves 90-plus scores for profiles that are excellent across almost all categories", () => {
    const strongButNotElite = calculateProfileReadiness(
      sampleProfiles[0],
      defaultBenchmarkConfig,
    );
    const eliteProfile = {
      ...sampleProfiles[0],
      paidClinicalHours: 420,
      clinicalVolunteerHours: 360,
      clinicalExperienceTypes: [
        "Medical assistant",
        "Hospital volunteer",
        "EMT or paramedic",
        "Phlebotomy",
      ],
      nonClinicalVolunteerHours: 720,
      serviceCategories: [
        "Food security",
        "Public health outreach",
        "Education or tutoring",
        "Mentoring",
      ],
      researchHours: 650,
      researchProjectsCount: 3,
      postersPresentationsCount: 4,
      publicationsCount: 2,
      abstractsCount: 3,
      shadowingTotalHours: 70,
      physiciansShadowed: 5,
      leadershipHours: 320,
      leadershipRolesCount: 3,
      highestLeadershipLevel: "FOUNDER" as const,
      paidNonClinicalWorkHours: 900,
      letterStrength: "STRONG" as const,
      personalStatementReadiness: "FINALIZED" as const,
      activitiesReadiness: "READY" as const,
      schoolListReadiness: "FINALIZED" as const,
      plannedSchoolListSize: 28,
    };
    const eliteResult = calculateProfileReadiness(
      eliteProfile,
      defaultBenchmarkConfig,
    );

    expect(strongButNotElite.overallScore).toBeLessThan(90);
    expect(eliteResult.overallScore).toBeGreaterThanOrEqual(90);
  });

  it("still flags the weakest sample as needing a meaningful runway", () => {
    const result = calculateProfileReadiness(
      sampleProfiles[2],
      defaultBenchmarkConfig,
    );

    expect(result.overallScore).toBeLessThan(60);
    expect(result.gapYearPrediction).toBe("TWO_PLUS_GAPS");
    expect(result.categoryScores.applicationReadiness).toBeLessThan(60);
    expect(result.categoryScores.service).toBeLessThan(50);
  });

  it("interprets the same weaker profile more leniently for DO than MD", () => {
    const doProfile = sampleProfiles[2];
    const mdProfile = {
      ...sampleProfiles[2],
      applicationInterest: "MD" as const,
    };

    const doResult = calculateProfileReadiness(doProfile, defaultBenchmarkConfig);
    const mdResult = calculateProfileReadiness(mdProfile, defaultBenchmarkConfig);

    expect(doResult.overallScore).toBeGreaterThan(mdResult.overallScore);
    expect(doResult.gapYearPrediction).toBe("TWO_PLUS_GAPS");
    expect(mdResult.gapYearPrediction).toBe("TWO_PLUS_GAPS");
  });

  it("treats 40 to 80 shadowing hours as the preferred range instead of rewarding unlimited shadowing", () => {
    const withinBandProfile = {
      ...sampleProfiles[0],
      shadowingTotalHours: 60,
      physiciansShadowed: 3,
    };
    const overBandProfile = {
      ...withinBandProfile,
      shadowingTotalHours: 140,
    };

    const withinBandResult = calculateProfileReadiness(
      withinBandProfile,
      defaultBenchmarkConfig,
    );
    const overBandResult = calculateProfileReadiness(
      overBandProfile,
      defaultBenchmarkConfig,
    );

    expect(withinBandResult.categoryScores.shadowing).toBeGreaterThan(
      overBandResult.categoryScores.shadowing,
    );
    expect(
      overBandResult.comparisonMetrics.find((metric) => metric.key === "shadowingHours")
        ?.status,
    ).toBe("above_range");
  });

  it("does not heavily punish unfinished materials when the planned cycle is still two years away", () => {
    const farCycleProfile = {
      ...sampleProfiles[1],
      plannedApplicationCycle: "2028",
      personalStatementReadiness: "NOT_STARTED" as const,
      activitiesReadiness: "NOT_STARTED" as const,
      schoolListReadiness: "NOT_STARTED" as const,
      plannedSchoolListSize: 0,
    };
    const nearCycleProfile = {
      ...farCycleProfile,
      plannedApplicationCycle: "2026",
    };

    const farCycleResult = calculateProfileReadiness(
      farCycleProfile,
      defaultBenchmarkConfig,
    );
    const nearCycleResult = calculateProfileReadiness(
      nearCycleProfile,
      defaultBenchmarkConfig,
    );

    expect(farCycleResult.categoryScores.applicationReadiness).toBeGreaterThan(65);
    expect(farCycleResult.categoryScores.applicationReadiness).toBeGreaterThan(
      nearCycleResult.categoryScores.applicationReadiness,
    );
  });

  it("grades recommendation letters from the structured package instead of only the legacy self-rating", () => {
    const weakLettersProfile = {
      ...sampleProfiles[0],
      scienceProfessorLetters: 1,
      nonScienceProfessorLetters: 0,
      researchMentorLetters: 0,
      clinicalSupervisorLetters: 0,
      serviceWorkSupervisorLetters: 0,
      committeeLetter: false,
      letterStrength: "STRONG" as const,
    };
    const strongLettersProfile = {
      ...weakLettersProfile,
      scienceProfessorLetters: 2,
      nonScienceProfessorLetters: 1,
      researchMentorLetters: 1,
      clinicalSupervisorLetters: 1,
      serviceWorkSupervisorLetters: 0,
    };

    const weakLettersResult = calculateProfileReadiness(
      weakLettersProfile,
      defaultBenchmarkConfig,
    );
    const strongLettersResult = calculateProfileReadiness(
      strongLettersProfile,
      defaultBenchmarkConfig,
    );

    expect(strongLettersResult.categoryScores.applicationReadiness).toBeGreaterThan(
      weakLettersResult.categoryScores.applicationReadiness,
    );
    expect(
      strongLettersResult.comparisonMetrics.find((metric) => metric.key === "letters")
        ?.status,
    ).toBe("ahead");
  });

  it("keeps paid clinical work out of the core clinical-hour score", () => {
    const baseProfile = {
      ...sampleProfiles[1],
      paidClinicalHours: 0,
      clinicalVolunteerHours: 160,
    };
    const paidClinicalVariant = {
      ...baseProfile,
      paidClinicalHours: 400,
    };

    const baseResult = calculateProfileReadiness(
      baseProfile,
      defaultBenchmarkConfig,
    );
    const paidVariantResult = calculateProfileReadiness(
      paidClinicalVariant,
      defaultBenchmarkConfig,
    );

    expect(paidVariantResult.categoryScores.clinicalExposure).toBe(
      baseResult.categoryScores.clinicalExposure,
    );
    expect(paidVariantResult.categoryScores.employmentContext).toBeGreaterThan(
      baseResult.categoryScores.employmentContext,
    );
  });

  it("does not change the score when only narrative text fields change", () => {
    const baseProfile = sampleProfiles[1];
    const verboseVariant = {
      ...baseProfile,
      clinicalRoleDescription:
        "Detailed clinical reflection that should not influence the numeric scoring model.",
      shadowingReflection:
        "Long shadowing reflection that should not change the readiness estimate.",
      researchContribution:
        "Expanded research story that should not change the benchmark comparison.",
      serviceExperience:
        "Service narrative with more words but the same hours and categories.",
      leadershipDescription:
        "Leadership story with more words but the same responsibility level.",
      jobDescription:
        "Employment context explanation that should not affect the numeric score directly.",
      distinctivenessFactor:
        "Personal distinctiveness statement that remains intentionally unscored.",
      gapYearPlans:
        "Free-response gap year plans that should not change the prediction.",
    };

    const baseResult = calculateProfileReadiness(
      baseProfile,
      defaultBenchmarkConfig,
    );
    const verboseResult = calculateProfileReadiness(
      verboseVariant,
      defaultBenchmarkConfig,
    );

    expect(verboseResult.overallScore).toBe(baseResult.overallScore);
    expect(verboseResult.categoryScores).toEqual(baseResult.categoryScores);
    expect(verboseResult.gapYearPrediction).toBe(baseResult.gapYearPrediction);
  });

  it("ignores deprecated legacy fields when calculating the score", () => {
    const baseProfile = sampleProfiles[1];
    const legacyVariant = {
      ...baseProfile,
      patientFacingHours: 9999,
      primaryCareShadowingHours: 999,
      underservedServiceHours: 999,
      paidClinicalWorkHours: 9999,
    };

    const baseResult = calculateProfileReadiness(
      baseProfile,
      defaultBenchmarkConfig,
    );
    const legacyResult = calculateProfileReadiness(
      legacyVariant,
      defaultBenchmarkConfig,
    );

    expect(legacyResult.overallScore).toBe(baseResult.overallScore);
    expect(legacyResult.categoryScores).toEqual(baseResult.categoryScores);
    expect(legacyResult.gapYearPrediction).toBe(baseResult.gapYearPrediction);
  });
});
