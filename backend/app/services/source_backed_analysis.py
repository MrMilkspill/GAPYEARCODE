from __future__ import annotations

from app.models.analysis import AiAnalysisSource, AiSourceBackedComparison
from app.models.profile import PremedProfileInput
from app.services.benchmark_data import get_benchmark_sources


SOURCE_INDEX = {
    source["id"]: source for source in get_benchmark_sources()["benchmarkSources"]
}


def format_hours(value: int) -> str:
    return f"{value:,} hours"


def build_md_academic_interpretation(profile: PremedProfileInput) -> str:
    if profile.mcatTotal == 0:
        if profile.cumulativeGpa >= 3.81:
            return "The GPA is already at or above the recent MD matriculant mean, but there is no MCAT yet, so the academic read is still incomplete."
        return "The GPA is still below the recent MD matriculant mean, and there is no MCAT yet, so MD academic competitiveness is not fully established."

    gpa_gap = profile.cumulativeGpa - 3.81
    mcat_gap = profile.mcatTotal - 512.1

    if gpa_gap >= 0 and mcat_gap >= 0:
        return "Both GPA and MCAT are at or above recent MD matriculant means, so the academic side is a relative strength on paper."
    if gpa_gap >= -0.06 and mcat_gap >= -2:
        return "The academics are in range of recent MD matriculant norms, but they are not clearly above the national MD bar."
    if gpa_gap >= -0.15 or mcat_gap >= -4:
        return "The academics are respectable but still below recent MD matriculant means, which makes the rest of the profile matter more."
    return "The academics are materially below recent MD matriculant means, so stronger experiences alone are less likely to erase that gap."


def build_do_academic_interpretation(profile: PremedProfileInput) -> str:
    if profile.mcatTotal == 0:
        if profile.cumulativeGpa >= 3.6 and profile.scienceGpa >= 3.52:
            return "The GPA profile is around recent DO entering-student averages, but there is no MCAT yet, so the academic read is still incomplete."
        return "The GPA profile is still below recent DO entering-student averages, and there is no MCAT yet, so the academic read remains incomplete."

    overall_gap = profile.cumulativeGpa - 3.6
    science_gap = profile.scienceGpa - 3.52
    mcat_gap = profile.mcatTotal - 502.97

    if overall_gap >= 0 and science_gap >= 0 and mcat_gap >= 0:
        return "The GPA and MCAT profile is at or above recent DO entering-student averages, so academics are supportive for a DO-leaning list."
    if overall_gap >= -0.08 and science_gap >= -0.08 and mcat_gap >= -2:
        return "The academics are close to recent DO entering-student averages, which keeps a DO pathway realistic on paper."
    return "The academics are still below recent DO entering-student averages, so more runway or a narrower school strategy may be needed."


def build_clinical_interpretation(profile: PremedProfileInput) -> str:
    if 100 <= profile.clinicalVolunteerHours <= 200:
        return "Volunteer clinical exposure already sits inside a common advising range. Paid clinical work helps the story, but this app still treats volunteer hours as the core benchmark."
    if profile.clinicalVolunteerHours > 200:
        return "Volunteer clinical exposure is already above a common advising range. Additional paid clinical work is useful context, but it does not need to substitute for volunteer exposure here."
    if profile.paidClinicalHours > 0:
        return "Volunteer clinical exposure is still light relative to common advising ranges, even though paid clinical work adds favorable context."
    return "Volunteer clinical exposure is still light relative to common advising ranges, and there is not much paid clinical context to offset that."


def build_service_interpretation(profile: PremedProfileInput) -> str:
    if profile.nonClinicalVolunteerHours >= 717:
        return "Service volume is already at or above the recent MD matriculant average. That does not guarantee anything, but it is no longer a weakness on raw hours."
    if profile.nonClinicalVolunteerHours >= 450:
        return "Service volume is substantial, even though it still sits below the recent MD matriculant average community-service level."
    if profile.nonClinicalVolunteerHours >= 250:
        return "Service is meaningful, but it is still well below the recent MD matriculant average, so it should not be framed as a standout strength yet."
    if profile.nonClinicalVolunteerHours >= 100:
        return "Service is present but still light compared with recent matriculant averages, especially for service-oriented school lists."
    return "Non-clinical service is thin relative to recent matriculant averages and remains one of the easier ways to improve the profile."


def build_shadowing_interpretation(profile: PremedProfileInput) -> str:
    if profile.shadowingTotalHours > 80:
        return "Shadowing volume is already above the usual advising band, so more hours here are likely yielding diminishing returns instead of solving a bigger weakness."
    if profile.shadowingTotalHours >= 40:
        return "Shadowing is already inside a common advising band, which is usually enough for this category unless breadth is unusually narrow."
    if profile.shadowingTotalHours >= 20:
        return "Shadowing is present but still below the common advising band, though AAMC makes clear that shadowing is not always required if clinical exposure is otherwise strong."
    return "Shadowing is thin, but this is usually a smaller problem than weak clinical volunteering or weak service because AAMC treats shadowing as partly substitutable."


def build_research_interpretation(profile: PremedProfileInput) -> str:
    outputs = profile.postersPresentationsCount + profile.publicationsCount + profile.abstractsCount

    if profile.researchHeavyPreference:
        if profile.researchHours >= 300 and outputs > 0:
            return "For a research-heavy school list, the research side is credible and includes at least one tangible output."
        if profile.researchHours >= 200:
            return "There is real research exposure, but a research-heavy school list would usually benefit from more depth or output."
        return "Research is too thin for a clearly research-heavy strategy, even though AAMC says expectations vary by school mission."

    if profile.researchHours >= 150:
        return "There is enough research exposure to avoid looking blank in this area for many general school lists."
    if profile.researchHours > 0:
        return "There is some research, but it is still shallow enough that mission-fit will matter a lot."
    return "There is no research entered. That is not fatal for every school, but it narrows flexibility because AAMC says most accepted applicants have some research."


def build_letters_interpretation(profile: PremedProfileInput) -> str:
    support_source_count = sum(
        [
            profile.researchMentorLetters > 0,
            profile.clinicalSupervisorLetters > 0,
            profile.serviceWorkSupervisorLetters > 0,
        ]
    )

    if profile.committeeLetter:
        return "A committee letter or packet is already in place, which is usually the cleanest letter structure for many schools."
    if profile.scienceProfessorLetters >= 2 and (
        profile.nonScienceProfessorLetters >= 1 or support_source_count >= 2
    ):
        return "The letter package already matches a common baseline of two science-faculty letters plus added non-science or mentor support."
    if profile.scienceProfessorLetters >= 2:
        return "The science-faculty baseline is mostly there, but the package still needs more breadth from non-science or supervisor/research writers."
    if profile.scienceProfessorLetters >= 1:
        return "The package has started, but it is still short of the common two-science-letter baseline used by many advising offices."
    return "The letter package is still too thin to treat as ready, even though exact requirements vary by school."


def build_source_backed_comparisons(profile: PremedProfileInput) -> list[AiSourceBackedComparison]:
    comparisons: list[AiSourceBackedComparison] = []

    if profile.applicationInterest != "DO":
        comparisons.append(
            AiSourceBackedComparison(
                id="md-academics",
                area="academics",
                label="MD academic anchor",
                evidenceType="official_data",
                applicantValue=(
                    f"Cumulative GPA {profile.cumulativeGpa:.2f} | science GPA {profile.scienceGpa:.2f} | MCAT {profile.mcatTotal}"
                    if profile.mcatTotal > 0
                    else f"Cumulative GPA {profile.cumulativeGpa:.2f} | science GPA {profile.scienceGpa:.2f} | MCAT not taken"
                ),
                benchmarkFact="AAMC reported recent MD matriculant means of GPA 3.81 and MCAT 512.1, and its 2026 selection guide still frames outcomes in GPA bands like 3.80-4.00 and MCAT bands like 510-513 and 514-517.",
                interpretation=build_md_academic_interpretation(profile),
                sourceIds=["aamc-enrollment-2025", "aamc-mcat-selection-2026"],
            )
        )

    if profile.applicationInterest != "MD":
        comparisons.append(
            AiSourceBackedComparison(
                id="do-academics",
                area="academics",
                label="DO academic anchor",
                evidenceType="official_data",
                applicantValue=(
                    f"Cumulative GPA {profile.cumulativeGpa:.2f} | science GPA {profile.scienceGpa:.2f} | MCAT {profile.mcatTotal}"
                    if profile.mcatTotal > 0
                    else f"Cumulative GPA {profile.cumulativeGpa:.2f} | science GPA {profile.scienceGpa:.2f} | MCAT not taken"
                ),
                benchmarkFact="AACOM lists 2024 entering-student averages of overall GPA 3.60, science GPA 3.52, and total MCAT 502.97.",
                interpretation=build_do_academic_interpretation(profile),
                sourceIds=["aacom-admissions-2024"],
            )
        )

    comparisons.extend(
        [
            AiSourceBackedComparison(
                id="clinical-context",
                area="clinical",
                label="Clinical volunteering versus paid clinical context",
                evidenceType="official_guidance",
                applicantValue=f"{format_hours(profile.clinicalVolunteerHours)} volunteer clinical | {format_hours(profile.paidClinicalHours)} paid clinical",
                benchmarkFact="UVA prehealth advising suggests roughly 100 to 200 hours of clinical volunteering or work. AMCAS separately tracks Community Service/Volunteer - Medical/Clinical and Paid Employment - Medical/Clinical experiences, and AAMC's 2023 admissions-officer survey placed both volunteer and paid clinical experiences in the highest-importance experience group.",
                interpretation=build_clinical_interpretation(profile),
                sourceIds=["uva-clinical-experiences", "amcas-work-activities-2027", "aamc-mcat-selection-2026"],
            ),
            AiSourceBackedComparison(
                id="service-context",
                area="service",
                label="Non-clinical service context",
                evidenceType="official_data",
                applicantValue=f"{format_hours(profile.nonClinicalVolunteerHours)} non-clinical service",
                benchmarkFact="AAMC reported an average of 717 community-service hours per recent MD matriculant and separately emphasizes sustained nonmedical volunteer work over scattered short-term activity.",
                interpretation=build_service_interpretation(profile),
                sourceIds=["aamc-enrollment-2025", "aamc-volunteer"],
            ),
            AiSourceBackedComparison(
                id="shadowing-context",
                area="shadowing",
                label="Shadowing guidance",
                evidenceType="advising_heuristic",
                applicantValue=f"{format_hours(profile.shadowingTotalHours)} shadowing across {profile.physiciansShadowed} physician{'' if profile.physiciansShadowed == 1 else 's'}",
                benchmarkFact="Harvard advising suggests about 40 to 50 hours of shadowing over college, while AAMC says 87% of surveyed admissions officers accepted alternate activities instead of clinical shadowing.",
                interpretation=build_shadowing_interpretation(profile),
                sourceIds=["harvard-experience", "aamc-shadowing"],
            ),
            AiSourceBackedComparison(
                id="research-context",
                area="research",
                label="Research context",
                evidenceType="official_guidance",
                applicantValue=f"{format_hours(profile.researchHours)} research | {profile.researchProjectsCount} project{'' if profile.researchProjectsCount == 1 else 's'} | {profile.postersPresentationsCount + profile.publicationsCount + profile.abstractsCount} output{'' if profile.postersPresentationsCount + profile.publicationsCount + profile.abstractsCount == 1 else 's'}",
                benchmarkFact="AAMC says research expectations vary by school mission and that most accepted applicants have some research experience.",
                interpretation=build_research_interpretation(profile),
                sourceIds=["aamc-research"],
            ),
            AiSourceBackedComparison(
                id="letters-context",
                area="letters",
                label="Recommendation letter package",
                evidenceType="official_guidance",
                applicantValue=(
                    "Committee letter or packet available"
                    if profile.committeeLetter
                    else f"{profile.scienceProfessorLetters} science faculty | {profile.nonScienceProfessorLetters} non-science faculty | {profile.researchMentorLetters} research | {profile.clinicalSupervisorLetters} clinical supervisor | {profile.serviceWorkSupervisorLetters} service/work supervisor"
                ),
                benchmarkFact="AAMC says letter requirements vary by school, but its advising guidance highlights two science instructors as especially important. A common advising baseline is two science-faculty letters plus one non-science or other mentor/supervisor letter, with committee letters or packets often treated as the cleanest format.",
                interpretation=build_letters_interpretation(profile),
                sourceIds=["amcas-letters-types", "aamc-choosing-letter-writers", "louisville-letters-brochure"],
            ),
        ]
    )

    return comparisons


def collect_comparison_sources(comparisons: list[AiSourceBackedComparison]) -> list[AiAnalysisSource]:
    source_ids = {source_id for comparison in comparisons for source_id in comparison.sourceIds}
    return [
        AiAnalysisSource(
            id=SOURCE_INDEX[source_id]["id"],
            title=SOURCE_INDEX[source_id]["title"],
            organization=SOURCE_INDEX[source_id]["organization"],
            url=SOURCE_INDEX[source_id]["url"],
            publishedLabel=SOURCE_INDEX[source_id]["publishedLabel"],
            verifiedOn=SOURCE_INDEX[source_id]["verifiedOn"],
            keyStats=SOURCE_INDEX[source_id]["keyStats"],
            note=SOURCE_INDEX[source_id].get("note"),
        )
        for source_id in source_ids
    ]
