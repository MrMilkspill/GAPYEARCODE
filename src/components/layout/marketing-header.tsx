import Link from "next/link";
import { Stethoscope } from "lucide-react";

import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

export function MarketingHeader() {
  return (
    <header className="border-b border-border/70 bg-background/85 backdrop-blur">
      <div className="page-shell flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Stethoscope className="size-5" />
          </div>
          <div>
            <p className="font-semibold tracking-tight">PreMed Gap Year Predictor</p>
            <p className="text-xs text-muted-foreground">
              Transparent readiness scoring for pre-med applicants
            </p>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/about" className={cn(buttonVariants({ variant: "ghost" }))}>
            Methodology
          </Link>
          <Link href="/login" className={cn(buttonVariants({ variant: "default" }))}>
            Sign in
          </Link>
        </div>
      </div>
    </header>
  );
}
