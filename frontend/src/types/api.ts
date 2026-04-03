import type { PremedProfileInput } from "@/lib/validation/premed-profile";
import type { ScoreComputation } from "@/types/premed";


export type SavedPremedProfile = PremedProfileInput & {
  createdAt: Date;
  id: string;
  scoreResult: ScoreComputation | null;
  updatedAt: Date;
  userId: string;
};

export type SavedPremedProfileResponse = PremedProfileInput & {
  createdAt: string;
  id: string;
  scoreResult: ScoreComputation | null;
  updatedAt: string;
  userId: string;
};

export type AiAnalysisSection = {
  body: string;
  comparisonIds: string[];
  title: string;
};

export type AiProfileAnalysis = {
  cautionNote: string;
  deepDiveSections: AiAnalysisSection[];
  headline: string;
  limitingFactors: string[];
  priorityActions: string[];
  strongestSignals: string[];
  supportingRationale: string;
  verdict: string;
};

export type AiSourceBackedComparison = {
  applicantValue: string;
  area:
    | "academics"
    | "clinical"
    | "service"
    | "research"
    | "shadowing"
    | "letters";
  benchmarkFact: string;
  evidenceType: "official_data" | "official_guidance" | "advising_heuristic";
  id: string;
  interpretation: string;
  label: string;
  sourceIds: string[];
};

export type AiAnalysisSource = {
  id: string;
  keyStats: string[];
  note?: string;
  organization: string;
  publishedLabel: string;
  title: string;
  url: string;
  verifiedOn: string;
};
