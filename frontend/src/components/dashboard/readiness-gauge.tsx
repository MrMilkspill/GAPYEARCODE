"use client";

import { cn } from "@/lib/utils";

export function ReadinessGauge({
  score,
  className,
}: {
  score: number;
  className?: string;
}) {
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (Math.min(score, 100) / 100) * circumference;

  return (
    <div className={cn("relative flex size-44 items-center justify-center", className)}>
      <svg
        viewBox="0 0 160 160"
        className="size-full -rotate-90"
        aria-hidden="true"
      >
        <circle
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="14"
          className="text-muted/60"
        />
        <circle
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          className="text-primary transition-[stroke-dashoffset] duration-700"
        />
      </svg>
      <div className="absolute text-center">
        <p className="text-4xl font-semibold tracking-tight">{Math.round(score)}</p>
        <p className="text-sm text-muted-foreground">Readiness score</p>
      </div>
    </div>
  );
}
