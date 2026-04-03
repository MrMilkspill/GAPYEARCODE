from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


CurrentYear = Literal["FRESHMAN", "SOPHOMORE", "JUNIOR", "SENIOR", "GRADUATE", "POST_BACC"]
SchoolRigor = Literal["LOW", "MEDIUM", "HIGH"]
ResearchType = Literal["BASIC_SCIENCE", "CLINICAL", "TRANSLATIONAL", "PUBLIC_HEALTH", "OTHER"]
HighestLeadershipLevel = Literal["MEMBER", "COMMITTEE", "CHAIR", "VICE_PRESIDENT", "PRESIDENT", "FOUNDER"]
ApplicationInterest = Literal["MD", "DO", "BOTH"]
LetterStrength = Literal["WEAK", "AVERAGE", "STRONG"]
PersonalStatementStatus = Literal["NOT_STARTED", "DRAFTING", "STRONG_DRAFT", "FINALIZED"]
ActivitiesStatus = Literal["NOT_STARTED", "IN_PROGRESS", "READY"]
SchoolListStatus = Literal["NOT_STARTED", "DRAFTED", "FINALIZED"]


STRING_LIST_FIELDS = (
    "clinicalExperienceTypes",
    "customClinicalExperienceTypes",
    "serviceCategories",
    "customServiceCategories",
    "clubsOrganizations",
    "hobbiesInterests",
    "sports",
    "creativeActivities",
    "longTermCommitments",
)


def clean_string_list(values: Any) -> list[str]:
    if values is None:
        return []
    if isinstance(values, str):
        values = [values]
    if not isinstance(values, list):
        return []
    cleaned: list[str] = []
    seen: set[str] = set()
    for item in values:
        if not isinstance(item, str):
            continue
        value = item.strip()
        if not value:
            continue
        lowered = value.lower()
        if lowered in seen:
            continue
        seen.add(lowered)
        cleaned.append(value)
    return cleaned


def safe_letter_count(value: Any) -> int:
    return value if isinstance(value, int) and value >= 0 else 0


def derive_legacy_letter_strength_from_package(values: dict[str, Any]) -> LetterStrength:
    committee_letter = values.get("committeeLetter") is True
    science_professor_letters = safe_letter_count(values.get("scienceProfessorLetters"))
    non_science_professor_letters = safe_letter_count(values.get("nonScienceProfessorLetters"))
    research_mentor_letters = safe_letter_count(values.get("researchMentorLetters"))
    clinical_supervisor_letters = safe_letter_count(values.get("clinicalSupervisorLetters"))
    service_work_supervisor_letters = safe_letter_count(values.get("serviceWorkSupervisorLetters"))

    total_letters = (
        science_professor_letters
        + non_science_professor_letters
        + research_mentor_letters
        + clinical_supervisor_letters
        + service_work_supervisor_letters
    )
    support_source_count = sum(
        [
            research_mentor_letters > 0,
            clinical_supervisor_letters > 0,
            service_work_supervisor_letters > 0,
        ]
    )

    if committee_letter or (
        science_professor_letters >= 2
        and total_letters >= 4
        and (non_science_professor_letters >= 1 or support_source_count >= 2)
    ):
        return "STRONG"
    if science_professor_letters >= 1 and total_letters >= 2:
        return "AVERAGE"
    return "WEAK"


class PremedProfileInput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    fullName: str
    email: str
    stateOfResidence: str
    collegeName: str
    graduationYear: int = Field(ge=2000, le=2055)
    currentYear: CurrentYear
    major: str
    minor: str = ""
    honorsProgram: bool = False
    cumulativeGpa: float = Field(ge=0, le=4)
    scienceGpa: float = Field(ge=0, le=4)
    mcatTotal: int = Field(ge=0, le=528)
    mcatChemPhys: int = Field(ge=0, le=132)
    mcatCars: int = Field(ge=0, le=132)
    mcatBioBiochem: int = Field(ge=0, le=132)
    mcatPsychSoc: int = Field(ge=0, le=132)
    numberOfWithdrawals: int = Field(ge=0, le=30)
    numberOfCsOrLower: int = Field(ge=0, le=30)
    upwardGradeTrend: bool = False
    schoolRigor: SchoolRigor
    paidClinicalHours: int = Field(ge=0, le=50000)
    clinicalVolunteerHours: int = Field(ge=0, le=50000)
    patientFacingHours: int = Field(ge=0, le=50000, default=0)
    clinicalExperienceTypes: list[str] = Field(default_factory=list)
    customClinicalExperienceTypes: list[str] = Field(default_factory=list)
    clinicalRoleDescription: str = ""
    shadowingTotalHours: int = Field(ge=0, le=50000)
    physiciansShadowed: int = Field(ge=0, le=100)
    primaryCareShadowingHours: int = Field(ge=0, le=50000, default=0)
    specialtyShadowingHours: int = Field(ge=0, le=50000)
    virtualShadowingHours: int = Field(ge=0, le=50000)
    shadowingReflection: str = ""
    researchHours: int = Field(ge=0, le=50000)
    researchProjectsCount: int = Field(ge=0, le=50)
    researchType: ResearchType
    postersPresentationsCount: int = Field(ge=0, le=50)
    publicationsCount: int = Field(ge=0, le=20)
    abstractsCount: int = Field(ge=0, le=30)
    researchContribution: str = ""
    nonClinicalVolunteerHours: int = Field(ge=0, le=50000)
    underservedServiceHours: int = Field(ge=0, le=50000, default=0)
    serviceLeadership: bool = False
    serviceCategories: list[str] = Field(default_factory=list)
    customServiceCategories: list[str] = Field(default_factory=list)
    serviceExperience: str = ""
    leadershipHours: int = Field(ge=0, le=50000)
    leadershipRolesCount: int = Field(ge=0, le=25)
    highestLeadershipLevel: HighestLeadershipLevel
    leadershipDescription: str = ""
    paidNonClinicalWorkHours: int = Field(ge=0, le=50000)
    paidClinicalWorkHours: int = Field(ge=0, le=50000, default=0)
    employmentWhileInSchool: bool = False
    workedDuringSemesters: bool = False
    jobDescription: str = ""
    clubsOrganizations: list[str] = Field(default_factory=list)
    hobbiesInterests: list[str] = Field(default_factory=list)
    sports: list[str] = Field(default_factory=list)
    creativeActivities: list[str] = Field(default_factory=list)
    longTermCommitments: list[str] = Field(default_factory=list)
    distinctivenessFactor: str = ""
    gapYearPlans: str = ""
    plannedApplicationCycle: str
    plannedSchoolListSize: int = Field(ge=0, le=80)
    applicationInterest: ApplicationInterest
    researchHeavyPreference: bool = False
    serviceHeavyPreference: bool = False
    stateSchoolPriority: bool = False
    committeeLetter: bool = False
    scienceProfessorLetters: int = Field(ge=0, le=10)
    nonScienceProfessorLetters: int = Field(ge=0, le=10)
    researchMentorLetters: int = Field(ge=0, le=10)
    clinicalSupervisorLetters: int = Field(ge=0, le=10)
    serviceWorkSupervisorLetters: int = Field(ge=0, le=10)
    letterStrength: LetterStrength = "AVERAGE"
    personalStatementReadiness: PersonalStatementStatus
    activitiesReadiness: ActivitiesStatus
    schoolListReadiness: SchoolListStatus

    @field_validator(*STRING_LIST_FIELDS, mode="before")
    @classmethod
    def normalize_lists(cls, value: Any) -> list[str]:
        return clean_string_list(value)

    @field_validator(
        "fullName",
        "email",
        "stateOfResidence",
        "collegeName",
        "major",
        "minor",
        "clinicalRoleDescription",
        "shadowingReflection",
        "researchContribution",
        "serviceExperience",
        "leadershipDescription",
        "jobDescription",
        "distinctivenessFactor",
        "gapYearPlans",
        "plannedApplicationCycle",
        mode="before",
    )
    @classmethod
    def strip_string_fields(cls, value: Any) -> str:
        if value is None:
            return ""
        if not isinstance(value, str):
            return str(value)
        return value.strip()

    @model_validator(mode="before")
    @classmethod
    def normalize_derived_fields(cls, values: Any) -> Any:
        if not isinstance(values, dict):
            return values

        paid_clinical_hours = values.get("paidClinicalHours")
        clinical_volunteer_hours = values.get("clinicalVolunteerHours")

        values["patientFacingHours"] = (
            paid_clinical_hours if isinstance(paid_clinical_hours, int) else 0
        ) + (
            clinical_volunteer_hours if isinstance(clinical_volunteer_hours, int) else 0
        )
        values["primaryCareShadowingHours"] = (
            values.get("primaryCareShadowingHours")
            if isinstance(values.get("primaryCareShadowingHours"), int)
            else 0
        )
        values["underservedServiceHours"] = (
            values.get("underservedServiceHours")
            if isinstance(values.get("underservedServiceHours"), int)
            else 0
        )
        values["paidClinicalWorkHours"] = (
            paid_clinical_hours if isinstance(paid_clinical_hours, int) else 0
        )

        has_structured_letter_data = (
            values.get("committeeLetter") is True
            or safe_letter_count(values.get("scienceProfessorLetters"))
            + safe_letter_count(values.get("nonScienceProfessorLetters"))
            + safe_letter_count(values.get("researchMentorLetters"))
            + safe_letter_count(values.get("clinicalSupervisorLetters"))
            + safe_letter_count(values.get("serviceWorkSupervisorLetters"))
            > 0
        )

        if has_structured_letter_data or not isinstance(values.get("letterStrength"), str):
            values["letterStrength"] = derive_legacy_letter_strength_from_package(values)

        return values


class StoredPremedProfile(PremedProfileInput):
    id: str
    userId: str
    createdAt: datetime
    updatedAt: datetime
    scoreResult: dict[str, Any] | None = None


class CurrentUser(BaseModel):
    id: str
    email: str | None = None
    raw: dict[str, Any] = Field(default_factory=dict)
