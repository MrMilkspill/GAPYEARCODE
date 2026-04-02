import { ArrowUpRight, Compass, Layers3, Target } from "lucide-react";

import { MarketingHeader } from "@/components/layout/marketing-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const founderPrinciples = [
  {
    title: "Build with transparency",
    description:
      "I care more about decision support than black-box prediction. If a tool gives someone a recommendation, they should be able to understand why.",
    icon: Layers3,
  },
  {
    title: "Keep it useful",
    description:
      "I want products to feel practical on first use. Clear inputs, direct outputs, and concrete next steps matter more than flashy complexity.",
    icon: Target,
  },
  {
    title: "Bias toward momentum",
    description:
      "This project is built for students trying to make real timeline decisions. The goal is to reduce ambiguity and help them move forward with a plan.",
    icon: Compass,
  },
] as const;

export default function FounderPage() {
  return (
    <div className="min-h-screen">
      <MarketingHeader />
      <main className="page-shell py-16">
        <div className="max-w-5xl space-y-8">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <Card className="border-border/70 bg-card/95 shadow-sm">
              <CardContent className="space-y-5 p-8">
                <p className="text-sm uppercase tracking-[0.25em] text-primary">
                  Founder
                </p>
                <h1 className="text-4xl font-semibold tracking-tight text-balance">
                  I built this to make pre-med planning feel more legible and less
                  like guesswork.
                </h1>
                <p className="text-lg text-muted-foreground">
                  PreMed Gap Year Predictor came from a simple belief: students
                  should be able to see where they stand, understand what is
                  helping or hurting their profile, and get a realistic estimate
                  without the advice feeling vague or gatekept.
                </p>
                <p className="text-sm leading-7 text-muted-foreground">
                  I wanted the product to feel direct, transparent, and useful.
                  That means showing the scoring logic clearly, keeping the output
                  honest about uncertainty, and turning a complicated process into
                  something students can actually act on.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/70 bg-card/95 shadow-sm">
              <CardHeader>
                <CardTitle>What this reflects about me</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm leading-7 text-muted-foreground">
                <p>
                  I like building products that turn messy, high-stakes decisions
                  into structured guidance.
                </p>
                <p>
                  I care about credibility, clean execution, and giving users a
                  tool that respects their time.
                </p>
                <p>
                  I would rather ship something clear and defensible than
                  something impressive-looking but hard to trust.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {founderPrinciples.map((principle) => {
              const Icon = principle.icon;
              return (
                <Card
                  key={principle.title}
                  className="border-border/70 bg-card/95 shadow-sm"
                >
                  <CardContent className="space-y-4 p-6">
                    <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Icon className="size-5" />
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-lg font-semibold">{principle.title}</h2>
                      <p className="text-sm leading-6 text-muted-foreground">
                        {principle.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card className="border-border/70 bg-card/95 shadow-sm">
            <CardHeader>
              <CardTitle>Why this page exists</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-7 text-muted-foreground">
              <p>
                This product is not meant to pretend admissions can be perfectly
                predicted. It is meant to give people a stronger starting point,
                clearer feedback, and a better sense of what to improve next.
              </p>
              <p>
                If you want this page to feel more personal later, it can easily
                be updated with your name, background, links, or a more specific
                founder story.
              </p>
              <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-muted/60 px-4 py-2 text-sm text-foreground">
                Built with transparency, practicality, and a bias toward useful
                action
                <ArrowUpRight className="size-4 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
