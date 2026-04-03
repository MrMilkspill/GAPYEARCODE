from __future__ import annotations

from datetime import datetime
from typing import Any

from app.models.profile import PremedProfileInput
from app.services.benchmark_data import get_benchmark_config


CATEGORY_LABELS = {
    "academics": "Academics",
    "clinicalExposure": "Clinical exposure",
    "service": "Service",
    "research": "Research",
    "shadowing": "Shadowing",
    "leadership": "Leadership",
    "employmentContext": "Employment context",
    "applicationReadiness": "Application readiness",
}


def clamp(value: float, minimum: float = 0, maximum: float = 100) -> float:
    return min(max(value, minimum), maximum)


def round_score(value: float) -> float:
    return round(value * 10) / 10


def interpolate(
    value: float,
    input_min: float,
    input_max: float,
    output_min: float,
    output_max: float,
) -> float:
    if input_max == input_min:
        return output_max
    ratio = (value - input_min) / (input_max - input_min)
    return output_min + ratio * (output_max - output_min)


def score_from_thresholds(value: float, range_config: dict[str, float]) -> float:
    if value >= range_config["excellent"]:
        return 100
    if value >= range_config["strong"]:
        return interpolate(value, range_config["strong"], range_config["excellent"], 74, 90)
    if value >= range_config["moderate"]:
        return interpolate(value, range_config["moderate"], range_config["strong"], 52, 74)
    if value >= range_config["minimum"]:
        return interpolate(value, range_config["minimum"], range_config["moderate"], 28, 52)
    if range_config["minimum"] == 0:
        return clamp(interpolate(value, 0, 1, 8, 22), 8, 22)
    return clamp(interpolate(value, 0, range_config["minimum"], 8, 28), 8, 28)


def score_within_preferred_band(
    value: float,
    range_config: dict[str, float],
    preferred_maximum: float,
    *,
    over_preferred_start_score: float = 100,
    soft_penalty_span: float | None = None,
    hard_penalty_span: float | None = None,
    soft_penalty_floor: float = 84,
    hard_penalty_floor: float = 68,
) -> float:
    if value <= preferred_maximum:
        return score_from_thresholds(value, range_config)

    soft_penalty_span = soft_penalty_span or max(20, preferred_maximum / 2)
    hard_penalty_span = hard_penalty_span or max(40, preferred_maximum)
    soft_penalty_max = preferred_maximum + soft_penalty_span
    hard_penalty_max = soft_penalty_max + hard_penalty_span

    if value <= soft_penalty_max:
        return interpolate(
            value,
            preferred_maximum,
            soft_penalty_max,
            over_preferred_start_score,
            soft_penalty_floor,
        )
    if value <= hard_penalty_max:
        return interpolate(
            value,
            soft_penalty_max,
            hard_penalty_max,
            soft_penalty_floor,
            hard_penalty_floor,
        )
    return hard_penalty_floor


def score_lower_is_better(value: float, range_config: dict[str, float]) -> float:
    if value <= range_config["excellent"]:
        return 100
    if value <= range_config["strong"]:
        return interpolate(value, range_config["excellent"], range_config["strong"], 100, 90)
    if value <= range_config["moderate"]:
        return interpolate(value, range_config["strong"], range_config["moderate"], 90, 72)
    if value <= range_config["caution"]:
        return interpolate(value, range_config["moderate"], range_config["caution"], 72, 38)
    return 18


def weighted_average(items: list[dict[str, float]]) -> float:
    total_weight = sum(item["weight"] for item in items)
    if not total_weight:
        return 0
    return sum(item["score"] * item["weight"] for item in items) / total_weight


def count_unique(values: list[str]) -> int:
    return len({value.strip().lower() for value in values if value.strip()})


def get_comparison_status(user_value: float, target_value: float) -> str:
    if target_value == 0:
        return "ahead"
    ratio = user_value / target_value
    if ratio >= 1:
        return "ahead"
    if ratio >= 0.75:
        return "on_track"
    return "below"


def create_comparison_metric(
    key: str,
    label: str,
    user_value: float,
    target_value: float,
    unit: str,
) -> dict[str, Any]:
    return {
        "key": key,
        "label": label,
        "userValue": user_value,
        "targetValue": target_value,
        "unit": unit,
        "status": get_comparison_status(user_value, target_value),
    }


def adjust_weights(config: dict[str, Any], profile: PremedProfileInput) -> dict[str, float]:
    weights = dict(config["weights"])

    if profile.researchHeavyPreference:
        weights["research"] += config["adjustments"]["researchHeavyWeightShift"]
        weights["service"] -= 2
        weights["employmentContext"] -= 1
        weights["shadowing"] -= 1
        weights["applicationReadiness"] -= 1

    if profile.serviceHeavyPreference:
        weights["service"] += config["adjustments"]["serviceHeavyWeightShift"]
        weights["research"] -= 3
        weights["employmentContext"] -= 1
        weights["shadowing"] -= 1

    total = sum(weights.values())
    return {key: round_score((value / total) * 100) for key, value in weights.items()}


def adjusted_academics_config(config: dict[str, Any], profile: PremedProfileInput) -> dict[str, Any]:
    academics = config["thresholds"]["academics"]
    if profile.applicationInterest != "DO":
        return academics

    adjustments = config["adjustments"]
    return {
        "cumulativeGpa": {
            **academics["cumulativeGpa"],
            "excellent": academics["cumulativeGpa"]["excellent"] - adjustments["doGpaShift"],
            "strong": academics["cumulativeGpa"]["strong"] - adjustments["doGpaShift"],
            "moderate": academics["cumulativeGpa"]["moderate"] - adjustments["doGpaShift"],
            "minimum": academics["cumulativeGpa"]["minimum"] - adjustments["doGpaShift"],
        },
        "scienceGpa": {
            **academics["scienceGpa"],
            "excellent": academics["scienceGpa"]["excellent"] - adjustments["doScienceGpaShift"],
            "strong": academics["scienceGpa"]["strong"] - adjustments["doScienceGpaShift"],
            "moderate": academics["scienceGpa"]["moderate"] - adjustments["doScienceGpaShift"],
            "minimum": academics["scienceGpa"]["minimum"] - adjustments["doScienceGpaShift"],
        },
        "mcatTotal": {
            **academics["mcatTotal"],
            "excellent": academics["mcatTotal"]["excellent"] - adjustments["doMcatShift"],
            "strong": academics["mcatTotal"]["strong"] - adjustments["doMcatShift"],
            "moderate": academics["mcatTotal"]["moderate"] - adjustments["doMcatShift"],
            "minimum": academics["mcatTotal"]["minimum"] - adjustments["doMcatShift"],
        },
        "mcatSectionFloor": {
            **academics["mcatSectionFloor"],
            "excellent": academics["mcatSectionFloor"]["excellent"] - 1,
            "strong": academics["mcatSectionFloor"]["strong"] - 1,
            "moderate": academics["mcatSectionFloor"]["moderate"] - 1,
            "minimum": academics["mcatSectionFloor"]["minimum"] - 1,
        },
        "withdrawals": academics["withdrawals"],
        "lowGrades": academics["lowGrades"],
    }


def evaluate_academics(profile: PremedProfileInput, config: dict[str, Any]) -> dict[str, Any]:
    academics_config = adjusted_academics_config(config, profile)
    section_scores = [
        value
        for value in [
            profile.mcatChemPhys,
            profile.mcatCars,
            profile.mcatBioBiochem,
            profile.mcatPsychSoc,
        ]
        if value > 0
    ]

    gpa_score = score_from_thresholds(profile.cumulativeGpa, academics_config["cumulativeGpa"])
    science_score = score_from_thresholds(profile.scienceGpa, academics_config["scienceGpa"])
    mcat_score = 25 if profile.mcatTotal == 0 else score_from_thresholds(profile.mcatTotal, academics_config["mcatTotal"])
    section_floor_score = (
        25
        if not section_scores
        else score_from_thresholds(min(section_scores), academics_config["mcatSectionFloor"])
    )
    withdrawal_score = score_lower_is_better(profile.numberOfWithdrawals, academics_config["withdrawals"])
    low_grade_score = score_lower_is_better(profile.numberOfCsOrLower, academics_config["lowGrades"])

    rigor_bonus = (
        config["adjustments"]["highRigorBonus"]
        if profile.schoolRigor == "HIGH"
        else config["adjustments"]["highRigorBonus"] / 2
        if profile.schoolRigor == "MEDIUM"
        else 0
    )
    context_bonus = (
        (config["adjustments"]["upwardTrendBonus"] if profile.upwardGradeTrend else 0)
        + (config["adjustments"]["honorsBonus"] if profile.honorsProgram else 0)
        + rigor_bonus
    )

    score = weighted_average(
        [
            {"score": gpa_score, "weight": 28},
            {"score": science_score, "weight": 24},
            {"score": mcat_score, "weight": 28},
            {"score": section_floor_score, "weight": 8},
            {"score": withdrawal_score, "weight": 6},
            {"score": low_grade_score, "weight": 6},
        ]
    ) + context_bonus

    return {
        "score": clamp(score),
        "benchmarkTarget": 80,
        "highlights": [
            f"Cumulative GPA {profile.cumulativeGpa:.2f} and science GPA {profile.scienceGpa:.2f} set the academic baseline.",
            (
                f"MCAT {profile.mcatTotal} supports typical readiness for many MD programs."
                if profile.mcatTotal > 0 and profile.mcatTotal >= academics_config["mcatTotal"]["strong"]
                else f"MCAT {profile.mcatTotal} still trails typical readiness for many MD programs."
                if profile.mcatTotal > 0
                else "No MCAT score is entered, which lowers immediate application readiness."
            ),
            (
                "An upward grade trend adds useful context."
                if profile.upwardGradeTrend
                else "Without an upward trend, the GPA profile depends more heavily on the final numbers."
            ),
        ],
    }


def evaluate_clinical_exposure(profile: PremedProfileInput, config: dict[str, Any]) -> dict[str, Any]:
    clinical_hours = profile.clinicalVolunteerHours
    types_count = count_unique(profile.clinicalExperienceTypes + profile.customClinicalExperienceTypes)
    total_hours_score = score_from_thresholds(clinical_hours, config["thresholds"]["clinicalExposure"]["totalHours"])
    types_score = score_from_thresholds(types_count, config["thresholds"]["clinicalExposure"]["experienceTypes"])

    return {
        "score": clamp(weighted_average([{"score": total_hours_score, "weight": 85}, {"score": types_score, "weight": 15}])),
        "benchmarkTarget": 72,
        "highlights": [
            f"{clinical_hours} clinical volunteer hours drive the core clinical benchmark in this model.",
            f"{types_count or 0} distinct clinical role type{'' if types_count == 1 else 's'} broadens the narrative.",
            (
                f"{profile.paidClinicalHours} paid clinical hours are still favorable context, but they are scored separately and do not count toward the core clinical-hour benchmark."
                if profile.paidClinicalHours > 0
                else "Paid clinical work is optional context here, but it is not used to inflate the core clinical-hour benchmark."
            ),
        ],
    }


def evaluate_service(profile: PremedProfileInput, config: dict[str, Any]) -> dict[str, Any]:
    categories_count = count_unique(profile.serviceCategories + profile.customServiceCategories)
    total_score = score_from_thresholds(profile.nonClinicalVolunteerHours, config["thresholds"]["service"]["totalHours"])
    categories_score = score_from_thresholds(categories_count, config["thresholds"]["service"]["categories"])
    leadership_bonus = 5 if profile.serviceLeadership else 0

    return {
        "score": clamp(weighted_average([{"score": total_score, "weight": 80}, {"score": categories_score, "weight": 20}]) + leadership_bonus),
        "benchmarkTarget": 78,
        "highlights": [
            f"{profile.nonClinicalVolunteerHours} non-clinical service hours set the baseline here.",
            (
                "Holding leadership in service roles adds depth beyond one-time service."
                if profile.serviceLeadership
                else "Leadership within service work would raise this category further."
            ),
            f"{categories_count or 0} service categor{'y' if categories_count == 1 else 'ies'} shows the breadth of community engagement, but the hour bar is intentionally high because current AAMC matriculants report far more service on average.",
        ],
    }


def evaluate_research(profile: PremedProfileInput, config: dict[str, Any]) -> dict[str, Any]:
    hours_threshold = (
        {**config["thresholds"]["research"]["hours"], "excellent": 600, "strong": 400, "moderate": 220}
        if profile.researchHeavyPreference
        else config["thresholds"]["research"]["hours"]
    )
    outputs = profile.postersPresentationsCount + profile.publicationsCount + profile.abstractsCount
    hours_score = score_from_thresholds(profile.researchHours, hours_threshold)
    projects_score = score_from_thresholds(profile.researchProjectsCount, config["thresholds"]["research"]["projects"])
    outputs_score = score_from_thresholds(outputs, config["thresholds"]["research"]["outputs"])
    publication_bonus = 4 if profile.publicationsCount > 0 else 0

    return {
        "score": clamp(
            weighted_average(
                [
                    {"score": hours_score, "weight": 55},
                    {"score": projects_score, "weight": 20},
                    {"score": outputs_score, "weight": 25},
                ]
            )
            + publication_bonus
        ),
        "benchmarkTarget": 78 if profile.researchHeavyPreference else 65,
        "highlights": [
            f"{profile.researchHours} research hours across {profile.researchProjectsCount} project{'' if profile.researchProjectsCount == 1 else 's'} set the baseline.",
            f"{outputs} scholarly output{'' if outputs == 1 else 's'} from posters, abstracts, and publications adds credibility.",
            (
                "Because the profile targets research-heavy schools, the research bar is higher."
                if profile.researchHeavyPreference
                else "For service-forward school lists, research is important but not the dominant factor."
            ),
        ],
    }


def evaluate_shadowing(profile: PremedProfileInput, config: dict[str, Any]) -> dict[str, Any]:
    shadowing_config = config["thresholds"]["shadowing"]["totalHours"]
    total_score = score_within_preferred_band(
        profile.shadowingTotalHours,
        shadowing_config,
        shadowing_config["excellent"],
        over_preferred_start_score=88,
        soft_penalty_span=20,
        hard_penalty_span=60,
        soft_penalty_floor=72,
        hard_penalty_floor=52,
    )
    physicians_score = score_from_thresholds(profile.physiciansShadowed, config["thresholds"]["shadowing"]["physicians"])
    virtual_share = 0 if profile.shadowingTotalHours == 0 else profile.virtualShadowingHours / profile.shadowingTotalHours

    return {
        "score": clamp(
            weighted_average([{"score": total_score, "weight": 70}, {"score": physicians_score, "weight": 30}])
            - (6 if virtual_share > 0.75 and profile.shadowingTotalHours < 40 else 0)
        ),
        "benchmarkTarget": 66,
        "highlights": [
            f"{profile.shadowingTotalHours} total shadowing hours and {profile.physiciansShadowed} physician{'' if profile.physiciansShadowed == 1 else 's'} shadowed determine most of this score.",
            (
                "This model treats roughly 40 to 80 shadowing hours as the useful target band, so more than 80 hours actively grades down instead of looking better."
                if profile.shadowingTotalHours > shadowing_config["excellent"]
                else "This model treats roughly 40 to 80 shadowing hours as the useful target band, with breadth across more than one physician helping the score."
            ),
            (
                "A heavy virtual-only shadowing mix weakens this section."
                if virtual_share > 0.75 and profile.shadowingTotalHours < 40
                else "The current shadowing mix is acceptable for a general readiness estimate."
            ),
        ],
    }


def count_letter_support_sources(profile: PremedProfileInput) -> int:
    return sum(
        [
            profile.researchMentorLetters > 0,
            profile.clinicalSupervisorLetters > 0,
            profile.serviceWorkSupervisorLetters > 0,
        ]
    )


def total_structured_letters(profile: PremedProfileInput) -> int:
    return (
        profile.scienceProfessorLetters
        + profile.nonScienceProfessorLetters
        + profile.researchMentorLetters
        + profile.clinicalSupervisorLetters
        + profile.serviceWorkSupervisorLetters
    )


def evaluate_recommendation_letters(profile: PremedProfileInput, config: dict[str, Any]) -> dict[str, Any]:
    legacy_score = config["thresholds"]["applicationReadiness"]["letterStrengthScores"][profile.letterStrength]
    letter_config = config["thresholds"]["applicationReadiness"]["recommendationLetters"]
    support_source_count = count_letter_support_sources(profile)
    total_letters = total_structured_letters(profile)
    structured_package_present = profile.committeeLetter or total_letters > 0

    if not structured_package_present:
        return {
            "score": legacy_score,
            "summary": "No structured letter package has been entered, so the app falls back to the legacy letter-strength value.",
        }

    science_score = score_from_thresholds(profile.scienceProfessorLetters, letter_config["scienceFaculty"])
    non_science_score = score_from_thresholds(profile.nonScienceProfessorLetters, letter_config["nonScienceFaculty"])
    support_score = score_from_thresholds(support_source_count, letter_config["supportSources"])
    total_score = score_from_thresholds(total_letters, letter_config["totalLetters"])

    package_score = weighted_average(
        [
            {"score": science_score, "weight": 42},
            {"score": non_science_score, "weight": 13},
            {"score": support_score, "weight": 25},
            {"score": total_score, "weight": 20},
        ]
    )
    if profile.committeeLetter:
        package_score = max(package_score, letter_config["committeeLetterScore"])
    elif profile.scienceProfessorLetters >= 2 and (
        profile.nonScienceProfessorLetters >= 1 or support_source_count >= 2
    ):
        package_score += 4

    return {
        "score": clamp(package_score),
        "summary": (
            "A committee letter or packet is available, which usually satisfies or strengthens many schools' baseline letter structure."
            if profile.committeeLetter
            else f"{profile.scienceProfessorLetters} science-faculty letter{'' if profile.scienceProfessorLetters == 1 else 's'}, {profile.nonScienceProfessorLetters} non-science academic letter{'' if profile.nonScienceProfessorLetters == 1 else 's'}, and {support_source_count} outside support source{'' if support_source_count == 1 else 's'} define the current letter package."
        ),
    }


def parse_planned_application_lead_years(planned_application_cycle: str) -> int:
    import re

    current_year = datetime.now().year
    match = re.search(r"\b(20\d{2})\b", planned_application_cycle)
    if not match:
        return 0
    parsed_year = int(match.group(1))
    return max(parsed_year - current_year, 0)


def buffer_application_readiness_for_timeline(base_score: float, lead_years: int, config: dict[str, Any]) -> float:
    adjustments = config["adjustments"]
    if lead_years >= 2:
        return round_score(
            weighted_average(
                [
                    {"score": adjustments["applicationReadinessFutureBaselineTwoPlus"], "weight": 100 - adjustments["applicationReadinessFutureBlendTwoPlus"] * 100},
                    {"score": base_score, "weight": adjustments["applicationReadinessFutureBlendTwoPlus"] * 100},
                ]
            )
        )
    if lead_years >= 1:
        return round_score(
            weighted_average(
                [
                    {"score": adjustments["applicationReadinessFutureBaselineOne"], "weight": 100 - adjustments["applicationReadinessFutureBlendOne"] * 100},
                    {"score": base_score, "weight": adjustments["applicationReadinessFutureBlendOne"] * 100},
                ]
            )
        )
    return round_score(base_score)


def evaluate_leadership(profile: PremedProfileInput, config: dict[str, Any]) -> dict[str, Any]:
    hours_score = score_from_thresholds(profile.leadershipHours, config["thresholds"]["leadership"]["hours"])
    roles_score = score_from_thresholds(profile.leadershipRolesCount, config["thresholds"]["leadership"]["roles"])
    level_score = config["thresholds"]["leadership"]["levelScores"][profile.highestLeadershipLevel]
    return {
        "score": clamp(weighted_average([{"score": hours_score, "weight": 45}, {"score": roles_score, "weight": 25}, {"score": level_score, "weight": 30}])),
        "benchmarkTarget": 68,
        "highlights": [
            f"{profile.leadershipHours} leadership hours and {profile.leadershipRolesCount} titled role{'' if profile.leadershipRolesCount == 1 else 's'} support this area.",
            f"{profile.highestLeadershipLevel.replace('_', ' ').lower()} is the highest leadership tier reported.",
            "Meaningful responsibility matters more than title count alone in this category.",
        ],
    }


def evaluate_employment_context(profile: PremedProfileInput, config: dict[str, Any]) -> dict[str, Any]:
    total_employment_hours = profile.paidNonClinicalWorkHours + profile.paidClinicalHours
    total_score = score_from_thresholds(total_employment_hours, config["thresholds"]["employmentContext"]["totalHours"])
    clinical_score = score_from_thresholds(profile.paidClinicalHours, config["thresholds"]["employmentContext"]["paidClinicalHours"])
    context_bonus = (
        (config["adjustments"]["workedDuringSchoolBonus"] if profile.workedDuringSemesters else 0)
        + (config["adjustments"]["employmentDuringSchoolBonus"] if profile.employmentWhileInSchool else 0)
    )
    return {
        "score": clamp(weighted_average([{"score": total_score, "weight": 65}, {"score": clinical_score, "weight": 35}]) + context_bonus),
        "benchmarkTarget": 65,
        "highlights": [
            f"{total_employment_hours} total paid work hours provide context about time management and sustained responsibility.",
            (
                "Working during semesters adds positive context."
                if profile.workedDuringSemesters
                else "Sustained work during semesters would provide more context."
            ),
            (
                "Paid clinical work also supports the clinical story."
                if profile.paidClinicalHours > 0
                else "Paid non-clinical work still adds context even when it is not directly clinical."
            ),
        ],
    }


def evaluate_application_readiness(profile: PremedProfileInput, config: dict[str, Any]) -> dict[str, Any]:
    letter_evaluation = evaluate_recommendation_letters(profile, config)
    thresholds = config["thresholds"]["applicationReadiness"]
    personal_statement_score = thresholds["personalStatementScores"][profile.personalStatementReadiness]
    activities_score = thresholds["activitiesScores"][profile.activitiesReadiness]
    school_list_score = thresholds["schoolListScores"][profile.schoolListReadiness]
    school_list_size_score = 90 if profile.plannedSchoolListSize >= 20 else 75 if profile.plannedSchoolListSize >= 12 else 55 if profile.plannedSchoolListSize > 0 else 25
    lead_years = parse_planned_application_lead_years(profile.plannedApplicationCycle)
    base_score = weighted_average(
        [
            {"score": letter_evaluation["score"], "weight": 25},
            {"score": personal_statement_score, "weight": 22},
            {"score": activities_score, "weight": 18},
            {"score": school_list_score, "weight": 20},
            {"score": school_list_size_score, "weight": 15},
        ]
    )
    return {
        "score": clamp(buffer_application_readiness_for_timeline(base_score, lead_years, config)),
        "benchmarkTarget": 72,
        "highlights": [
            f"Application cycle planning is pointed at {profile.plannedApplicationCycle}.",
            letter_evaluation["summary"],
            (
                "Because the planned cycle is still at least two years away, unfinished essays and school-list work are buffered instead of heavily dragging the score down right now."
                if lead_years >= 2
                else "Because the planned cycle is about a year away, unfinished application materials still matter, but they are not graded as harshly as an immediate-cycle profile."
                if lead_years >= 1
                else "Because the planned cycle is close, application materials and letter readiness are graded at full weight."
            ),
            f"{profile.plannedSchoolListSize} planned schools and {profile.schoolListReadiness.replace('_', ' ').lower()} school-list readiness shape logistical readiness.",
            f"{profile.personalStatementReadiness.replace('_', ' ').lower()} personal-statement status and {profile.activitiesReadiness.replace('_', ' ').lower()} activities readiness drive the writing component.",
        ],
    }


def build_comparison_metrics(
    profile: PremedProfileInput,
    config: dict[str, Any],
    category_scores: dict[str, float],
) -> list[dict[str, Any]]:
    academics_config = adjusted_academics_config(config, profile)
    research_target = 400 if profile.researchHeavyPreference else config["thresholds"]["research"]["hours"]["strong"]
    shadowing_excellent = config["thresholds"]["shadowing"]["totalHours"]["excellent"]
    shadowing_strong = config["thresholds"]["shadowing"]["totalHours"]["strong"]
    shadowing_status = (
        "above_range"
        if profile.shadowingTotalHours > shadowing_excellent
        else "on_track"
        if profile.shadowingTotalHours >= shadowing_strong
        else "below"
    )
    letter_score = evaluate_recommendation_letters(profile, config)["score"]

    return [
        create_comparison_metric("cumulativeGpa", "Cumulative GPA", profile.cumulativeGpa, academics_config["cumulativeGpa"]["strong"], "gpa"),
        create_comparison_metric("scienceGpa", "Science GPA", profile.scienceGpa, academics_config["scienceGpa"]["strong"], "gpa"),
        create_comparison_metric("mcatTotal", "MCAT", profile.mcatTotal, academics_config["mcatTotal"]["strong"], "score"),
        create_comparison_metric("clinicalVolunteerHours", "Clinical volunteer hours", profile.clinicalVolunteerHours, config["thresholds"]["clinicalExposure"]["totalHours"]["strong"], "hours"),
        create_comparison_metric("paidClinicalHours", "Paid clinical work", profile.paidClinicalHours, config["thresholds"]["employmentContext"]["paidClinicalHours"]["strong"], "hours"),
        create_comparison_metric("serviceHours", "Service hours", profile.nonClinicalVolunteerHours, config["thresholds"]["service"]["totalHours"]["strong"], "hours"),
        create_comparison_metric("researchHours", "Research hours", profile.researchHours, research_target, "hours"),
        {
            "key": "shadowingHours",
            "label": "Shadowing hours (preferred 40-80)",
            "userValue": profile.shadowingTotalHours,
            "targetValue": 60,
            "unit": "hours",
            "status": shadowing_status,
        },
        create_comparison_metric("leadershipHours", "Leadership hours", profile.leadershipHours, config["thresholds"]["leadership"]["hours"]["strong"], "hours"),
        create_comparison_metric("readiness", "Application readiness", category_scores["applicationReadiness"], 72, "percent"),
        create_comparison_metric("letters", "Letter package readiness", letter_score, 78, "percent"),
    ]


def get_category_summary(highlights: list[str]) -> str:
    return " ".join(highlights[:2])


def build_strengths(category_breakdown: list[dict[str, Any]], comparison_metrics: list[dict[str, Any]]) -> list[str]:
    category_strengths = [f"{item['label']} is a current strength." for item in sorted(category_breakdown, key=lambda item: item["score"], reverse=True)[:3]]
    metric_strengths = [
        f"{metric['label']} is at or above the current benchmark target."
        for metric in comparison_metrics
        if metric["status"] == "ahead"
    ][:2]
    return list(dict.fromkeys(category_strengths + metric_strengths))[:4]


def build_weaknesses(category_breakdown: list[dict[str, Any]]) -> list[str]:
    return [
        f"{item['label']} is one of the main limiting factors right now."
        for item in sorted(category_breakdown, key=lambda item: item["score"])[:3]
    ]


def build_improvement_plan(
    profile: PremedProfileInput,
    comparison_metrics: list[dict[str, Any]],
    category_breakdown: list[dict[str, Any]],
    config: dict[str, Any],
) -> list[dict[str, str]]:
    suggestions: list[dict[str, str]] = []
    lead_years = parse_planned_application_lead_years(profile.plannedApplicationCycle)

    clinical_metric = next((metric for metric in comparison_metrics if metric["key"] == "clinicalVolunteerHours"), None)
    if clinical_metric and clinical_metric["status"] != "ahead":
        gap = max(0, clinical_metric["targetValue"] - clinical_metric["userValue"])
        suggestions.append(
            {
                "area": "Clinical exposure",
                "target": f"Add about {round(gap)} more clinical volunteer hours to reach roughly {clinical_metric['targetValue']} core hours.",
                "rationale": "This stricter model treats clinical volunteering as the core clinical-readiness signal and keeps paid clinical work as contextual support.",
                "timeline": "Over the next 6 to 12 months",
            }
        )

    service_metric = next((metric for metric in comparison_metrics if metric["key"] == "serviceHours"), None)
    if service_metric and service_metric["status"] != "ahead":
        gap = max(0, service_metric["targetValue"] - service_metric["userValue"])
        suggestions.append(
            {
                "area": "Service",
                "target": f"Build another {round(gap)} non-clinical service hours, ideally in a consistent community-facing role.",
                "rationale": "Strong service helps round out the profile and matters especially for community-focused schools.",
                "timeline": "Over the next 6 to 12 months",
            }
        )

    if profile.shadowingTotalHours < config["thresholds"]["shadowing"]["totalHours"]["strong"]:
        suggestions.append(
            {
                "area": "Shadowing",
                "target": "Build shadowing to roughly 40 to 60 total hours across more than one physician, then stop prioritizing additional shadowing once you are in that band.",
                "rationale": "AAMC guidance treats shadowing as helpful but more substitutable than clinical volunteering, so this model uses a bounded target band instead of rewarding unlimited shadowing.",
                "timeline": "Over the next 3 to 6 months",
            }
        )
    elif profile.shadowingTotalHours > config["thresholds"]["shadowing"]["totalHours"]["excellent"] and (
        (clinical_metric and clinical_metric["status"] != "ahead")
        or (service_metric and service_metric["status"] != "ahead")
    ):
        suggestions.append(
            {
                "area": "Time allocation",
                "target": "Stop stacking more shadowing hours and redirect future time toward clinical volunteering, non-clinical service, or academic repair.",
                "rationale": "In this model, shadowing is most useful in roughly the 40 to 80 hour band and has diminishing returns beyond that point.",
                "timeline": "Starting now",
            }
        )

    letters_metric = next((metric for metric in comparison_metrics if metric["key"] == "letters"), None)
    if letters_metric and letters_metric["status"] != "ahead":
        suggestions.append(
            {
                "area": "Letters of recommendation",
                "target": "Build toward a committee packet or at least 2 science-faculty letters plus 1 to 2 additional letters from a non-science professor, research mentor, or clinical/service supervisor.",
                "rationale": "AAMC says requirements vary by school, but this model treats two science letters plus added outside support as the common baseline rather than relying only on a vague self-rating.",
                "timeline": "Start identifying writers now and firm this up over the next 6 to 12 months"
                if lead_years >= 2
                else "Over the next 3 to 9 months",
            }
        )

    research_metric = next((metric for metric in comparison_metrics if metric["key"] == "researchHours"), None)
    if research_metric and research_metric["status"] == "below":
        gap = max(0, research_metric["targetValue"] - research_metric["userValue"])
        suggestions.append(
            {
                "area": "Research",
                "target": f"Add roughly {round(gap)} research hours and aim for at least one tangible output if possible.",
                "rationale": "Research-heavy school preferences raise the expected research bar."
                if profile.researchHeavyPreference
                else "More research is optional for many schools, but it can improve versatility.",
                "timeline": "Over the next 6 to 12 months",
            }
        )

    if profile.mcatTotal > 0 and profile.mcatTotal < 508:
        suggestions.append(
            {
                "area": "MCAT",
                "target": "Aim for an MCAT retake only after a study plan can realistically move the score into the 510+ range for MD-heavy lists.",
                "rationale": "MCAT movement often changes academic competitiveness faster than GPA movement after graduation.",
                "timeline": "After 8 to 12 focused weeks of prep",
            }
        )
    elif profile.mcatTotal == 0:
        suggestions.append(
            {
                "area": "MCAT timing",
                "target": "Complete the MCAT before finalizing the application timeline.",
                "rationale": "The model cannot rate immediate readiness confidently without an MCAT baseline.",
                "timeline": "Before your intended application cycle",
            }
        )

    lowest_category = sorted(category_breakdown, key=lambda item: item["score"])[0]
    if lowest_category["key"] == "applicationReadiness":
        suggestions.append(
            {
                "area": "Application materials",
                "target": "Keep a running activities inventory, identify likely letter writers, and start school-list research early rather than forcing polished essays right now."
                if lead_years >= 2
                else "Finish a strong personal statement draft, complete the activities section, and build a school list before opening the cycle.",
                "rationale": "Because the cycle is still farther out, the goal is steady preparation and relationship-building rather than pretending everything must already be polished."
                if lead_years >= 2
                else "Operational readiness can be the difference between a usable cycle and a rushed one.",
                "timeline": "Over the next 6 to 12 months" if lead_years >= 2 else "Over the next 2 to 4 months",
            }
        )

    if profile.cumulativeGpa < 3.5 or profile.scienceGpa < 3.45:
        suggestions.append(
            {
                "area": "Academic repair",
                "target": "Protect every remaining science grade and consider post-bacc coursework if the GPA trend will remain below many MD medians.",
                "rationale": "Extracurricular strength helps, but weaker academics should not stay unaddressed.",
                "timeline": "Over the next 6 to 18 months",
            }
        )

    return suggestions[:5]


def get_competitiveness_tier(score: float) -> str:
    if score >= 88:
        return "VERY_STRONG"
    if score >= 76:
        return "STRONG"
    if score >= 60:
        return "BORDERLINE"
    return "NEEDS_IMPROVEMENT"


def predict_gap_year_recommendation(
    overall_score: float,
    category_scores: dict[str, float],
    application_interest: str,
    config: dict[str, Any],
) -> str:
    threshold_lift = config["adjustments"]["doOverallLift"] if application_interest == "DO" else 0
    no_gap_threshold = config["adjustments"]["noGapThreshold"] - threshold_lift
    one_gap_threshold = config["adjustments"]["oneGapThreshold"] - threshold_lift
    academics_floor = config["adjustments"]["noGapAcademicFloor"] - threshold_lift
    clinical_floor = config["adjustments"]["noGapClinicalFloor"] - threshold_lift
    service_floor = config["adjustments"]["noGapServiceFloor"] - threshold_lift
    shadowing_floor = config["adjustments"]["noGapShadowingFloor"] - threshold_lift

    qualifies_for_no_gap = (
        overall_score >= no_gap_threshold
        and category_scores["academics"] >= academics_floor
        and category_scores["clinicalExposure"] >= clinical_floor
        and category_scores["service"] >= service_floor
        and category_scores["shadowing"] >= shadowing_floor
        and category_scores["applicationReadiness"] >= 55
    )
    if qualifies_for_no_gap:
        return "NO_GAP"

    needs_extended_runway = (
        overall_score < one_gap_threshold
        or category_scores["academics"] < 45
        or category_scores["clinicalExposure"] < 40
        or category_scores["service"] < 35
    )
    if needs_extended_runway:
        return "TWO_PLUS_GAPS"
    return "ONE_GAP"


def get_confidence_level(
    overall_score: float,
    prediction: str,
    category_scores: dict[str, float],
    config: dict[str, Any],
) -> str:
    no_gap_distance = abs(overall_score - config["adjustments"]["noGapThreshold"])
    one_gap_distance = abs(overall_score - config["adjustments"]["oneGapThreshold"])
    boundary_distance = min(no_gap_distance, one_gap_distance)
    weak_areas = len([score for score in category_scores.values() if score < 45])
    strong_areas = len([score for score in category_scores.values() if score >= 75])

    if boundary_distance >= config["adjustments"]["highConfidenceMargin"] and (
        (prediction == "NO_GAP" and strong_areas >= 4)
        or (prediction != "NO_GAP" and weak_areas >= 2)
    ):
        return "HIGH"

    if boundary_distance <= config["adjustments"]["lowConfidenceMargin"] or (
        prediction == "ONE_GAP" and strong_areas >= 3 and weak_areas >= 2
    ):
        return "LOW"

    return "MODERATE"


def build_explanation(
    prediction: str,
    competitiveness_tier: str,
    category_breakdown: list[dict[str, Any]],
    strengths: list[str],
    weaknesses: list[str],
) -> str:
    top_areas = " and ".join(item["label"].lower() for item in sorted(category_breakdown, key=lambda item: item["score"], reverse=True)[:2])
    bottom_areas = " and ".join(item["label"].lower() for item in sorted(category_breakdown, key=lambda item: item["score"])[:2])
    prediction_label = (
        "likely no gap year needed"
        if prediction == "NO_GAP"
        else "likely one gap year recommended"
        if prediction == "ONE_GAP"
        else "likely two or more gap years recommended"
    )
    tier_label = competitiveness_tier.replace("_", " ").lower()
    return f"{prediction_label} because the profile currently grades out as {tier_label}. The strongest areas are {top_areas}, while {bottom_areas} remain the biggest constraints. {strengths[0]} {weaknesses[0]}"


def apply_overall_calibration(raw_weighted_score: float, category_scores: dict[str, float], config: dict[str, Any]) -> float:
    calibrated_score = raw_weighted_score
    excellent_count = len(
        [
            score
            for score in category_scores.values()
            if score >= config["adjustments"]["excellentCategoryFloor"]
        ]
    )

    if excellent_count < config["adjustments"]["minExcellentCategoriesForStrongCap"]:
        calibrated_score = min(calibrated_score, config["adjustments"]["strongOverallCap"])
    if excellent_count < config["adjustments"]["minExcellentCategoriesForEliteCap"]:
        calibrated_score = min(calibrated_score, config["adjustments"]["eliteOverallCap"])
    if category_scores["academics"] < 45:
        calibrated_score = min(calibrated_score, 62)
    elif category_scores["academics"] < 55:
        calibrated_score = min(calibrated_score, 72)
    return round_score(clamp(calibrated_score))


def calculate_profile_readiness(profile: PremedProfileInput, config: dict[str, Any] | None = None) -> dict[str, Any]:
    config = config or get_benchmark_config()
    weights = adjust_weights(config, profile)
    category_evaluations = {
        "academics": evaluate_academics(profile, config),
        "clinicalExposure": evaluate_clinical_exposure(profile, config),
        "service": evaluate_service(profile, config),
        "research": evaluate_research(profile, config),
        "shadowing": evaluate_shadowing(profile, config),
        "leadership": evaluate_leadership(profile, config),
        "employmentContext": evaluate_employment_context(profile, config),
        "applicationReadiness": evaluate_application_readiness(profile, config),
    }

    category_scores = {
        key: round_score(value["score"])
        for key, value in category_evaluations.items()
    }
    raw_weighted_score = round_score(
        sum(category_scores[key] * (weights[key] / 100) for key in category_scores)
    )
    overall_score = apply_overall_calibration(raw_weighted_score, category_scores, config)
    context_adjustment = round_score(overall_score - raw_weighted_score)

    category_breakdown = [
        {
            "key": key,
            "label": CATEGORY_LABELS[key],
            "score": round_score(category_evaluations[key]["score"]),
            "weight": weights[key],
            "weightedContribution": round_score(category_evaluations[key]["score"] * (weights[key] / 100)),
            "benchmarkTarget": category_evaluations[key]["benchmarkTarget"],
            "highlights": category_evaluations[key]["highlights"],
            "summary": get_category_summary(category_evaluations[key]["highlights"]),
        }
        for key in category_evaluations
    ]

    comparison_metrics = build_comparison_metrics(profile, config, category_scores)
    competitiveness_tier = get_competitiveness_tier(overall_score)
    gap_year_prediction = predict_gap_year_recommendation(overall_score, category_scores, profile.applicationInterest, config)
    confidence_level = get_confidence_level(overall_score, gap_year_prediction, category_scores, config)
    strengths = build_strengths(category_breakdown, comparison_metrics)
    weaknesses = build_weaknesses(category_breakdown)
    improvement_plan = build_improvement_plan(profile, comparison_metrics, category_breakdown, config)
    explanation = build_explanation(gap_year_prediction, competitiveness_tier, category_breakdown, strengths, weaknesses)

    return {
        "overallScore": overall_score,
        "rawWeightedScore": raw_weighted_score,
        "contextAdjustment": context_adjustment,
        "competitivenessTier": competitiveness_tier,
        "gapYearPrediction": gap_year_prediction,
        "confidenceLevel": confidence_level,
        "categoryBreakdown": category_breakdown,
        "categoryScores": category_scores,
        "dynamicWeights": weights,
        "comparisonMetrics": comparison_metrics,
        "strengths": strengths,
        "weaknesses": weaknesses,
        "improvementPlan": improvement_plan,
        "explanation": explanation,
        "disclaimers": [
            "This tool estimates readiness. It does not guarantee admission.",
            "Medical school admissions are holistic and school-dependent.",
            "In this stricter model, paid clinical work is treated as contextual support rather than part of the core clinical volunteer-hour benchmark.",
            "Shadowing is treated as most useful in roughly the 40 to 80 hour range, so more than 80 hours does not automatically improve the score.",
            "Use this score as a planning aid alongside advising, school research, and personal judgment.",
        ],
        "narrative": {
            "strongestAreas": strengths,
            "weakestAreas": weaknesses,
            "biggestBoosts": [item["area"] for item in improvement_plan],
        },
    }
