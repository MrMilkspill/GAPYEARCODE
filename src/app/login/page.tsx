import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthPanel } from "@/components/auth/auth-panel";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { getSessionUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Login",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function LoginPage() {
  const user = await getSessionUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen">
      <MarketingHeader />
      <main className="page-shell grid min-h-[calc(100vh-4rem)] items-center py-16 lg:grid-cols-[1fr_460px] lg:gap-16">
        <div className="space-y-6">
          <p className="text-sm uppercase tracking-[0.25em] text-primary">
            Secure profile storage
          </p>
          <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            Save profiles, revisit results, and plan the right application timeline.
          </h1>
          <p className="max-w-xl text-lg text-muted-foreground">
            Create an account to store multiple snapshots, update your activities as
            they grow, and compare your readiness over time.
          </p>
        </div>
        <AuthPanel />
      </main>
    </div>
  );
}
