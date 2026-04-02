import { defaultBenchmarkConfig } from "@/lib/benchmarks/defaults";
import { sampleProfiles } from "@/lib/sample-profiles";
import { calculateProfileReadiness } from "@/lib/scoring/engine";

describe("calculateProfileReadiness", () => {
  it("rates the strongest sample as ready without a gap year", () => {
    const result = calculateProfileReadiness(
      sampleProfiles[0],
      defaultBenchmarkConfig,
    );

    expect(result.overallScore).toBeGreaterThanOrEqual(75);
    expect(result.gapYearPrediction).toBe("NO_GAP");
    expect(result.competitivenessTier).toMatch(/VERY_STRONG|STRONG/);
  });

  it("flags the weakest sample as needing a longer runway", () => {
    const result = calculateProfileReadiness(
      sampleProfiles[2],
      defaultBenchmarkConfig,
    );

    expect(result.overallScore).toBeLessThan(60);
    expect(result.gapYearPrediction).toBe("TWO_PLUS_GAPS");
    expect(result.categoryScores.academics).toBeLessThan(55);
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
});
