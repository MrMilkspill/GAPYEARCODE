import {
  buildSourceBackedComparisons,
  collectComparisonSources,
} from "@/lib/ai/source-backed-analysis";
import {
  emptyProfileValues,
  premedProfileSchema,
} from "@/lib/validation/premed-profile";

describe("source-backed AI benchmark comparisons", () => {
  it("builds cited comparisons from official and advising sources", () => {
    const profile = premedProfileSchema.parse({
      ...emptyProfileValues,
      fullName: "Nishkarsh Sharma",
      email: "test@example.com",
      stateOfResidence: "Ohio",
      collegeName: "The Ohio State University",
      major: "Neuroscience",
      plannedApplicationCycle: "2027",
      cumulativeGpa: 3.72,
      scienceGpa: 3.68,
      mcatTotal: 509,
      mcatChemPhys: 127,
      mcatCars: 127,
      mcatBioBiochem: 128,
      mcatPsychSoc: 127,
      clinicalVolunteerHours: 120,
      paidClinicalHours: 450,
      nonClinicalVolunteerHours: 260,
      shadowingTotalHours: 96,
      physiciansShadowed: 3,
      researchHours: 180,
      researchProjectsCount: 2,
      postersPresentationsCount: 1,
      serviceCategories: ["Food insecurity"],
      applicationInterest: "BOTH",
      researchHeavyPreference: true,
    });

    const comparisons = buildSourceBackedComparisons(profile);

    expect(comparisons.map((comparison) => comparison.id)).toEqual(
      expect.arrayContaining([
        "md-academics",
        "do-academics",
        "clinical-context",
        "service-context",
        "shadowing-context",
        "research-context",
      ]),
    );

    const shadowing = comparisons.find(
      (comparison) => comparison.id === "shadowing-context",
    );
    const clinical = comparisons.find(
      (comparison) => comparison.id === "clinical-context",
    );

    expect(shadowing?.interpretation).toContain("diminishing returns");
    expect(clinical?.interpretation).toContain("Paid clinical work");

    const sources = collectComparisonSources(comparisons);

    expect(sources.some((source) => source.id === "aamc-enrollment-2025")).toBe(
      true,
    );
    expect(sources.some((source) => source.id === "aacom-admissions-2024")).toBe(
      true,
    );
  });
});
