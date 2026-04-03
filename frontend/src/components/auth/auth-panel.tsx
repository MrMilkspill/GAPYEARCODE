"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getSupabaseClient } from "@/lib/supabase/client";
import { magicLinkSchema } from "@/lib/validation/auth";


export function AuthPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, loading } = useAuth();
  const next = searchParams.get("next") ?? "/dashboard";
  const [emailSentTo, setEmailSentTo] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.replace(next);
    }
  }, [isAuthenticated, loading, next, router]);

  const onSubmit = (formData: FormData) => {
    startTransition(async () => {
      const email = String(formData.get("email") ?? "");
      const parsed = magicLinkSchema.safeParse({ email });

      if (!parsed.success) {
        toast.error(parsed.error.issues[0]?.message ?? "Enter a valid email.");
        return;
      }

      const redirectUrl = new URL("/auth/callback", window.location.origin);
      redirectUrl.searchParams.set("next", next);

      const supabase = getSupabaseClient();
      const { error } = await supabase.auth.signInWithOtp({
        email: parsed.data.email,
        options: {
          emailRedirectTo: redirectUrl.toString(),
          shouldCreateUser: true,
        },
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      setEmailSentTo(parsed.data.email);
      toast.success("Magic link sent. Check your inbox.");
    });
  };

  return (
    <Card className="border-border/70 bg-card/95 shadow-xl">
      <CardHeader className="space-y-4">
        <div>
          <CardTitle className="text-2xl">Continue with magic link</CardTitle>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter your email and Supabase will send a secure sign-in link. No password
            to remember, no custom auth backend to maintain.
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit(new FormData(event.currentTarget));
          }}
        >
          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <Input name="email" type="email" placeholder="alex@example.com" />
          </div>
          {emailSentTo ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950">
              Magic link sent to <span className="font-medium">{emailSentTo}</span>.
              Open the email on this device to finish signing in.
            </div>
          ) : null}
          <Button
            className="w-full"
            size="lg"
            type="submit"
            disabled={isPending || loading}
          >
            {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            {emailSentTo ? "Resend magic link" : "Send magic link"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
