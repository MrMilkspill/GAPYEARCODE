from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field, field_validator


AiEvidenceType = Literal["official_data", "official_guidance", "advising_heuristic"]
AiComparisonArea = Literal["academics", "clinical", "service", "research", "shadowing", "letters"]


class AiSourceBackedComparison(BaseModel):
    id: str
    area: AiComparisonArea
    label: str
    evidenceType: AiEvidenceType
    applicantValue: str
    benchmarkFact: str
    interpretation: str
    sourceIds: list[str]


class AiAnalysisSource(BaseModel):
    id: str
    title: str
    organization: str
    url: str
    publishedLabel: str
    verifiedOn: str
    keyStats: list[str]
    note: str | None = None


class AiAnalysisSection(BaseModel):
    title: str
    body: str | list[str]
    comparisonIds: list[str] = Field(default_factory=list)

    @field_validator("title", "body", mode="before")
    @classmethod
    def normalize_text_fields(cls, value: str | list[str]) -> str | list[str]:
        if isinstance(value, list):
            return [item.strip() for item in value if isinstance(item, str) and item.strip()]
        return value.strip() if isinstance(value, str) else value

    @field_validator("comparisonIds", mode="before")
    @classmethod
    def normalize_comparison_ids(cls, value: str | list[str] | None) -> list[str]:
        if value is None:
            return []
        if isinstance(value, str):
            value = [value]
        if not isinstance(value, list):
            return []
        return [item.strip() for item in value if isinstance(item, str) and item.strip()]


class AiProfileAnalysis(BaseModel):
    headline: str
    verdict: str
    supportingRationale: str | list[str]
    deepDiveSections: list[AiAnalysisSection] = Field(default_factory=list)
    strongestSignals: list[str] = Field(default_factory=list)
    limitingFactors: list[str] = Field(default_factory=list)
    priorityActions: list[str] = Field(default_factory=list)
    cautionNote: str | list[str]

    @field_validator("headline", "verdict", "supportingRationale", "cautionNote", mode="before")
    @classmethod
    def normalize_text_or_list_fields(cls, value: str | list[str] | None) -> str | list[str]:
        if value is None:
            return ""
        if isinstance(value, list):
            cleaned = [item.strip() for item in value if isinstance(item, str) and item.strip()]
            return " ".join(cleaned)
        if isinstance(value, str):
            return value.strip()
        return str(value)

    @field_validator("strongestSignals", "limitingFactors", "priorityActions", mode="before")
    @classmethod
    def normalize_string_lists(cls, value: str | list[str] | None) -> list[str]:
        if value is None:
            return []
        if isinstance(value, str):
            value = [value]
        if not isinstance(value, list):
            return []
        return [item.strip() for item in value if isinstance(item, str) and item.strip()]


class ChatRequest(BaseModel):
    message: str = Field(min_length=1)


class ChatResponse(BaseModel):
    model: str
    response: str
