"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import type { EmailOtpType } from "@supabase/supabase-js";

import { useAuth } from "@/components/auth/auth-provider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import { readSupabaseAuthState } from "@/lib/supabase/auth-params";
import { getSupabaseClient } from "@/lib/supabase/client";


const EMAIL_OTP_TYPES = new Set<EmailOtpType>([
  "signup",
  "email",
  "email_change",
  "invite",
  "magiclink",
  "recovery",
]);


function normalizeOtpType(type: string | null): EmailOtpType {
  if (type === "email_change_current" || type === "email_change_new") {
    return "email_change";
  }

  if (type && EMAIL_OTP_TYPES.has(type as EmailOtpType)) {
    return type as EmailOtpType;
  }

  return "email";
}


function normalizeAuthError(
  errorDescription: string | null,
  errorCode: string | null,
  error: string | null,
) {
  if (errorCode === "otp_expired") {
    return (
      "This verification link expired, was already used, or was opened by an " +
      "email security scanner. Request a new verification email and use the " +
      "newest one."
    );
  }

  if (errorCode === "bad_code_verifier" || errorCode === "flow_state_not_found") {
    return (
      "This verification link must be opened in the same browser and on the " +
      "same device that requested it. Request a new link and open it there."
    );
  }

  return errorDescription ?? error ?? "Sign-in could not be completed.";
}


function normalizeRuntimeAuthErrorMessage(message: string) {
  const normalizedMessage = message.toLowerCase();

  if (
    normalizedMessage.includes("code verifier") ||
    normalizedMessage.includes("flow state")
  ) {
    return (
      "This verification link must be opened in the same browser and on the " +
      "same device that requested it. Request a new link and open it there."
    );
  }

  if (
    normalizedMessage.includes("expired") ||
    normalizedMessage.includes("already been used") ||
    normalizedMessage.includes("invalid")
  ) {
    return (
      "This verification link expired, was already used, or was opened by an " +
      "email security scanner. Request a new verification email and use the " +
      "newest one."
    );
  }

  return message;
}


export function AuthCallbackPanel() {
  const router = useRouter();
  const { configurationError } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [authState, setAuthState] = useState(() =>
    typeof window === "undefined"
      ? {
          accessToken: null,
          code: null,
          error: null,
          errorCode: null,
          errorDescription: null,
          next: "/dashboard",
          refreshToken: null,
          tokenHash: null,
          type: null,
        }
      : readSupabaseAuthState(window.location.href),
  );

  useEffect(() => {
    setAuthState(readSupabaseAuthState(window.location.href));
  }, []);

  const {
    accessToken,
    code,
    error: authError,
    errorCode,
    errorDescription,
    next,
    refreshToken,
    tokenHash,
    type,
  } = authState;

  useEffect(() => {
    let cancelled = false;

    const completeSignIn = async () => {
      if (errorDescription || authError) {
        if (!cancelled) {
          setError(normalizeAuthError(errorDescription, errorCode, authError));
        }
        return;
      }

      if (configurationError) {
        if (!cancelled) {
          setError(configurationError);
        }
        return;
      }

      const supabase = getSupabaseClient();

      if (accessToken && refreshToken) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (cancelled) {
          return;
        }

        if (sessionError) {
          setError(normalizeRuntimeAuthErrorMessage(sessionError.message));
          return;
        }

        router.replace(next);
        return;
      }

      if (tokenHash) {
        const { error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: normalizeOtpType(type),
        });

        if (cancelled) {
          return;
        }

        if (verifyError) {
          setError(normalizeRuntimeAuthErrorMessage(verifyError.message));
          return;
        }

        router.replace(next);
        return;
      }

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
        setError(normalizeRuntimeAuthErrorMessage(exchangeError.message));
        return;
      }

      router.replace(next);
    };

    void completeSignIn();

    return () => {
      cancelled = true;
    };
  }, [
    accessToken,
    authError,
    code,
    configurationError,
    errorCode,
    errorDescription,
    next,
    refreshToken,
    router,
    tokenHash,
    type,
  ]);

  return (
    <div className="w-full max-w-md rounded-3xl border border-border/70 bg-card/95 p-8 shadow-xl">
      {error ? (
        <>
          <Alert variant="destructive">
            <AlertTitle>Authentication failed</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href={`/login?next=${encodeURIComponent(next)}`}
              className={cn(buttonVariants({ size: "lg" }))}
            >
              Back to sign in
            </Link>
            <Link
              href="/"
              className={cn(buttonVariants({ size: "lg", variant: "outline" }))}
            >
              Back home
            </Link>
          </div>
        </>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Loader2 className="size-5 animate-spin text-primary" />
            <h1 className="text-2xl font-semibold tracking-tight">
              Finalizing verification
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Verifying the email link and loading your account.
          </p>
        </div>
      )}
    </div>
  );
}
