import { Suspense } from "react";

import { AuthCallbackPanel } from "@/components/auth/auth-callback-panel";


export default function AuthConfirmPage() {
  return (
    <main className="page-shell flex min-h-screen items-center justify-center py-16">
      <Suspense
        fallback={
          <div className="w-full max-w-md rounded-3xl border border-border/70 bg-card/95 p-8 shadow-xl">
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Loading sign-in...</p>
            </div>
          </div>
        }
      >
        <AuthCallbackPanel />
      </Suspense>
    </main>
  );
}
