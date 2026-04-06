from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Any

import httpx
from pydantic import ValidationError

from app.core.config import get_settings
from app.models.analysis import AiProfileAnalysis
from app.models.profile import PremedProfileInput


PROMPTS_DIR = Path(__file__).resolve().parent.parent / "prompts"
MISTRAL_URL = "https://api.mistral.ai/v1/chat/completions"


@lru_cache
def load_system_prompt() -> str:
    return (PROMPTS_DIR / "system_prompt.txt").read_text(encoding="utf-8").strip()


def extract_mistral_message_text(content: Any) -> str:
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        chunks: list[str] = []
        for chunk in content:
            if isinstance(chunk, dict) and chunk.get("type") == "text" and isinstance(chunk.get("text"), str):
                chunks.append(chunk["text"])
        return "".join(chunks).strip()
    return ""


def normalize_json_payload(raw_content: str) -> str:
    return (
        raw_content.strip()
        .removeprefix("```json")
        .removeprefix("```")
        .removesuffix("```")
        .strip()
    )


def normalize_narrative_field(value: str | list[str]) -> str:
    return " ".join(value) if isinstance(value, list) else value


async def call_mistral(messages: list[dict[str, str]], *, response_format: dict[str, str] | None = None) -> dict[str, Any]:
    settings = get_settings()
    if not settings.mistral_api_key:
        raise RuntimeError("Mistral analysis is not configured. Add MISTRAL_API_KEY.")

    payload: dict[str, Any] = {
        "model": settings.mistral_model,
        "temperature": 0.2,
        "random_seed": 7,
        "safe_prompt": True,
        "messages": messages,
    }
    if response_format:
        payload["response_format"] = response_format

    async with httpx.AsyncClient(timeout=45) as client:
        response = await client.post(
            MISTRAL_URL,
            headers={
                "Authorization": f"Bearer {settings.mistral_api_key}",
                "Content-Type": "application/json",
            },
            json=payload,
        )

    if response.status_code >= 400:
        raise RuntimeError(
            f"Mistral request failed with {response.status_code}: {response.text or 'Unknown upstream error'}"
        )

    return response.json()


async def generate_chat_response(message: str) -> dict[str, str]:
    settings = get_settings()
    response = await call_mistral(
        [
            {"role": "system", "content": load_system_prompt()},
            {"role": "user", "content": message},
        ]
    )
    raw_content = extract_mistral_message_text(response.get("choices", [{}])[0].get("message", {}).get("content"))
    if not raw_content:
        raise RuntimeError("Mistral returned an empty response.")
    return {"model": settings.mistral_model, "response": raw_content}


async def generate_profile_analysis(
    profile: PremedProfileInput,
    score: dict[str, Any],
    benchmarks: dict[str, Any],
    comparisons: list[dict[str, Any]],
) -> dict[str, Any]:
    settings = get_settings()
    prompt_input = {
        "applicant": {
            "currentYearInSchool": profile.currentYear,
            "applicationInterest": profile.applicationInterest,
            "plannedApplicationCycle": profile.plannedApplicationCycle,
            "researchHeavyPreference": profile.researchHeavyPreference,
            "serviceHeavyPreference": profile.serviceHeavyPreference,
            "stateSchoolPriority": profile.stateSchoolPriority,
        },
        "academics": {
            "cumulativeGpa": profile.cumulativeGpa,
            "scienceGpa": profile.scienceGpa,
            "mcatTotal": profile.mcatTotal,
            "mcatSections": {
                "chemPhys": profile.mcatChemPhys,
                "cars": profile.mcatCars,
                "bioBiochem": profile.mcatBioBiochem,
                "psychSoc": profile.mcatPsychSoc,
            },
            "withdrawals": profile.numberOfWithdrawals,
            "lowGrades": profile.numberOfCsOrLower,
            "upwardTrend": profile.upwardGradeTrend,
            "schoolRigor": profile.schoolRigor,
            "honorsProgram": profile.honorsProgram,
        },
        "experiences": {
            "clinicalVolunteerHours": profile.clinicalVolunteerHours,
            "paidClinicalHours": profile.paidClinicalHours,
            "shadowingHours": profile.shadowingTotalHours,
            "physiciansShadowed": profile.physiciansShadowed,
            "virtualShadowingHours": profile.virtualShadowingHours,
            "researchHours": profile.researchHours,
            "researchProjectsCount": profile.researchProjectsCount,
            "researchOutputs": profile.postersPresentationsCount + profile.publicationsCount + profile.abstractsCount,
            "nonClinicalVolunteerHours": profile.nonClinicalVolunteerHours,
            "serviceLeadership": profile.serviceLeadership,
            "leadershipHours": profile.leadershipHours,
            "leadershipRolesCount": profile.leadershipRolesCount,
            "highestLeadershipLevel": profile.highestLeadershipLevel,
            "paidNonClinicalWorkHours": profile.paidNonClinicalWorkHours,
            "workedDuringSemesters": profile.workedDuringSemesters,
            "employmentWhileInSchool": profile.employmentWhileInSchool,
        },
        "recommendationLetters": {
            "committeeLetter": profile.committeeLetter,
            "scienceProfessorLetters": profile.scienceProfessorLetters,
            "nonScienceProfessorLetters": profile.nonScienceProfessorLetters,
            "researchMentorLetters": profile.researchMentorLetters,
            "clinicalSupervisorLetters": profile.clinicalSupervisorLetters,
            "serviceWorkSupervisorLetters": profile.serviceWorkSupervisorLetters,
        },
        "readinessModel": score,
        "benchmarkContext": {
            "weights": benchmarks["weights"],
            "clinicalVolunteerStrongTarget": benchmarks["thresholds"]["clinicalExposure"]["totalHours"]["strong"],
            "serviceStrongTarget": benchmarks["thresholds"]["service"]["totalHours"]["strong"],
            "shadowingPreferredBand": {
                "low": benchmarks["thresholds"]["shadowing"]["totalHours"]["strong"],
                "high": benchmarks["thresholds"]["shadowing"]["totalHours"]["excellent"],
            },
        },
        "sourceBackedComparisons": comparisons,
    }

    system_prompt = " ".join(
        [
            load_system_prompt(),
            "Use only the supplied applicant data, score breakdown, and published comparison facts.",
            "Do not override the deterministic score. Explain it.",
            "AMCAS separates clinical experience into volunteer clinical and paid clinical categories.",
            "Use volunteer clinical hours as the primary clinical benchmark when discussing the app's scoring model.",
            "Paid clinical experience is not included in the volunteer-clinical subtotal, but it remains a valid and meaningful form of clinical exposure reviewed by admissions committees.",
            "For non-clinical service, explain that the AAMC ~700-hour figure is a class-wide matriculant mean, not a requirement or expected minimum, and that it is influenced by some high-hour applicants such as gap-year or full-time service roles.",
            "If service hours are below that mean, phrase it as: This falls below AAMC-reported averages, which reflect broad class data rather than expected individual benchmarks.",
            "Do not imply that applicants need to match the AAMC service-hour mean. Emphasize quality, consistency, and impact of service rather than raw totals alone.",
            "These ranges are transparent planning heuristics informed by AAMC data, AMCAS activity categories, and university advising guidance. They are not official national cutoffs.",
            "Shadowing is tracked within a reasonable planning range and has diminishing returns beyond that range. Additional hours provide little added benefit.",
            "Do not suggest that 100+ shadowing hours materially improve competitiveness.",
            "Discuss leadership in terms of responsibility, initiative, and impact rather than rigid hour requirements alone.",
            "Discuss research as mission-dependent. Research importance varies by school type, especially research-heavy versus service-oriented schools.",
            "Describe recommendation-letter structure as a conservative common pattern rather than a universal requirement.",
            "Frame GPA and MCAT relative to published averages and holistic review, avoiding deterministic conclusions.",
            "Use balanced phrasing such as area for improvement, moderate strength, or current strength.",
            "Avoid phrases such as below average, insufficient, or limiting factor.",
            "If you mention benchmark numbers or external facts, they must come directly from the supplied sourceBackedComparisons.",
            "If a comparison is marked as an advising heuristic rather than official data, say that explicitly.",
            "Every deepDiveSection must reference one or more comparisonIds that appear in the supplied sourceBackedComparisons.",
            "Return only a JSON object with the exact requested keys.",
        ]
    )

    user_prompt = "\n\n".join(
        [
            "Analyze this pre-med profile and return JSON with exactly these keys:",
            "headline, verdict, supportingRationale, deepDiveSections, strongestSignals, limitingFactors, priorityActions, cautionNote.",
            "Each array should contain short plain-English bullet strings.",
            "Even though the key name is limitingFactors, phrase those bullets as balanced areas to strengthen rather than alarmist red flags.",
            "Each deepDiveSection must be an object with title, body, and comparisonIds.",
            "Make the analysis more in-depth than a one-paragraph summary.",
            "Use concrete applicant numbers and only the provided benchmark facts.",
            "Base your answer on the provided data only.",
            json.dumps(prompt_input),
        ]
    )

    response = await call_mistral(
        [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        response_format={"type": "json_object"},
    )
    raw_content = extract_mistral_message_text(response.get("choices", [{}])[0].get("message", {}).get("content"))
    if not raw_content:
        raise RuntimeError("Mistral returned an empty analysis.")

    try:
        parsed = AiProfileAnalysis.model_validate(json.loads(normalize_json_payload(raw_content)))
    except (json.JSONDecodeError, ValidationError) as error:
        raise RuntimeError(f"Mistral returned an invalid analysis payload: {error}") from error

    return {
        "model": settings.mistral_model,
        "analysis": {
            **parsed.model_dump(),
            "supportingRationale": normalize_narrative_field(parsed.supportingRationale),
            "deepDiveSections": [
                {
                    "title": section.title,
                    "body": normalize_narrative_field(section.body),
                    "comparisonIds": section.comparisonIds,
                }
                for section in parsed.deepDiveSections
            ],
            "cautionNote": normalize_narrative_field(parsed.cautionNote),
        },
    }
