import { defaultBenchmarkConfig } from "@/lib/benchmarks/defaults";
import { sampleProfiles } from "@/lib/sample-profiles";
import { buildProfileSubmission } from "@/lib/profiles/service";

describe("profile submission pipeline", () => {
  it("validates input and produces a storable scored payload", async () => {
    const stored: Array<{ userId: string; overallScore: number; recommendation: string }> = [];

    const fakeStore = {
      async createProfile(userId: string, input: (typeof sampleProfiles)[number], result: ReturnType<typeof buildProfileSubmission>) {
        stored.push({
          userId,
          overallScore: result.result.overallScore,
          recommendation: result.result.gapYearPrediction,
        });

        return {
          id: "profile_123",
          userId,
          ...input,
          scoreResult: result.result,
        };
      },
    };

    const prepared = buildProfileSubmission(sampleProfiles[1], defaultBenchmarkConfig);
    const saved = await fakeStore.createProfile("user_1", prepared.profile, prepared);

    expect(saved.scoreResult.overallScore).toBeGreaterThan(0);
    expect(saved.scoreResult.gapYearPrediction).toBe("ONE_GAP");
    expect(stored[0]).toEqual(
      expect.objectContaining({
        userId: "user_1",
        recommendation: "ONE_GAP",
      }),
    );
  });
});
