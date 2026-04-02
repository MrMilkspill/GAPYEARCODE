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
});
