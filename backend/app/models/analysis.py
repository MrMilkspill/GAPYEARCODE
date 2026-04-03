from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


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
    body: str
    comparisonIds: list[str] = Field(default_factory=list)


class AiProfileAnalysis(BaseModel):
    headline: str
    verdict: str
    supportingRationale: str
    deepDiveSections: list[AiAnalysisSection] = Field(min_length=3, max_length=5)
    strongestSignals: list[str] = Field(min_length=2, max_length=5)
    limitingFactors: list[str] = Field(min_length=2, max_length=5)
    priorityActions: list[str] = Field(min_length=3, max_length=6)
    cautionNote: str


class ChatRequest(BaseModel):
    message: str = Field(min_length=1)


class ChatResponse(BaseModel):
    model: str
    response: str
