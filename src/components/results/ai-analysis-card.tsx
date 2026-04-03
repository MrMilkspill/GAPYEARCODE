"use client";

import { useState, useTransition } from "react";
import { BrainCircuit, RefreshCw, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type AiProfileAnalysis = {
  headline: string;
  verdict: string;
  supportingRationale: string;
  strongestSignals: string[];
  limitingFactors: string[];
  priorityActions: string[];
  cautionNote: string;
};

type Props = {
  profileId: string;
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
    };
  } catch {
    return null;
  }
}

export function AiAnalysisCard({ profileId }: Props) {
  const [analysis, setAnalysis] = useState<AiProfileAnalysis | null>(null);
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
        setModel(json.model ?? null);
      } catch (caughtError) {
        setAnalysis(null);
        setModel(null);
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Unable to generate backend AI analysis right now.",
        );
      }
    });
  }

  return (
    <Card className="border-border/70 bg-card/95 shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="space-y-2">
          <CardTitle>AI analysis</CardTitle>
          <CardDescription>
            This uses a real server-side Mistral call to analyze the saved
            profile and current score breakdown. The transparent benchmark score
            remains the primary result.
          </CardDescription>
        </div>
        <BrainCircuit className="size-5 text-primary" />
      </CardHeader>
      <CardContent className="space-y-4">
        {!analysis && !isPending ? (
          <div className="space-y-4 rounded-2xl border border-dashed border-border/70 bg-background p-4">
            <p className="text-sm text-muted-foreground">
              Generate a model-written interpretation of your profile, strongest
              signals, limiting factors, and next-best moves.
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
