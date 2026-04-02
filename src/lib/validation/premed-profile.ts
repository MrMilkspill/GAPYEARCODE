import { z } from "zod";

import {
  activitiesStatusValues,
  applicationInterestValues,
  currentYearValues,
  highestLeadershipLevelValues,
  letterStrengthValues,
  personalStatementStatusValues,
  researchTypeValues,
  schoolListStatusValues,
  schoolRigorValues,
} from "@/lib/options";

const cleanArray = (values: string[]) =>
  Array.from(
    new Set(
      values
        .map((value) => value.trim())
        .filter((value) => value.length > 0),
    ),
  );

const stringArraySchema = z
  .array(z.string().trim().min(1))
  .default([])
  .transform(cleanArray);

const freeTextSchema = z.string().trim().max(2400).default("");

const requiredTextSchema = (label: string) =>
  z.string().trim().min(1, `${label} is required.`).max(240);

const requiredNumber = (label: string) =>
  z.number({
    error: (issue) => {
      if (
        issue.input === undefined ||
        (typeof issue.input === "number" && Number.isNaN(issue.input))
      ) {
        return `${label} is required.`;
      }

      return `${label} must be a valid number.`;
    },
  });

const boundedInt = (minimum: number, maximum: number, label: string) =>
  requiredNumber(label)
    .int(`${label} must be a whole number.`)
    .min(minimum, `${label} must be at least ${minimum}.`)
    .max(maximum, `${label} must be at most ${maximum}.`);

const nonNegativeInt = (label: string, maximum = 50000) =>
  boundedInt(0, maximum, label);

const gpaSchema = (label: string) =>
  requiredNumber(label)
    .min(0, `${label} cannot be negative.`)
    .max(4, `${label} must be 4.0 or below.`);

const mcatTotalSchema = requiredNumber("MCAT total").int().refine(
  (value) => value === 0 || (value >= 472 && value <= 528),
  "MCAT total must be 0 if not taken, or between 472 and 528.",
);

const mcatSectionSchema = requiredNumber("MCAT section score").int().refine(
  (value) => value === 0 || (value >= 118 && value <= 132),
  "MCAT section scores must be 0 if not taken, or between 118 and 132.",
);

export const premedProfileSchema = z.object({
  fullName: requiredTextSchema("Full name"),
  email: z.string().trim().email("Enter a valid email address."),
  stateOfResidence: requiredTextSchema("State of residence"),
  collegeName: requiredTextSchema("College name"),
  graduationYear: boundedInt(2000, 2055, "Graduation year"),
  currentYear: z.enum(currentYearValues),
  major: requiredTextSchema("Major"),
  minor: z.string().trim().max(120).default(""),
  honorsProgram: z.boolean(),
  cumulativeGpa: gpaSchema("Cumulative GPA"),
  scienceGpa: gpaSchema("Science GPA"),
  mcatTotal: mcatTotalSchema,
  mcatChemPhys: mcatSectionSchema,
  mcatCars: mcatSectionSchema,
  mcatBioBiochem: mcatSectionSchema,
  mcatPsychSoc: mcatSectionSchema,
  numberOfWithdrawals: nonNegativeInt("Number of W's", 30),
  numberOfCsOrLower: nonNegativeInt("Number of C's or below", 30),
  upwardGradeTrend: z.boolean(),
  schoolRigor: z.enum(schoolRigorValues),
  paidClinicalHours: nonNegativeInt("Paid clinical hours"),
  clinicalVolunteerHours: nonNegativeInt("Clinical volunteer hours"),
  patientFacingHours: nonNegativeInt("Patient-facing hours"),
  clinicalExperienceTypes: stringArraySchema,
  customClinicalExperienceTypes: stringArraySchema,
  clinicalRoleDescription: freeTextSchema,
  shadowingTotalHours: nonNegativeInt("Shadowing hours"),
  physiciansShadowed: nonNegativeInt("Physicians shadowed", 100),
  primaryCareShadowingHours: nonNegativeInt("Primary care shadowing hours"),
  specialtyShadowingHours: nonNegativeInt("Specialty shadowing hours"),
  virtualShadowingHours: nonNegativeInt("Virtual shadowing hours"),
  shadowingReflection: freeTextSchema,
  researchHours: nonNegativeInt("Research hours"),
  researchProjectsCount: nonNegativeInt("Research projects", 50),
  researchType: z.enum(researchTypeValues),
  postersPresentationsCount: nonNegativeInt("Posters or presentations", 50),
  publicationsCount: nonNegativeInt("Publications", 20),
  abstractsCount: nonNegativeInt("Abstracts", 30),
  researchContribution: freeTextSchema,
  nonClinicalVolunteerHours: nonNegativeInt("Non-clinical volunteer hours"),
  underservedServiceHours: nonNegativeInt("Underserved service hours"),
  serviceLeadership: z.boolean(),
  serviceCategories: stringArraySchema,
  customServiceCategories: stringArraySchema,
  serviceExperience: freeTextSchema,
  leadershipHours: nonNegativeInt("Leadership hours"),
  leadershipRolesCount: nonNegativeInt("Leadership roles", 25),
  highestLeadershipLevel: z.enum(highestLeadershipLevelValues),
  leadershipDescription: freeTextSchema,
  paidNonClinicalWorkHours: nonNegativeInt("Paid non-clinical work hours"),
  paidClinicalWorkHours: nonNegativeInt("Paid clinical work hours"),
  employmentWhileInSchool: z.boolean(),
  workedDuringSemesters: z.boolean(),
  jobDescription: freeTextSchema,
  clubsOrganizations: stringArraySchema,
  hobbiesInterests: stringArraySchema,
  sports: stringArraySchema,
  creativeActivities: stringArraySchema,
  longTermCommitments: stringArraySchema,
  distinctivenessFactor: freeTextSchema,
  gapYearPlans: freeTextSchema,
  plannedApplicationCycle: requiredTextSchema("Planned application cycle"),
  plannedSchoolListSize: nonNegativeInt("Planned school list size", 80),
  applicationInterest: z.enum(applicationInterestValues),
  researchHeavyPreference: z.boolean(),
  serviceHeavyPreference: z.boolean(),
  stateSchoolPriority: z.boolean(),
  letterStrength: z.enum(letterStrengthValues),
  personalStatementReadiness: z.enum(personalStatementStatusValues),
  activitiesReadiness: z.enum(activitiesStatusValues),
  schoolListReadiness: z.enum(schoolListStatusValues),
});

export type PremedProfileInput = z.output<typeof premedProfileSchema>;
export type PremedProfileFormValues = z.input<typeof premedProfileSchema>;

export function normalizePremedProfileInput(
  input: unknown,
): Record<string, unknown> | unknown {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return input;
  }

  const values = { ...(input as Record<string, unknown>) };
  const paidClinicalHours =
    typeof values.paidClinicalHours === "number" ? values.paidClinicalHours : 0;
  const clinicalVolunteerHours =
    typeof values.clinicalVolunteerHours === "number"
      ? values.clinicalVolunteerHours
      : 0;

  // Deprecated fields remain in storage for backward compatibility, but
  // new submissions no longer rely on separate user input for them.
  values.patientFacingHours = paidClinicalHours + clinicalVolunteerHours;
  values.primaryCareShadowingHours =
    typeof values.primaryCareShadowingHours === "number"
      ? values.primaryCareShadowingHours
      : 0;
  values.underservedServiceHours =
    typeof values.underservedServiceHours === "number"
      ? values.underservedServiceHours
      : 0;
  values.paidClinicalWorkHours = paidClinicalHours;

  return values;
}

export const emptyProfileValues: PremedProfileFormValues = {
  fullName: "",
  email: "",
  stateOfResidence: "",
  collegeName: "",
  graduationYear: new Date().getFullYear(),
  currentYear: "JUNIOR",
  major: "",
  minor: "",
  honorsProgram: false,
  cumulativeGpa: 3.6,
  scienceGpa: 3.55,
  mcatTotal: 0,
  mcatChemPhys: 0,
  mcatCars: 0,
  mcatBioBiochem: 0,
  mcatPsychSoc: 0,
  numberOfWithdrawals: 0,
  numberOfCsOrLower: 0,
  upwardGradeTrend: false,
  schoolRigor: "MEDIUM",
  paidClinicalHours: 0,
  clinicalVolunteerHours: 0,
  patientFacingHours: 0,
  clinicalExperienceTypes: [],
  customClinicalExperienceTypes: [],
  clinicalRoleDescription: "",
  shadowingTotalHours: 0,
  physiciansShadowed: 0,
  primaryCareShadowingHours: 0,
  specialtyShadowingHours: 0,
  virtualShadowingHours: 0,
  shadowingReflection: "",
  researchHours: 0,
  researchProjectsCount: 0,
  researchType: "CLINICAL",
  postersPresentationsCount: 0,
  publicationsCount: 0,
  abstractsCount: 0,
  researchContribution: "",
  nonClinicalVolunteerHours: 0,
  underservedServiceHours: 0,
  serviceLeadership: false,
  serviceCategories: [],
  customServiceCategories: [],
  serviceExperience: "",
  leadershipHours: 0,
  leadershipRolesCount: 0,
  highestLeadershipLevel: "MEMBER",
  leadershipDescription: "",
  paidNonClinicalWorkHours: 0,
  paidClinicalWorkHours: 0,
  employmentWhileInSchool: false,
  workedDuringSemesters: false,
  jobDescription: "",
  clubsOrganizations: [],
  hobbiesInterests: [],
  sports: [],
  creativeActivities: [],
  longTermCommitments: [],
  distinctivenessFactor: "",
  gapYearPlans: "",
  plannedApplicationCycle: `${new Date().getFullYear() + 1}`,
  plannedSchoolListSize: 20,
  applicationInterest: "BOTH",
  researchHeavyPreference: false,
  serviceHeavyPreference: true,
  stateSchoolPriority: true,
  letterStrength: "AVERAGE",
  personalStatementReadiness: "NOT_STARTED",
  activitiesReadiness: "NOT_STARTED",
  schoolListReadiness: "NOT_STARTED",
};
