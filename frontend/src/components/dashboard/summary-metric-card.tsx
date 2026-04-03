import type { ReactNode } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function SummaryMetricCard({
  label,
  value,
  helper,
  icon,
  className,
}: {
  label: string;
  value: string;
  helper?: string;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("border-border/70 bg-card/95 shadow-sm", className)}>
      <CardContent className="flex items-start justify-between gap-4 p-5">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
          {helper ? <p className="mt-1 text-xs text-muted-foreground">{helper}</p> : null}
        </div>
        {icon ? (
          <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            {icon}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
