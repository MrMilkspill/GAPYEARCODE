import Link from "next/link";

import { MarketingHeader } from "@/components/layout/marketing-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { defaultBenchmarkConfig } from "@/lib/benchmarks/defaults";
import { benchmarkMethodNotes } from "@/lib/benchmarks/sources";

const benchmarkRows = [
  ["Cumulative GPA", "3.80+ excellent, 3.65+ strong, 3.45+ moderate"],
  ["Science GPA", "3.75+ excellent, 3.60+ strong, 3.40+ moderate"],
  ["MCAT", "515+ excellent, 510+ strong, 505+ moderate"],
  [
    "Clinical",
    "300+ clinical volunteer hours strong; paid clinical work is tracked separately as context.",
  ],
  ["Service", "350+ non-clinical service hours strong, 600+ excellent"],
  ["Shadowing", "40+ hours strong, with physician breadth"],
  ["Research", "300+ stronger baseline, higher for research-heavy lists"],
];

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      <MarketingHeader />
      <main className="page-shell py-16">
        <div className="max-w-4xl space-y-8">
          <div className="space-y-4">
            <p className="text-sm uppercase tracking-[0.25em] text-primary">
              About the methodology
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-balance">
              A transparent readiness tool, not an admissions guarantee.
            </h1>
            <p className="text-lg text-muted-foreground">
              The PreMed Gap Year Predictor is a heuristic model. It helps estimate
              readiness against typical U.S. applicant expectations, but medical
              school admissions remain holistic, school-specific, and human.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/sources"
                className="inline-flex items-center rounded-full border border-border/70 px-4 py-2 text-sm font-medium transition hover:border-primary/50 hover:bg-muted/70"
              >
                View source list
              </Link>
              <p className="self-center text-sm text-muted-foreground">
                Benchmark version {defaultBenchmarkConfig.version} · updated{" "}
                {defaultBenchmarkConfig.lastUpdated}
              </p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-border/70 bg-card/95 shadow-sm">
              <CardHeader>
                <CardTitle>How the score works</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                {Object.entries(defaultBenchmarkConfig.weights).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between rounded-2xl bg-muted/60 px-4 py-3">
                    <span className="capitalize">{key.replace(/([A-Z])/g, " $1")}</span>
                    <span className="font-medium text-foreground">{value}%</span>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card className="border-border/70 bg-card/95 shadow-sm">
              <CardHeader>
                <CardTitle>Why a gap year may appear</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
                <p>
                  The model recommends extra time when one or more high-value areas
                  are underdeveloped, especially academics, clinical exposure, or
                  non-clinical service.
                </p>
                <p>
                  In this stricter version, paid clinical work helps as context,
                  but the core clinical benchmark is based on clinical volunteer
                  hours rather than a combined total.
                </p>
                <p>
                  Service and leadership can partly offset weaker areas, but the
                  model intentionally prevents extracurricular strength from fully
                  hiding weak academics.
                </p>
                <p>
                  MD versus DO interest and research-heavy or service-heavy school
                  preferences adjust interpretation slightly, but they do not erase
                  major gaps.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {benchmarkMethodNotes.map((note) => (
              <Card
                key={note.title}
                className="border-border/70 bg-card/95 shadow-sm"
              >
                <CardHeader>
                  <CardTitle className="text-lg">{note.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm leading-6 text-muted-foreground">
                  {note.detail}
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="border-border/70 bg-card/95 shadow-sm">
            <CardHeader>
              <CardTitle>Current reference bands</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {benchmarkRows.map(([label, detail]) => (
                <div
                  key={label}
                  className="flex flex-col gap-1 rounded-2xl border border-border/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <p className="font-medium">{label}</p>
                  <p className="text-sm text-muted-foreground">{detail}</p>
                </div>
              ))}
              <p className="rounded-2xl bg-muted/70 px-4 py-3 text-sm leading-6 text-muted-foreground">
                These bands are source-backed planning cutoffs, not claims about a
                single universal admissions minimum. The full AAMC, AACOM, and
                university-advising source list is on the Sources page.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
