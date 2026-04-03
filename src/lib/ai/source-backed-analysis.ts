import {
  benchmarkSources,
  type BenchmarkSource,
} from "@/lib/benchmarks/sources";
import type { PremedProfileInput } from "@/lib/validation/premed-profile";

export type AiEvidenceType =
  | "official_data"
  | "official_guidance"
  | "advising_heuristic";

export type AiComparisonArea =
  | "academics"
  | "clinical"
  | "service"
  | "research"
  | "shadowing";

export interface AiSourceBackedComparison {
  id: string;
  area: AiComparisonArea;
  label: string;
  evidenceType: AiEvidenceType;
  applicantValue: string;
  benchmarkFact: string;
  interpretation: string;
  sourceIds: string[];
}

export type AiAnalysisSource = Pick<
  BenchmarkSource,
  | "id"
  | "title"
  | "organization"
  | "url"
  | "publishedLabel"
  | "verifiedOn"
  | "keyStats"
  | "note"
>;

const sourceIndex = new Map(benchmarkSources.map((source) => [source.id, source]));
const hoursFormatter = new Intl.NumberFormat("en-US");

function formatHours(value: number) {
  return `${hoursFormatter.format(value)} hours`;
}

function getSource(id: string) {
  const source = sourceIndex.get(id);

  if (!source) {
    throw new Error(`Unknown benchmark source: ${id}`);
  }

  return source;
}

function buildMdAcademicInterpretation(profile: PremedProfileInput) {
  if (profile.mcatTotal === 0) {
    if (profile.cumulativeGpa >= 3.81) {
      return "The GPA is already at or above the recent MD matriculant mean, but there is no MCAT yet, so the academic read is still incomplete.";
    }

    return "The GPA is still below the recent MD matriculant mean, and there is no MCAT yet, so MD academic competitiveness is not fully established.";
  }

  const gpaGap = profile.cumulativeGpa - 3.81;
  const mcatGap = profile.mcatTotal - 512.1;

  if (gpaGap >= 0 && mcatGap >= 0) {
    return "Both GPA and MCAT are at or above recent MD matriculant means, so the academic side is a relative strength on paper.";
  }

  if (gpaGap >= -0.06 && mcatGap >= -2) {
    return "The academics are in range of recent MD matriculant norms, but they are not clearly above the national MD bar.";
  }

  if (gpaGap >= -0.15 || mcatGap >= -4) {
    return "The academics are respectable but still below recent MD matriculant means, which makes the rest of the profile matter more.";
  }

  return "The academics are materially below recent MD matriculant means, so stronger experiences alone are less likely to erase that gap.";
}

function buildDoAcademicInterpretation(profile: PremedProfileInput) {
  if (profile.mcatTotal === 0) {
    if (profile.cumulativeGpa >= 3.6 && profile.scienceGpa >= 3.52) {
      return "The GPA profile is around recent DO entering-student averages, but there is no MCAT yet, so the academic read is still incomplete.";
    }

    return "The GPA profile is still below recent DO entering-student averages, and there is no MCAT yet, so the academic read remains incomplete.";
  }

  const overallGap = profile.cumulativeGpa - 3.6;
  const scienceGap = profile.scienceGpa - 3.52;
  const mcatGap = profile.mcatTotal - 502.97;

  if (overallGap >= 0 && scienceGap >= 0 && mcatGap >= 0) {
    return "The GPA and MCAT profile is at or above recent DO entering-student averages, so academics are supportive for a DO-leaning list.";
  }

  if (overallGap >= -0.08 && scienceGap >= -0.08 && mcatGap >= -2) {
    return "The academics are close to recent DO entering-student averages, which keeps a DO pathway realistic on paper.";
  }

  return "The academics are still below recent DO entering-student averages, so more runway or a narrower school strategy may be needed.";
}

function buildClinicalInterpretation(profile: PremedProfileInput) {
  if (profile.clinicalVolunteerHours >= 100 && profile.clinicalVolunteerHours <= 200) {
    return "Volunteer clinical exposure already sits inside a common advising range. Paid clinical work helps the story, but this app still treats volunteer hours as the core benchmark.";
  }

  if (profile.clinicalVolunteerHours > 200) {
    return "Volunteer clinical exposure is already above a common advising range. Additional paid clinical work is useful context, but it does not need to substitute for volunteer exposure here.";
  }

  if (profile.paidClinicalHours > 0) {
    return "Volunteer clinical exposure is still light relative to common advising ranges, even though paid clinical work adds favorable context.";
  }

  return "Volunteer clinical exposure is still light relative to common advising ranges, and there is not much paid clinical context to offset that.";
}

function buildServiceInterpretation(profile: PremedProfileInput) {
  if (profile.nonClinicalVolunteerHours >= 717) {
    return "Service volume is already at or above the recent MD matriculant average. That does not guarantee anything, but it is no longer a weakness on raw hours.";
  }

  if (profile.nonClinicalVolunteerHours >= 450) {
    return "Service volume is substantial, even though it still sits below the recent MD matriculant average community-service level.";
  }

  if (profile.nonClinicalVolunteerHours >= 250) {
    return "Service is meaningful, but it is still well below the recent MD matriculant average, so it should not be framed as a standout strength yet.";
  }

  if (profile.nonClinicalVolunteerHours >= 100) {
    return "Service is present but still light compared with recent matriculant averages, especially for service-oriented school lists.";
  }

  return "Non-clinical service is thin relative to recent matriculant averages and remains one of the easier ways to improve the profile.";
}

function buildShadowingInterpretation(profile: PremedProfileInput) {
  if (profile.shadowingTotalHours > 80) {
    return "Shadowing volume is already above the usual advising band, so more hours here are likely yielding diminishing returns instead of solving a bigger weakness.";
  }

  if (profile.shadowingTotalHours >= 40) {
    return "Shadowing is already inside a common advising band, which is usually enough for this category unless breadth is unusually narrow.";
  }

  if (profile.shadowingTotalHours >= 20) {
    return "Shadowing is present but still below the common advising band, though AAMC makes clear that shadowing is not always required if clinical exposure is otherwise strong.";
  }

  return "Shadowing is thin, but this is usually a smaller problem than weak clinical volunteering or weak service because AAMC treats shadowing as partly substitutable.";
}

function buildResearchInterpretation(profile: PremedProfileInput) {
  const outputs =
    profile.postersPresentationsCount +
    profile.publicationsCount +
    profile.abstractsCount;

  if (profile.researchHeavyPreference) {
    if (profile.researchHours >= 300 && outputs > 0) {
      return "For a research-heavy school list, the research side is credible and includes at least one tangible output.";
    }

    if (profile.researchHours >= 200) {
      return "There is real research exposure, but a research-heavy school list would usually benefit from more depth or output.";
    }

    return "Research is too thin for a clearly research-heavy strategy, even though AAMC says expectations vary by school mission.";
  }

  if (profile.researchHours >= 150) {
    return "There is enough research exposure to avoid looking blank in this area for many general school lists.";
  }

  if (profile.researchHours > 0) {
    return "There is some research, but it is still shallow enough that mission-fit will matter a lot.";
  }

  return "There is no research entered. That is not fatal for every school, but it narrows flexibility because AAMC says most accepted applicants have some research.";
}

export function buildSourceBackedComparisons(
  profile: PremedProfileInput,
): AiSourceBackedComparison[] {
  const comparisons: AiSourceBackedComparison[] = [];

  if (profile.applicationInterest !== "DO") {
    comparisons.push({
      id: "md-academics",
      area: "academics",
      label: "MD academic anchor",
      evidenceType: "official_data",
      applicantValue:
        profile.mcatTotal > 0
          ? `Cumulative GPA ${profile.cumulativeGpa.toFixed(2)} | science GPA ${profile.scienceGpa.toFixed(2)} | MCAT ${profile.mcatTotal}`
          : `Cumulative GPA ${profile.cumulativeGpa.toFixed(2)} | science GPA ${profile.scienceGpa.toFixed(2)} | MCAT not taken`,
      benchmarkFact:
        "AAMC reported recent MD matriculant means of GPA 3.81 and MCAT 512.1, and its 2026 selection guide still frames outcomes in GPA bands like 3.80-4.00 and MCAT bands like 510-513 and 514-517.",
      interpretation: buildMdAcademicInterpretation(profile),
      sourceIds: ["aamc-enrollment-2025", "aamc-mcat-selection-2026"],
    });
  }

  if (profile.applicationInterest !== "MD") {
    comparisons.push({
      id: "do-academics",
      area: "academics",
      label: "DO academic anchor",
      evidenceType: "official_data",
      applicantValue:
        profile.mcatTotal > 0
          ? `Cumulative GPA ${profile.cumulativeGpa.toFixed(2)} | science GPA ${profile.scienceGpa.toFixed(2)} | MCAT ${profile.mcatTotal}`
          : `Cumulative GPA ${profile.cumulativeGpa.toFixed(2)} | science GPA ${profile.scienceGpa.toFixed(2)} | MCAT not taken`,
      benchmarkFact:
        "AACOM lists 2024 entering-student averages of overall GPA 3.60, science GPA 3.52, and total MCAT 502.97.",
      interpretation: buildDoAcademicInterpretation(profile),
      sourceIds: ["aacom-admissions-2024"],
    });
  }

  comparisons.push({
    id: "clinical-context",
    area: "clinical",
    label: "Clinical volunteering versus paid clinical context",
    evidenceType: "official_guidance",
    applicantValue: `${formatHours(profile.clinicalVolunteerHours)} volunteer clinical | ${formatHours(profile.paidClinicalHours)} paid clinical`,
    benchmarkFact:
      "UVA prehealth advising suggests roughly 100 to 200 hours of clinical volunteering or work. AMCAS separately tracks Community Service/Volunteer - Medical/Clinical and Paid Employment - Medical/Clinical experiences, and AAMC's 2023 admissions-officer survey placed both volunteer and paid clinical experiences in the highest-importance experience group.",
    interpretation: buildClinicalInterpretation(profile),
    sourceIds: [
      "uva-clinical-experiences",
      "amcas-work-activities-2027",
      "aamc-mcat-selection-2026",
    ],
  });

  comparisons.push({
    id: "service-context",
    area: "service",
    label: "Non-clinical service context",
    evidenceType: "official_data",
    applicantValue: `${formatHours(profile.nonClinicalVolunteerHours)} non-clinical service`,
    benchmarkFact:
      "AAMC reported an average of 717 community-service hours per recent MD matriculant and separately emphasizes sustained nonmedical volunteer work over scattered short-term activity.",
    interpretation: buildServiceInterpretation(profile),
    sourceIds: ["aamc-enrollment-2025", "aamc-volunteer"],
  });

  comparisons.push({
    id: "shadowing-context",
    area: "shadowing",
    label: "Shadowing guidance",
    evidenceType: "advising_heuristic",
    applicantValue: `${formatHours(profile.shadowingTotalHours)} shadowing across ${profile.physiciansShadowed} physician${profile.physiciansShadowed === 1 ? "" : "s"}`,
    benchmarkFact:
      "Harvard advising suggests about 40 to 50 hours of shadowing over college, while AAMC says 87% of surveyed admissions officers accepted alternate activities instead of clinical shadowing.",
    interpretation: buildShadowingInterpretation(profile),
    sourceIds: ["harvard-experience", "aamc-shadowing"],
  });

  comparisons.push({
    id: "research-context",
    area: "research",
    label: "Research context",
    evidenceType: "official_guidance",
    applicantValue: `${formatHours(profile.researchHours)} research | ${profile.researchProjectsCount} project${profile.researchProjectsCount === 1 ? "" : "s"} | ${profile.postersPresentationsCount + profile.publicationsCount + profile.abstractsCount} output${profile.postersPresentationsCount + profile.publicationsCount + profile.abstractsCount === 1 ? "" : "s"}`,
    benchmarkFact:
      "AAMC says research expectations vary by school mission and that most accepted applicants have some research experience.",
    interpretation: buildResearchInterpretation(profile),
    sourceIds: ["aamc-research"],
  });

  return comparisons;
}

export function collectComparisonSources(
  comparisons: AiSourceBackedComparison[],
): AiAnalysisSource[] {
  return Array.from(
    new Set(comparisons.flatMap((comparison) => comparison.sourceIds)),
  ).map((id) => {
    const source = getSource(id);

    return {
      id: source.id,
      title: source.title,
      organization: source.organization,
      url: source.url,
      publishedLabel: source.publishedLabel,
      verifiedOn: source.verifiedOn,
      keyStats: source.keyStats,
      note: source.note,
    };
  });
}
