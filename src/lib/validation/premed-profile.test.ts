import { sampleProfiles } from "@/lib/sample-profiles";
import { premedProfileSchema } from "@/lib/validation/premed-profile";

describe("premedProfileSchema numeric validation", () => {
  it("returns a field-specific error when a required numeric field is empty", () => {
    const result = premedProfileSchema.safeParse({
      ...sampleProfiles[0],
      cumulativeGpa: undefined,
    });

    expect(result.success).toBe(false);

    if (result.success) {
      return;
    }

    expect(result.error.flatten().fieldErrors.cumulativeGpa).toContain(
      "Cumulative GPA is required.",
    );
  });
});
