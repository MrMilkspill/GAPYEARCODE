import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  Activity,
  BookOpenText,
  ChevronRight,
  Eye,
  HeartHandshake,
  Microscope,
  Plus,
  Stethoscope,
  UserRoundCog,
} from "lucide-react";

import { BenchmarkBarChart } from "@/components/dashboard/benchmark-bar-chart";
import { BenchmarkRadarChart } from "@/components/dashboard/benchmark-radar-chart";
import { PrintResultsButton } from "@/components/dashboard/print-results-button";
import { ReadinessGauge } from "@/components/dashboard/readiness-gauge";
import { SummaryMetricCard } from "@/components/dashboard/summary-metric-card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getSessionUser } from "@/lib/auth";
import {
  competitivenessTierLabels,
  confidenceLevelLabels,
  gapYearPredictionLabels,
  hydrateScoreResult,
} from "@/lib/result";
import { getProfileForUser } from "@/lib/profiles/repository";
import { cn } from "@/lib/utils";

type ResultPageProps = {
  params: {
    id: string;
  };
};

export default async function ResultPage({ params }: ResultPageProps) {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await getProfileForUser(user.id, params.id);
  const score = hydrateScoreResult(profile?.scoreResult ?? null);

  if (!profile || !score) {
    notFound();
  }

  const clinicalHours = Math.max(
    profile.patientFacingHours,
    profile.paidClinicalHours + profile.clinicalVolunteerHours,
  );

  const radarData = score.categoryBreakdown.map((item) => ({
    label: item.label,
    current: Math.round(item.score),
    target: Math.round(item.benchmarkTarget),
  }));

  const percentToTargetData = score.comparisonMetrics.map((metric) => ({
    label: metric.label,
    current:
      metric.targetValue === 0
        ? 100
        : Math.min(Math.round((metric.userValue / metric.targetValue) * 100), 140),
    target: 100,
    status: metric.status,
  }));

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="space-y-3">
          <p className="text-sm uppercase tracking-[0.25em] text-primary">
            Results
          </p>
          <h1 className="text-4xl font-semibold tracking-tight">{profile.fullName}</h1>
          <p className="max-w-3xl text-muted-foreground">
            Planned cycle: {profile.plannedApplicationCycle}. This estimate reflects
            your current saved snapshot and should be interpreted as planning
            guidance, not an admissions promise.
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="rounded-full px-3 py-1">
              {competitivenessTierLabels[score.competitivenessTier]}
            </Badge>
            <Badge variant="outline" className="rounded-full px-3 py-1">
              {gapYearPredictionLabels[score.gapYearPrediction]}
            </Badge>
            <Badge variant="outline" className="rounded-full px-3 py-1">
              Confidence: {confidenceLevelLabels[score.confidenceLevel]}
            </Badge>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <PrintResultsButton />
          <Link
            href={`/profiles/${profile.id}/edit`}
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            <UserRoundCog className="size-4" />
            Edit profile
          </Link>
          <Link
            href="/profiles/new"
            className={cn(buttonVariants({ variant: "default" }))}
          >
            <Plus className="size-4" />
            New profile
          </Link>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
        <Card className="border-border/70 bg-card/95 shadow-sm">
          <CardContent className="flex flex-col items-center gap-6 p-6">
            <ReadinessGauge score={score.overallScore} />
            <div className="space-y-3 text-center">
              <p className="text-lg font-medium">
                {gapYearPredictionLabels[score.gapYearPrediction]}
              </p>
              <p className="text-sm text-muted-foreground">{score.explanation}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/95 shadow-sm">
          <CardHeader>
            <CardTitle>Score interpretation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-sm leading-7 text-muted-foreground">
              {score.explanation}
            </p>
            <Separator />
            <div className="grid gap-6 md:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground">Tier</p>
                <p className="mt-2 text-xl font-semibold">
                  {competitivenessTierLabels[score.competitivenessTier]}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Confidence</p>
                <p className="mt-2 text-xl font-semibold">
                  {confidenceLevelLabels[score.confidenceLevel]}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Context adjustment</p>
                <p className="mt-2 text-xl font-semibold">
                  {score.contextAdjustment >= 0 ? "+" : ""}
                  {score.contextAdjustment}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <SummaryMetricCard label="Cumulative GPA" value={profile.cumulativeGpa.toFixed(2)} helper="Latest saved snapshot" icon={<BookOpenText className="size-5" />} />
        <SummaryMetricCard label="MCAT" value={profile.mcatTotal ? `${profile.mcatTotal}` : "Not taken"} helper="Current total score" icon={<Activity className="size-5" />} />
        <SummaryMetricCard label="Clinical hours" value={`${clinicalHours}`} helper="Combined clinical exposure" icon={<Stethoscope className="size-5" />} />
        <SummaryMetricCard label="Service hours" value={`${profile.nonClinicalVolunteerHours}`} helper="Non-clinical community service" icon={<HeartHandshake className="size-5" />} />
        <SummaryMetricCard label="Research hours" value={`${profile.researchHours}`} helper="Total research time" icon={<Microscope className="size-5" />} />
        <SummaryMetricCard label="Shadowing hours" value={`${profile.shadowingTotalHours}`} helper="Total physician shadowing" icon={<Eye className="size-5" />} />
        <SummaryMetricCard label="Leadership hours" value={`${profile.leadershipHours}`} helper="Structured leadership involvement" icon={<UserRoundCog className="size-5" />} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="border-border/70 bg-card/95 shadow-sm">
          <CardHeader>
            <CardTitle>Category score radar</CardTitle>
          </CardHeader>
          <CardContent>
            <BenchmarkRadarChart data={radarData} />
          </CardContent>
        </Card>
        <Card className="border-border/70 bg-card/95 shadow-sm">
          <CardHeader>
            <CardTitle>Benchmark progress chart</CardTitle>
            <p className="text-sm text-muted-foreground">
              Current values are shown as percent of the benchmark target for easier cross-category comparison.
            </p>
          </CardHeader>
          <CardContent>
            <BenchmarkBarChart data={percentToTargetData} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="border-border/70 bg-card/95 shadow-sm">
          <CardHeader>
            <CardTitle>Strengths</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {score.strengths.map((item) => (
              <div key={item} className="flex gap-3 rounded-2xl bg-emerald-50 px-4 py-3 text-emerald-900">
                <ChevronRight className="mt-0.5 size-4 shrink-0" />
                <p>{item}</p>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="border-border/70 bg-card/95 shadow-sm">
          <CardHeader>
            <CardTitle>Weaknesses</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {score.weaknesses.map((item) => (
              <div key={item} className="flex gap-3 rounded-2xl bg-amber-50 px-4 py-3 text-amber-950">
                <ChevronRight className="mt-0.5 size-4 shrink-0" />
                <p>{item}</p>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="border-border/70 bg-card/95 shadow-sm">
          <CardHeader>
            <CardTitle>Improvement plan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {score.improvementPlan.map((item) => (
              <div key={item.area} className="rounded-2xl border border-border/70 bg-background p-4">
                <p className="font-medium">{item.area}</p>
                <p className="mt-2 text-muted-foreground">{item.target}</p>
                <p className="mt-2 text-xs text-muted-foreground">{item.rationale}</p>
                <p className="mt-2 text-xs font-medium text-primary">{item.timeline}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/70 bg-card/95 shadow-sm">
        <CardHeader>
          <CardTitle>Category scoring breakdown</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 xl:grid-cols-2">
          {score.categoryBreakdown.map((item) => (
            <div key={item.key} className="rounded-3xl border border-border/70 bg-background p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-lg font-semibold">{item.label}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{item.summary}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-semibold">{Math.round(item.score)}</p>
                  <p className="text-xs text-muted-foreground">{item.weight}% weight</p>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-card/95 shadow-sm">
        <CardHeader>
          <CardTitle>Benchmark comparison details</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border/70 text-muted-foreground">
                <th className="px-4 py-3 font-medium">Metric</th>
                <th className="px-4 py-3 font-medium">Current</th>
                <th className="px-4 py-3 font-medium">Target</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {score.comparisonMetrics.map((metric) => (
                <tr key={metric.key} className="border-b border-border/50 last:border-0">
                  <td className="px-4 py-4">{metric.label}</td>
                  <td className="px-4 py-4">{metric.userValue.toFixed(metric.unit === "gpa" ? 2 : 0)}</td>
                  <td className="px-4 py-4">{metric.targetValue.toFixed(metric.unit === "gpa" ? 2 : 0)}</td>
                  <td className="px-4 py-4">
                    <Badge
                      variant="secondary"
                      className="rounded-full px-3 py-1 capitalize"
                    >
                      {metric.status.replace("_", " ")}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-card/95 shadow-sm">
        <CardContent className="space-y-3 p-6 text-sm text-muted-foreground">
          {score.disclaimers.map((item) => (
            <p key={item}>{item}</p>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
