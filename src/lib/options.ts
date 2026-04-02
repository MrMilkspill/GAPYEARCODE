export const currentYearValues = [
  "FRESHMAN",
  "SOPHOMORE",
  "JUNIOR",
  "SENIOR",
  "GRADUATE",
  "POST_BACC",
] as const;

export const schoolRigorValues = ["LOW", "MEDIUM", "HIGH"] as const;

export const researchTypeValues = [
  "BASIC_SCIENCE",
  "CLINICAL",
  "TRANSLATIONAL",
  "PUBLIC_HEALTH",
  "OTHER",
] as const;

export const highestLeadershipLevelValues = [
  "MEMBER",
  "COMMITTEE",
  "CHAIR",
  "VICE_PRESIDENT",
  "PRESIDENT",
  "FOUNDER",
] as const;

export const applicationInterestValues = ["MD", "DO", "BOTH"] as const;

export const letterStrengthValues = ["WEAK", "AVERAGE", "STRONG"] as const;

export const personalStatementStatusValues = [
  "NOT_STARTED",
  "DRAFTING",
  "STRONG_DRAFT",
  "FINALIZED",
] as const;

export const activitiesStatusValues = [
  "NOT_STARTED",
  "IN_PROGRESS",
  "READY",
] as const;

export const schoolListStatusValues = [
  "NOT_STARTED",
  "DRAFTED",
  "FINALIZED",
] as const;

export const stateOptions = [
  "Alabama",
  "Alaska",
  "Arizona",
  "Arkansas",
  "California",
  "Colorado",
  "Connecticut",
  "Delaware",
  "Florida",
  "Georgia",
  "Hawaii",
  "Idaho",
  "Illinois",
  "Indiana",
  "Iowa",
  "Kansas",
  "Kentucky",
  "Louisiana",
  "Maine",
  "Maryland",
  "Massachusetts",
  "Michigan",
  "Minnesota",
  "Mississippi",
  "Missouri",
  "Montana",
  "Nebraska",
  "Nevada",
  "New Hampshire",
  "New Jersey",
  "New Mexico",
  "New York",
  "North Carolina",
  "North Dakota",
  "Ohio",
  "Oklahoma",
  "Oregon",
  "Pennsylvania",
  "Rhode Island",
  "South Carolina",
  "South Dakota",
  "Tennessee",
  "Texas",
  "Utah",
  "Vermont",
  "Virginia",
  "Washington",
  "West Virginia",
  "Wisconsin",
  "Wyoming",
  "District of Columbia",
] as const;

export const currentYearOptions = [
  { value: "FRESHMAN", label: "Freshman" },
  { value: "SOPHOMORE", label: "Sophomore" },
  { value: "JUNIOR", label: "Junior" },
  { value: "SENIOR", label: "Senior" },
  { value: "GRADUATE", label: "Graduate" },
  { value: "POST_BACC", label: "Post-bacc" },
] as const;

export const schoolRigorOptions = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
] as const;

export const researchTypeOptions = [
  { value: "BASIC_SCIENCE", label: "Basic science" },
  { value: "CLINICAL", label: "Clinical" },
  { value: "TRANSLATIONAL", label: "Translational" },
  { value: "PUBLIC_HEALTH", label: "Public health" },
  { value: "OTHER", label: "Other" },
] as const;

export const highestLeadershipLevelOptions = [
  { value: "MEMBER", label: "Member" },
  { value: "COMMITTEE", label: "Committee" },
  { value: "CHAIR", label: "Chair" },
  { value: "VICE_PRESIDENT", label: "Vice President" },
  { value: "PRESIDENT", label: "President" },
  { value: "FOUNDER", label: "Founder" },
] as const;

export const applicationInterestOptions = [
  { value: "MD", label: "MD" },
  { value: "DO", label: "DO" },
  { value: "BOTH", label: "Both" },
] as const;

export const letterStrengthOptions = [
  { value: "WEAK", label: "Weak" },
  { value: "AVERAGE", label: "Average" },
  { value: "STRONG", label: "Strong" },
] as const;

export const personalStatementStatusOptions = [
  { value: "NOT_STARTED", label: "Not started" },
  { value: "DRAFTING", label: "Drafting" },
  { value: "STRONG_DRAFT", label: "Strong draft" },
  { value: "FINALIZED", label: "Finalized" },
] as const;

export const activitiesStatusOptions = [
  { value: "NOT_STARTED", label: "Not started" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "READY", label: "Ready" },
] as const;

export const schoolListStatusOptions = [
  { value: "NOT_STARTED", label: "Not started" },
  { value: "DRAFTED", label: "Drafted" },
  { value: "FINALIZED", label: "Finalized" },
] as const;

export const clinicalExperienceOptions = [
  "Medical assistant",
  "EMT or paramedic",
  "Scribe",
  "Certified nursing assistant",
  "Hospital volunteer",
  "Clinic volunteer",
  "Hospice care",
  "Patient transport",
  "Phlebotomy",
  "Behavioral health tech",
] as const;

export const serviceCategoryOptions = [
  "Food security",
  "Education or tutoring",
  "Mentoring",
  "Elder care",
  "Homeless outreach",
  "Housing insecurity",
  "Refugee or immigrant support",
  "Public health outreach",
  "Crisis support",
  "Youth mentorship",
  "Domestic violence support",
  "Substance use recovery support",
  "Disability support",
  "LGBTQ+ support",
  "Prison reentry or justice work",
  "Language access or interpretation",
  "Transportation access",
  "Environmental justice",
  "Faith-based service",
  "Campus peer support",
  "Other",
] as const;

export const dashboardNavigation = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/profiles/new", label: "New Profile" },
  { href: "/founder", label: "Founder" },
  { href: "/sources", label: "Sources" },
  { href: "/about", label: "Methodology" },
] as const;

export const enumLabels = {
  currentYear: Object.fromEntries(
    currentYearOptions.map((option) => [option.value, option.label]),
  ) as Record<(typeof currentYearValues)[number], string>,
  schoolRigor: Object.fromEntries(
    schoolRigorOptions.map((option) => [option.value, option.label]),
  ) as Record<(typeof schoolRigorValues)[number], string>,
  researchType: Object.fromEntries(
    researchTypeOptions.map((option) => [option.value, option.label]),
  ) as Record<(typeof researchTypeValues)[number], string>,
  highestLeadershipLevel: Object.fromEntries(
    highestLeadershipLevelOptions.map((option) => [option.value, option.label]),
  ) as Record<(typeof highestLeadershipLevelValues)[number], string>,
  applicationInterest: Object.fromEntries(
    applicationInterestOptions.map((option) => [option.value, option.label]),
  ) as Record<(typeof applicationInterestValues)[number], string>,
  letterStrength: Object.fromEntries(
    letterStrengthOptions.map((option) => [option.value, option.label]),
  ) as Record<(typeof letterStrengthValues)[number], string>,
  personalStatement: Object.fromEntries(
    personalStatementStatusOptions.map((option) => [option.value, option.label]),
  ) as Record<(typeof personalStatementStatusValues)[number], string>,
  activities: Object.fromEntries(
    activitiesStatusOptions.map((option) => [option.value, option.label]),
  ) as Record<(typeof activitiesStatusValues)[number], string>,
  schoolList: Object.fromEntries(
    schoolListStatusOptions.map((option) => [option.value, option.label]),
  ) as Record<(typeof schoolListStatusValues)[number], string>,
};
