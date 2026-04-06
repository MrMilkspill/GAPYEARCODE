import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  Compass,
  HeartPulse,
  LineChart,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { MarketingHeader } from "@/components/layout/marketing-header";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button-variants";
import { defaultBenchmarkConfig } from "@/lib/benchmarks/defaults";
import { siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: siteConfig.name,
  description: siteConfig.description,
  alternates: {
    canonical: "/",
  },
};

const featureCards = [
  {
    title: "Transparent scoring",
    description:
      "Every readiness estimate shows exactly how academics, volunteer clinical hours, paid clinical context, service, research, and application readiness contribute.",
    icon: LineChart,
  },
  {
    title: "Gap year planning",
    description:
      "Recommendations are framed as readiness estimates, not promises, with concrete next-step targets for the next 6 to 12 months.",
    icon: Compass,
  },
  {
    title: "Holistic context",
    description:
      "Upward trends, work during school, service leadership, and school-list preferences shape the model without hiding weak academics.",
    icon: HeartPulse,
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <MarketingHeader />
      <main>
        <section className="page-shell py-16 sm:py-24">
          <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div className="space-y-8">
              <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/80 px-4 py-2 text-sm text-muted-foreground">
                <ShieldCheck className="size-4 text-primary" />
                Heuristic guidance, not an admissions guarantee
              </span>
              <div className="space-y-5">
                <h1 className="max-w-3xl text-5xl font-semibold tracking-tight text-balance sm:text-6xl">
                  Compare your pre-med profile against typical applicant expectations.
                </h1>
                <p className="max-w-2xl text-lg text-muted-foreground">
                  Save full applicant profiles, score readiness with a transparent
                  benchmark model, and see whether your current profile suggests no
                  gap year, one gap year, or a longer runway before applying.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/login"
                  className={cn(buttonVariants({ variant: "default", size: "lg" }))}
                >
                  Launch dashboard
                  <ArrowRight className="size-4" />
                </Link>
                <Link
                  href="/about"
                  className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
                >
                  Review methodology
                </Link>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <Card className="border-border/70 bg-card/95 shadow-sm">
                  <CardContent className="p-5">
                    <p className="text-3xl font-semibold tracking-tight">40%</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Academic weight in the default benchmark model
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-border/70 bg-card/95 shadow-sm">
                  <CardContent className="p-5">
                    <p className="text-3xl font-semibold tracking-tight">150+</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Volunteer clinical planning marker in the default model
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-border/70 bg-card/95 shadow-sm">
                  <CardContent className="p-5">
                    <p className="text-3xl font-semibold tracking-tight">40-80</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Shadowing planning range with little added benefit beyond it
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
            <Card className="overflow-hidden border-border/70 bg-card/95 shadow-xl">
              <CardContent className="surface-grid relative p-8">
                <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-r from-primary/10 via-accent/20 to-transparent" />
                <div className="relative space-y-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Example readiness profile</p>
                      <p className="text-2xl font-semibold">Score breakdown preview</p>
                    </div>
                    <Sparkles className="size-5 text-primary" />
                  </div>
                  <div className="space-y-4">
                    {Object.entries(defaultBenchmarkConfig.weights).map(([key, value]) => (
                      <div key={key} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="capitalize text-muted-foreground">
                            {key.replace(/([A-Z])/g, " $1")}
                          </span>
                          <span className="font-medium">{value}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted">
                          <div
                            className="h-2 rounded-full bg-primary"
                            style={{ width: `${value * 2.2}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="page-shell pb-16">
          <div className="grid gap-6 lg:grid-cols-3">
            {featureCards.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card key={feature.title} className="border-border/70 bg-card/95 shadow-sm">
                  <CardContent className="space-y-4 p-6">
                    <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Icon className="size-5" />
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-xl font-semibold">{feature.title}</h2>
                      <p className="text-sm leading-6 text-muted-foreground">
                        {feature.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
