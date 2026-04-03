"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

import { getSupabaseClient } from "@/lib/supabase/client";


export function AuthCallbackPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const next = searchParams.get("next") ?? "/dashboard";
  const code = searchParams.get("code");
  const errorDescription = searchParams.get("error_description");

  useEffect(() => {
    let cancelled = false;

    const completeSignIn = async () => {
      if (errorDescription) {
        if (!cancelled) {
          setError(errorDescription);
        }
        return;
      }

      const supabase = getSupabaseClient();

      if (!code) {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!cancelled) {
          if (session) {
            router.replace(next);
          } else {
            setError("The magic link is missing or expired. Request a new one.");
          }
        }

        return;
      }

      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(
        code,
      );

      if (cancelled) {
        return;
      }

      if (exchangeError) {
        setError(exchangeError.message);
        return;
      }

      router.replace(next);
    };

    void completeSignIn();

    return () => {
      cancelled = true;
    };
  }, [code, errorDescription, next, router]);

  return (
    <div className="w-full max-w-md rounded-3xl border border-border/70 bg-card/95 p-8 shadow-xl">
      {error ? (
        <div className="space-y-3">
          <h1 className="text-2xl font-semibold tracking-tight">Sign-in failed</h1>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Loader2 className="size-5 animate-spin text-primary" />
            <h1 className="text-2xl font-semibold tracking-tight">
              Finalizing sign-in
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Verifying the Supabase magic link and loading your dashboard.
          </p>
        </div>
      )}
    </div>
  );
}
