import { z } from "zod";

import type { BenchmarkConfig, ScoreComputation } from "@/types/premed";
import type { PremedProfileInput } from "@/lib/validation/premed-profile";

const stringOrStringArraySchema = z.union([
  z.string().min(1),
  z.array(z.string().min(1)).min(1),
]);

export const aiProfileAnalysisSchema = z.object({
  headline: z.string().min(1),
  verdict: z.string().min(1),
  supportingRationale: stringOrStringArraySchema,
  strongestSignals: z.array(z.string().min(1)).min(2).max(5),
  limitingFactors: z.array(z.string().min(1)).min(2).max(5),
  priorityActions: z.array(z.string().min(1)).min(3).max(6),
  cautionNote: stringOrStringArraySchema,
});

export type AiProfileAnalysis = z.infer<typeof aiProfileAnalysisSchema>;

const DEFAULT_MISTRAL_MODEL = "mistral-small-latest";

function getMistralConfig() {
  const apiKey = process.env.MISTRAL_API_KEY;

  if (!apiKey) {
    return null;
  }

  return {
    apiKey,
    model: process.env.MISTRAL_MODEL || DEFAULT_MISTRAL_MODEL,
  };
}

function buildPromptInput(
  profile: PremedProfileInput,
  score: ScoreComputation,
  benchmarks: BenchmarkConfig,
) {
  return {
    applicant: {
      currentYearInSchool: profile.currentYear,
      applicationInterest: profile.applicationInterest,
      plannedApplicationCycle: profile.plannedApplicationCycle,
      researchHeavyPreference: profile.researchHeavyPreference,
      serviceHeavyPreference: profile.serviceHeavyPreference,
      stateSchoolPriority: profile.stateSchoolPriority,
    },
    academics: {
      cumulativeGpa: profile.cumulativeGpa,
      scienceGpa: profile.scienceGpa,
      mcatTotal: profile.mcatTotal,
      mcatSections: {
        chemPhys: profile.mcatChemPhys,
        cars: profile.mcatCars,
        bioBiochem: profile.mcatBioBiochem,
        psychSoc: profile.mcatPsychSoc,
      },
      withdrawals: profile.numberOfWithdrawals,
      lowGrades: profile.numberOfCsOrLower,
      upwardTrend: profile.upwardGradeTrend,
      schoolRigor: profile.schoolRigor,
      honorsProgram: profile.honorsProgram,
    },
    experiences: {
      clinicalVolunteerHours: profile.clinicalVolunteerHours,
      paidClinicalHours: profile.paidClinicalHours,
      shadowingHours: profile.shadowingTotalHours,
      physiciansShadowed: profile.physiciansShadowed,
      virtualShadowingHours: profile.virtualShadowingHours,
      researchHours: profile.researchHours,
      researchProjectsCount: profile.researchProjectsCount,
      researchOutputs:
        profile.postersPresentationsCount +
        profile.publicationsCount +
        profile.abstractsCount,
      nonClinicalVolunteerHours: profile.nonClinicalVolunteerHours,
      serviceLeadership: profile.serviceLeadership,
      leadershipHours: profile.leadershipHours,
      leadershipRolesCount: profile.leadershipRolesCount,
      highestLeadershipLevel: profile.highestLeadershipLevel,
      paidNonClinicalWorkHours: profile.paidNonClinicalWorkHours,
      workedDuringSemesters: profile.workedDuringSemesters,
      employmentWhileInSchool: profile.employmentWhileInSchool,
    },
    readinessModel: {
      overallScore: score.overallScore,
      competitivenessTier: score.competitivenessTier,
      gapYearPrediction: score.gapYearPrediction,
      confidenceLevel: score.confidenceLevel,
      categoryScores: score.categoryScores,
      strengths: score.strengths,
      weaknesses: score.weaknesses,
      improvementPlan: score.improvementPlan,
    },
    benchmarkContext: {
      weights: benchmarks.weights,
      clinicalVolunteerStrongTarget:
        benchmarks.thresholds.clinicalExposure.totalHours.strong,
      serviceStrongTarget: benchmarks.thresholds.service.totalHours.strong,
      shadowingPreferredBand: {
        low: benchmarks.thresholds.shadowing.totalHours.strong,
        high: benchmarks.thresholds.shadowing.totalHours.excellent,
      },
    },
  };
}

export function extractMistralMessageText(content: unknown): string {
  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((chunk) => {
        if (
          chunk &&
          typeof chunk === "object" &&
          "type" in chunk &&
          "text" in chunk &&
          (chunk as { type?: unknown }).type === "text" &&
          typeof (chunk as { text?: unknown }).text === "string"
        ) {
          return (chunk as { text: string }).text;
        }

        return "";
      })
      .join("")
      .trim();
  }

  return "";
}

function normalizeJsonPayload(rawContent: string) {
  return rawContent
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function normalizeNarrativeField(value: string | string[]) {
  return Array.isArray(value) ? value.join(" ") : value;
}

export async function generateMistralProfileAnalysis(
  profile: PremedProfileInput,
  score: ScoreComputation,
  benchmarks: BenchmarkConfig,
) {
  const config = getMistralConfig();

  if (!config) {
    throw new Error("Mistral analysis is not configured. Add MISTRAL_API_KEY.");
  }

  const promptInput = buildPromptInput(profile, score, benchmarks);
  const systemPrompt = [
    "You are a conservative pre-med application analyst.",
    "Use only the supplied applicant data and score breakdown.",
    "Do not guarantee admission and do not invent missing experiences.",
    "Treat the deterministic score as the primary benchmark and explain it rather than overriding it.",
    "Paid clinical work is helpful context but does not count toward the core clinical volunteer-hour benchmark in this app.",
    "Shadowing is most useful in roughly the 40 to 80 hour range; more than 80 hours should be treated as diminishing returns, not a major extra advantage.",
    "Do not call a metric below target if it is already at or above the stated target.",
    "Do not tell the applicant to replace paid clinical work; instead say to add more volunteer clinical hours if needed.",
    "Be more skeptical than flattering. Average profiles should not sound exceptional.",
    "Return only a JSON object with the exact requested keys.",
  ].join(" ");

  const userPrompt = [
    "Analyze this pre-med profile and return JSON with exactly these keys:",
    "headline, verdict, supportingRationale, strongestSignals, limitingFactors, priorityActions, cautionNote.",
    "Each array should contain short plain-English bullet strings.",
    "Base your answer on the provided data only.",
    JSON.stringify(promptInput),
  ].join("\n\n");

  const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.model,
      temperature: 0.2,
      random_seed: 7,
      safe_prompt: true,
      response_format: {
        type: "json_object",
      },
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Mistral request failed with ${response.status}: ${errorText || "Unknown upstream error"}`,
    );
  }

  const json = (await response.json()) as {
    choices?: Array<{
      message?: {
        content?: unknown;
      };
    }>;
  };

  const rawContent = extractMistralMessageText(json.choices?.[0]?.message?.content);

  if (!rawContent) {
    throw new Error("Mistral returned an empty analysis.");
  }

  const parsed = aiProfileAnalysisSchema.parse(
    JSON.parse(normalizeJsonPayload(rawContent)),
  );

  return {
    model: config.model,
    analysis: {
      ...parsed,
      supportingRationale: normalizeNarrativeField(parsed.supportingRationale),
      cautionNote: normalizeNarrativeField(parsed.cautionNote),
    },
  };
}
