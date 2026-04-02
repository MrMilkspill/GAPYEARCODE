import { ArrowUpRight, Database, FileText, ShieldCheck } from "lucide-react";

import { MarketingHeader } from "@/components/layout/marketing-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { defaultBenchmarkConfig } from "@/lib/benchmarks/defaults";
import {
  benchmarkDerivationNotes,
  benchmarkMethodNotes,
  benchmarkSources,
} from "@/lib/benchmarks/sources";

export default function SourcesPage() {
  return (
    <div className="min-h-screen">
      <MarketingHeader />
      <main className="page-shell py-16">
        <div className="max-w-5xl space-y-8">
          <div className="space-y-4">
            <p className="text-sm uppercase tracking-[0.25em] text-primary">
              Sources and benchmark notes
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-balance">
              Where the benchmark data comes from and how the app uses it.
            </h1>
            <p className="max-w-3xl text-lg text-muted-foreground">
              This page separates official national data from heuristic planning
              ranges. The academic anchors are tied to current AAMC and AACOM
              releases. Hour-based experience cutoffs are transparent planning
              bands, not claims that every school uses the same hard minimum.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <Card className="border-border/70 bg-card/95 shadow-sm">
              <CardHeader className="space-y-2">
                <Database className="size-5 text-primary" />
                <CardTitle className="text-lg">Current benchmark version</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>
                  Version <span className="font-medium text-foreground">{defaultBenchmarkConfig.version}</span>
                </p>
                <p>Last updated {defaultBenchmarkConfig.lastUpdated}</p>
              </CardContent>
            </Card>
            <Card className="border-border/70 bg-card/95 shadow-sm">
              <CardHeader className="space-y-2">
                <ShieldCheck className="size-5 text-primary" />
                <CardTitle className="text-lg">Accuracy policy</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Official MD and DO academic data is preferred whenever it exists.
                When no single national number exists, the app labels the cutoff as
                heuristic and keeps it configurable.
              </CardContent>
            </Card>
            <Card className="border-border/70 bg-card/95 shadow-sm">
              <CardHeader className="space-y-2">
                <FileText className="size-5 text-primary" />
                <CardTitle className="text-lg">Why this matters</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                The app is meant to be transparent. You should be able to see what
                is official data, what is advisor-style benchmarking, and where the
                gap-year recommendation is coming from.
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
              <CardTitle>How the current model translates sources into bands</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {benchmarkDerivationNotes.map((note) => (
                <div
                  key={note.category}
                  className="rounded-2xl border border-border/70 px-4 py-4"
                >
                  <p className="text-sm font-semibold text-foreground">
                    {note.category}
                  </p>
                  <p className="mt-2 text-sm text-foreground">{note.currentBands}</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {note.rationale}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card/95 shadow-sm">
            <CardHeader>
              <CardTitle>Source list</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {benchmarkSources.map((source) => (
                <div
                  key={source.id}
                  className="rounded-3xl border border-border/70 bg-background/70 p-5"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-primary">
                          {source.category}
                        </span>
                        <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                          {source.organization}
                        </span>
                      </div>
                      <h2 className="text-xl font-semibold text-balance">
                        {source.title}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        {source.publishedLabel} · verified {source.verifiedOn}
                      </p>
                    </div>
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-full border border-border/70 px-4 py-2 text-sm font-medium text-foreground transition hover:border-primary/50 hover:bg-muted/70"
                    >
                      Open source
                      <ArrowUpRight className="size-4" />
                    </a>
                  </div>

                  <div className="mt-5 grid gap-5 md:grid-cols-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Key data points used
                      </p>
                      <ul className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
                        {source.keyStats.map((stat) => (
                          <li key={stat}>{stat}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        How the app uses it
                      </p>
                      <ul className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
                        {source.usedFor.map((usage) => (
                          <li key={usage}>{usage}</li>
                        ))}
                      </ul>
                      {source.note ? (
                        <p className="mt-4 rounded-2xl bg-muted/70 px-4 py-3 text-sm leading-6 text-muted-foreground">
                          {source.note}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
