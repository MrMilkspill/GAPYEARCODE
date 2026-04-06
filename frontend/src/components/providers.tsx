"use client";

import type { ReactNode } from "react";
import { Toaster } from "sonner";

import { AuthProvider } from "@/components/auth/auth-provider";
import { AuthRedirectHandler } from "@/components/auth/auth-redirect-handler";
import { TooltipProvider } from "@/components/ui/tooltip";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <AuthRedirectHandler />
      <TooltipProvider>
        {children}
        <Toaster richColors position="top-right" />
      </TooltipProvider>
    </AuthProvider>
  );
}
