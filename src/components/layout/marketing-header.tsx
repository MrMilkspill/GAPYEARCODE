import Link from "next/link";
import { Stethoscope } from "lucide-react";

import { buttonVariants } from "@/components/ui/button-variants";
import { marketingNavigation } from "@/lib/options";
import { cn } from "@/lib/utils";

export function MarketingHeader() {
  return (
    <header className="border-b border-border/70 bg-background/85 backdrop-blur">
      <div className="page-shell flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:py-3">
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
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
          <nav className="flex flex-wrap items-center gap-2">
            {marketingNavigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(buttonVariants({ variant: "ghost" }))}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <Link href="/login" className={cn(buttonVariants({ variant: "default" }))}>
            Sign in
          </Link>
        </div>
      </div>
    </header>
  );
}
