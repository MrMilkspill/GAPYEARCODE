import { sampleProfiles } from "@/lib/sample-profiles";
import {
  normalizePremedProfileInput,
  premedProfileSchema,
} from "@/lib/validation/premed-profile";

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

  it("fills deprecated fields from the retained inputs for backward compatibility", () => {
    const normalized = normalizePremedProfileInput({
      ...sampleProfiles[0],
      paidClinicalHours: 120,
      clinicalVolunteerHours: 80,
      patientFacingHours: 0,
      paidClinicalWorkHours: 0,
    });

    const result = premedProfileSchema.parse(normalized);

    expect(result.patientFacingHours).toBe(200);
    expect(result.paidClinicalWorkHours).toBe(120);
    expect(result.primaryCareShadowingHours).toBeDefined();
    expect(result.underservedServiceHours).toBeDefined();
  });
});
