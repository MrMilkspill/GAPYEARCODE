import type { Metadata } from "next";
import Link from "next/link";
import { Mail } from "lucide-react";

import { MarketingHeader } from "@/components/layout/marketing-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Learn about Nishkarsh Sharma, why the PreMed Gap Year Predictor was built, and how to get in touch.",
  alternates: {
    canonical: "/contact",
  },
};

const contentSections = [
  {
    title: "About",
    paragraphs: [
      "I\u2019m Nishkarsh Sharma, a pre-med student at The Ohio State University pursuing a double major in Neuroscience and Biology. I built this tool to help pre-med students better understand where they stand in the application process and whether a gap year might strengthen their application.",
      "Through my experience in clinical settings, research labs, and community outreach, I\u2019ve seen how difficult it can be to gauge competitiveness without clear guidance. This project aims to make that process more transparent and accessible.",
    ],
  },
  {
    title: "Purpose",
    paragraphs: [
      "Many students rely on scattered advice or vague benchmarks when deciding whether to take a gap year. This tool brings together key factors like GPA, MCAT, clinical experience, research, and service to provide a more structured way to think about that decision.",
    ],
  },
] as const;

export default function ContactPage() {
  return (
    <div className="min-h-screen">
      <MarketingHeader />
      <main className="page-shell py-16">
        <div className="mx-auto max-w-4xl space-y-8">
          <div className="space-y-4">
            <p className="text-sm uppercase tracking-[0.25em] text-primary">
              Contact
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-balance">
              Learn more about the person behind the project and how to get in touch.
            </h1>
            <p className="max-w-3xl text-lg text-muted-foreground">
              This page explains who built the tool, why it exists, and the best
              way to reach out.
            </p>
          </div>

          <div className="space-y-6">
            {contentSections.map((section) => (
              <Card
                key={section.title}
                className="border-border/70 bg-card/95 shadow-sm"
              >
                <CardHeader>
                  <CardTitle>{section.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm leading-7 text-muted-foreground sm:text-base">
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </CardContent>
              </Card>
            ))}

            <Card className="border-border/70 bg-card/95 shadow-sm">
              <CardHeader>
                <CardTitle>Contact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm leading-7 text-muted-foreground sm:text-base">
                <p>
                  For feedback, questions, or collaboration, reach out directly by
                  email.
                </p>
                <Link
                  href="mailto:sharma.1255@buckeyemail.osu.edu"
                  className="inline-flex items-center gap-3 rounded-2xl border border-border/70 bg-muted/60 px-4 py-3 font-medium text-foreground transition hover:border-primary/50 hover:bg-muted"
                >
                  <Mail className="size-4 text-primary" />
                  sharma.1255@buckeyemail.osu.edu
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
