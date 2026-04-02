import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Activity,
  BookOpenText,
  Eye,
  HeartHandshake,
  Microscope,
  MoveRight,
  Plus,
  Stethoscope,
} from "lucide-react";

import { BenchmarkRadarChart } from "@/components/dashboard/benchmark-radar-chart";
import { DeleteProfileButton } from "@/components/dashboard/delete-profile-button";
import { ReadinessGauge } from "@/components/dashboard/readiness-gauge";
import { SummaryMetricCard } from "@/components/dashboard/summary-metric-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button-variants";
import { getSessionUser } from "@/lib/auth";
import {
  competitivenessTierLabels,
  gapYearPredictionLabels,
  hydrateScoreResult,
} from "@/lib/result";
import { listProfilesForUser } from "@/lib/profiles/repository";
import { cn } from "@/lib/utils";

export default async function DashboardPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  const profiles = await listProfilesForUser(user.id);
  const latestProfile = profiles[0];
  const latestScore = hydrateScoreResult(latestProfile?.scoreResult ?? null);

  if (!latestProfile || !latestScore) {
    return (
      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <Card className="border-border/70 bg-card/95 shadow-sm">
          <CardContent className="space-y-5 p-8">
            <p className="text-sm uppercase tracking-[0.25em] text-primary">
              Dashboard
            </p>
            <h1 className="text-4xl font-semibold tracking-tight">
              No saved profiles yet
            </h1>
            <p className="max-w-2xl text-muted-foreground">
              Create your first full applicant snapshot to score readiness, view a
              gap year recommendation, and track progress over time.
            </p>
            <Link
              href="/profiles/new"
              className={cn(buttonVariants({ variant: "default", size: "lg" }))}
            >
              <Plus className="size-4" />
              Create first profile
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const radarData = latestScore.categoryBreakdown.map((item) => ({
    label: item.label,
    current: Math.round(item.score),
    target: Math.round(item.benchmarkTarget),
  }));

  const clinicalHours =
    latestProfile.paidClinicalHours + latestProfile.clinicalVolunteerHours;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <p className="text-sm uppercase tracking-[0.25em] text-primary">
            Dashboard
          </p>
          <h1 className="text-4xl font-semibold tracking-tight">
            Welcome back, {user.name.split(" ")[0]}
          </h1>
          <p className="max-w-3xl text-muted-foreground">
            Your latest profile suggests{" "}
            {gapYearPredictionLabels[latestScore.gapYearPrediction].toLowerCase()}.
            Use the dashboard to see where the profile is already competitive and
            where another cycle of growth would help most.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href={`/results/${latestProfile.id}`}
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            View latest results
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

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <SummaryMetricCard label="Cumulative GPA" value={latestProfile.cumulativeGpa.toFixed(2)} helper="Latest saved profile" icon={<BookOpenText className="size-5" />} />
        <SummaryMetricCard label="MCAT" value={latestProfile.mcatTotal ? `${latestProfile.mcatTotal}` : "Not taken"} helper="Score snapshot" icon={<Activity className="size-5" />} />
        <SummaryMetricCard label="Clinical hours" value={`${clinicalHours}`} helper="Combined paid and volunteer clinical exposure" icon={<Stethoscope className="size-5" />} />
        <SummaryMetricCard label="Service hours" value={`${latestProfile.nonClinicalVolunteerHours}`} helper="Non-clinical service" icon={<HeartHandshake className="size-5" />} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
        <Card className="border-border/70 bg-card/95 shadow-sm">
          <CardContent className="flex flex-col items-center gap-6 p-6">
            <ReadinessGauge score={latestScore.overallScore} />
            <div className="space-y-3 text-center">
              <Badge variant="secondary" className="rounded-full px-3 py-1">
                {competitivenessTierLabels[latestScore.competitivenessTier]}
              </Badge>
              <p className="text-lg font-medium">
                {gapYearPredictionLabels[latestScore.gapYearPrediction]}
              </p>
              <p className="text-sm text-muted-foreground">
                Latest profile: {latestProfile.fullName}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/95 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Latest category profile</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Compare the saved profile against the default benchmark targets.
              </p>
            </div>
            <Microscope className="size-5 text-primary" />
          </CardHeader>
          <CardContent>
            <BenchmarkRadarChart data={radarData} />
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/70 bg-card/95 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Saved profile history</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Revisit old snapshots, compare how your profile evolved, and rescore
              when new experiences are added.
            </p>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border/70 text-muted-foreground">
                <th className="px-4 py-3 font-medium">Profile</th>
                <th className="px-4 py-3 font-medium">Cycle</th>
                <th className="px-4 py-3 font-medium">Score</th>
                <th className="px-4 py-3 font-medium">Recommendation</th>
                <th className="px-4 py-3 font-medium">Updated</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((profile) => {
                const score = hydrateScoreResult(profile.scoreResult);

                return (
                  <tr key={profile.id} className="border-b border-border/50 last:border-0">
                    <td className="px-4 py-4">
                      <div>
                        <p className="font-medium">{profile.fullName}</p>
                        <p className="text-xs text-muted-foreground">{profile.collegeName}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4">{profile.plannedApplicationCycle}</td>
                    <td className="px-4 py-4">{score ? Math.round(score.overallScore) : "N/A"}</td>
                    <td className="px-4 py-4">
                      {score ? gapYearPredictionLabels[score.gapYearPrediction] : "N/A"}
                    </td>
                    <td className="px-4 py-4">
                      {new Intl.DateTimeFormat("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      }).format(profile.updatedAt)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/results/${profile.id}`}
                          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                        >
                          <Eye className="size-4" />
                          Results
                        </Link>
                        <Link
                          href={`/profiles/${profile.id}/edit`}
                          className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
                        >
                          Edit
                        </Link>
                        <DeleteProfileButton
                          profileId={profile.id}
                          profileName={profile.fullName}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-card/95 shadow-sm">
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-lg font-medium">Need a fresh comparison point?</p>
            <p className="text-sm text-muted-foreground">
              Save another profile after the next semester, MCAT, or major
              extracurricular update.
            </p>
          </div>
          <Link
            href="/profiles/new"
            className={cn(buttonVariants({ variant: "default" }))}
          >
            Start another snapshot
            <MoveRight className="size-4" />
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
