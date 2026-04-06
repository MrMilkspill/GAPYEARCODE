import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthPanel } from "@/components/auth/auth-panel";
import { MarketingHeader } from "@/components/layout/marketing-header";

export const metadata: Metadata = {
  title: "Login",
  robots: {
    index: false,
    follow: false,
  },
};

export default function LoginPage() {
  return (
    <div className="min-h-screen">
      <MarketingHeader />
      <main className="page-shell grid min-h-[calc(100vh-4rem)] items-center py-16 lg:grid-cols-[1fr_460px] lg:gap-16">
        <div className="space-y-6">
          <p className="text-sm uppercase tracking-[0.25em] text-primary">
            Secure profile storage
          </p>
          <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            Save profiles, revisit results, and sign in with verified email access.
          </h1>
          <p className="max-w-xl text-lg text-muted-foreground">
            Create an account with email and password, confirm your email once,
            store multiple snapshots, and compare your readiness over time.
          </p>
        </div>
        <Suspense
          fallback={
            <div className="rounded-3xl border border-border/70 bg-card/95 p-6 shadow-xl">
              <p className="text-sm text-muted-foreground">Loading sign-in...</p>
            </div>
          }
        >
          <AuthPanel />
        </Suspense>
      </main>
    </div>
  );
}
