"use client";

import { useState, useTransition } from "react";
import { BrainCircuit, ExternalLink, RefreshCw, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type AiAnalysisSection = {
  title: string;
  body: string;
  comparisonIds: string[];
};

type AiProfileAnalysis = {
  headline: string;
  verdict: string;
  supportingRationale: string;
  deepDiveSections: AiAnalysisSection[];
  strongestSignals: string[];
  limitingFactors: string[];
  priorityActions: string[];
  cautionNote: string;
};

type AiSourceBackedComparison = {
  id: string;
  area:
    | "academics"
    | "clinical"
    | "service"
    | "research"
    | "shadowing"
    | "letters";
  label: string;
  evidenceType: "official_data" | "official_guidance" | "advising_heuristic";
  applicantValue: string;
  benchmarkFact: string;
  interpretation: string;
  sourceIds: string[];
};

type AiAnalysisSource = {
  id: string;
  title: string;
  organization: string;
  url: string;
  publishedLabel: string;
  verifiedOn: string;
  keyStats: string[];
  note?: string;
};

type Props = {
  profileId: string;
};

const EVIDENCE_TYPE_LABELS: Record<AiSourceBackedComparison["evidenceType"], string> =
  {
    official_data: "Official data",
    official_guidance: "Official guidance",
    advising_heuristic: "Advising heuristic",
  };

async function parseJsonSafely(response: Response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as {
      error?: string;
      model?: string;
      analysis?: AiProfileAnalysis;
      comparisons?: AiSourceBackedComparison[];
      sources?: AiAnalysisSource[];
    };
  } catch {
    return null;
  }
}

export function AiAnalysisCard({ profileId }: Props) {
  const [analysis, setAnalysis] = useState<AiProfileAnalysis | null>(null);
  const [comparisons, setComparisons] = useState<AiSourceBackedComparison[]>([]);
  const [sources, setSources] = useState<AiAnalysisSource[]>([]);
  const [model, setModel] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasAttempted, setHasAttempted] = useState(false);
  const [isPending, startTransition] = useTransition();

  function loadAnalysis() {
    startTransition(async () => {
      setHasAttempted(true);
      setError(null);

      try {
        const response = await fetch(`/api/profiles/${profileId}/ai-analysis`, {
          method: "GET",
          cache: "no-store",
        });
        const json = await parseJsonSafely(response);

        if (!response.ok || !json?.analysis) {
          throw new Error(
            json?.error || "Unable to generate backend AI analysis right now.",
          );
        }

        setAnalysis(json.analysis);
        setComparisons(json.comparisons ?? []);
        setSources(json.sources ?? []);
        setModel(json.model ?? null);
      } catch (caughtError) {
        setAnalysis(null);
        setComparisons([]);
        setSources([]);
        setModel(null);
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Unable to generate backend AI analysis right now.",
        );
      }
    });
  }

  const comparisonMap = Object.fromEntries(
    comparisons.map((comparison) => [comparison.id, comparison]),
  );
  const sourceMap = Object.fromEntries(sources.map((source) => [source.id, source]));

  return (
    <Card className="border-border/70 bg-card/95 shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="space-y-2">
          <CardTitle>AI analysis</CardTitle>
          <CardDescription>
            This uses a real server-side Mistral call, but the model is anchored
            to deterministic AAMC, AACOM, and advising-source benchmark facts so
            the analysis can cite published data instead of inventing numbers.
          </CardDescription>
        </div>
        <BrainCircuit className="size-5 text-primary" />
      </CardHeader>
      <CardContent className="space-y-4">
        {!analysis && !isPending ? (
          <div className="space-y-4 rounded-2xl border border-dashed border-border/70 bg-background p-4">
            <p className="text-sm text-muted-foreground">
              Generate a model-written interpretation of your profile, strongest
              signals, limiting factors, and next-best moves, plus a source-backed
              comparison against published benchmark facts.
            </p>
            <Button type="button" onClick={loadAnalysis}>
              <Sparkles className="size-4" />
              Generate Mistral analysis
            </Button>
          </div>
        ) : null}

        {isPending ? (
          <div className="space-y-3">
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : null}

        {error ? (
          <div className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
            <p>{error}</p>
            <Button type="button" variant="outline" onClick={loadAnalysis}>
              <RefreshCw className="size-4" />
              Try again
            </Button>
          </div>
        ) : null}

        {analysis ? (
          <div className="space-y-5">
            <div className="rounded-2xl border border-border/70 bg-background p-4">
              <p className="text-lg font-semibold">{analysis.headline}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {analysis.verdict}
              </p>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {analysis.supportingRationale}
              </p>
              {model ? (
                <p className="mt-3 text-xs font-medium uppercase tracking-[0.18em] text-primary">
                  Model: {model}
                </p>
              ) : null}
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              {analysis.deepDiveSections.map((section) => (
                <div
                  key={section.title}
                  className="rounded-2xl border border-border/70 bg-background p-4"
                >
                  <p className="font-medium">{section.title}</p>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {section.body}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {section.comparisonIds.map((comparisonId) => {
                      const comparison = comparisonMap[comparisonId];

                      if (!comparison) {
                        return null;
                      }

                      return (
                        <span
                          key={comparisonId}
                          className="rounded-full border border-border/70 bg-muted px-3 py-1 text-xs text-muted-foreground"
                        >
                          {comparison.label}
                        </span>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="grid gap-4 xl:grid-cols-3">
              <div className="rounded-2xl border border-border/70 bg-background p-4">
                <p className="font-medium">Strongest signals</p>
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                  {analysis.strongestSignals.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background p-4">
                <p className="font-medium">Limiting factors</p>
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                  {analysis.limitingFactors.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background p-4">
                <p className="font-medium">Priority actions</p>
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                  {analysis.priorityActions.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="space-y-4 rounded-2xl border border-border/70 bg-background p-4">
              <div className="space-y-1">
                <p className="font-medium">Source-backed benchmark facts</p>
                <p className="text-sm text-muted-foreground">
                  These facts are deterministic. The model can interpret them, but
                  it does not get to invent them.
                </p>
              </div>

              <div className="grid gap-4 xl:grid-cols-2">
                {comparisons.map((comparison) => (
                  <div
                    key={comparison.id}
                    className="rounded-2xl border border-border/70 bg-muted/40 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="font-medium">{comparison.label}</p>
                      <span className="rounded-full border border-border/70 bg-background px-3 py-1 text-xs text-muted-foreground">
                        {EVIDENCE_TYPE_LABELS[comparison.evidenceType]}
                      </span>
                    </div>
                    <div className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">
                          Your data
                        </p>
                        <p>{comparison.applicantValue}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">
                          Published benchmark fact
                        </p>
                        <p>{comparison.benchmarkFact}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">
                          Interpretation
                        </p>
                        <p>{comparison.interpretation}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">
                          Citations
                        </p>
                        <ul className="mt-2 space-y-2">
                          {comparison.sourceIds.map((sourceId) => {
                            const source = sourceMap[sourceId];

                            if (!source) {
                              return null;
                            }

                            return (
                              <li key={source.id}>
                                <a
                                  href={source.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline"
                                >
                                  {source.organization}: {source.title}
                                  <ExternalLink className="size-3" />
                                </a>
                                <p className="mt-1 text-xs text-muted-foreground">
                                  {source.publishedLabel}. Verified {source.verifiedOn}.
                                </p>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl bg-muted/70 p-4 text-sm leading-6 text-muted-foreground">
              {analysis.cautionNote}
            </div>

            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={loadAnalysis}>
                <RefreshCw className="size-4" />
                Regenerate
              </Button>
            </div>
          </div>
        ) : null}

        {!analysis && !isPending && hasAttempted && !error ? (
          <p className="text-sm text-muted-foreground">
            No AI analysis was returned.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
