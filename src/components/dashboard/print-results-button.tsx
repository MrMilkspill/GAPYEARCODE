"use client";

import { Printer } from "lucide-react";

import { Button } from "@/components/ui/button";

export function PrintResultsButton() {
  return (
    <Button variant="outline" onClick={() => window.print()}>
      <Printer className="size-4" />
      Export / Print
    </Button>
  );
}
