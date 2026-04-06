"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/components/auth/auth-provider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { registerAccount } from "@/lib/api/auth";
import { normalizeAuthNextPath } from "@/lib/supabase/auth-params";
import {
  normalizePasswordAuthErrorMessage,
  normalizeSignUpErrorMessage,
} from "@/lib/auth/error-messages";
import { getSupabaseClient } from "@/lib/supabase/client";
import { signInSchema, signUpSchema } from "@/lib/validation/auth";


export function AuthPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { configurationError, isAuthenticated, loading } = useAuth();
  const next = normalizeAuthNextPath(searchParams.get("next"));
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.replace(next);
    }
  }, [isAuthenticated, loading, next, router]);

  const onSubmit = (formData: FormData) => {
    startTransition(async () => {
      const currentMode = mode;
      const email = String(formData.get("email") ?? "");
      const password = String(formData.get("password") ?? "");
      const supabase = getSupabaseClient();

      try {
        if (currentMode === "sign-in") {
          const parsed = signInSchema.safeParse({ email, password });

          if (!parsed.success) {
            toast.error(parsed.error.issues[0]?.message ?? "Check your sign-in details.");
            return;
          }

          const { error } = await supabase.auth.signInWithPassword({
            email: parsed.data.email,
            password: parsed.data.password,
          });

          if (error) {
            toast.error(normalizePasswordAuthErrorMessage(error.message));
            return;
          }

          router.replace(next);
          return;
        }

        const fullName = String(formData.get("fullName") ?? "");
        const confirmPassword = String(formData.get("confirmPassword") ?? "");
        const parsed = signUpSchema.safeParse({
          fullName,
          email,
          password,
          confirmPassword,
        });

        if (!parsed.success) {
          toast.error(parsed.error.issues[0]?.message ?? "Check your account details.");
          return;
        }

        try {
          await registerAccount({
            email: parsed.data.email,
            fullName: parsed.data.fullName,
            password: parsed.data.password,
          });
        } catch (error) {
          toast.error(
            normalizeSignUpErrorMessage(
              error instanceof Error ? error.message : "Unable to create account.",
            ),
          );
          return;
        }

        const { error } = await supabase.auth.signInWithPassword({
          email: parsed.data.email,
          password: parsed.data.password,
        });

        if (error) {
          toast.error(normalizePasswordAuthErrorMessage(error.message));
          return;
        }

        toast.success("Account created.");
        router.replace(next);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Authentication failed.");
      }
    });
  };

  if (configurationError) {
    return (
      <Card className="border-border/70 bg-card/95 shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl">Authentication unavailable</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTitle>Missing frontend environment variables</AlertTitle>
            <AlertDescription>{configurationError}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/70 bg-card/95 shadow-xl">
      <CardHeader className="space-y-4">
        <div>
          <CardTitle className="text-2xl">Sign in or create an account</CardTitle>
          <p className="mt-2 text-sm text-muted-foreground">
            Use email and password authentication. New accounts are created
            immediately and can sign in right away.
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs
          value={mode}
          onValueChange={(value) => setMode(value as "sign-in" | "sign-up")}
          className="flex-col gap-4"
        >
          <TabsList className="grid h-11 w-full grid-cols-2 rounded-2xl bg-muted/45 p-1">
            <TabsTrigger
              value="sign-in"
              className="h-full rounded-xl px-3 text-sm font-medium"
            >
              Sign in
            </TabsTrigger>
            <TabsTrigger
              value="sign-up"
              className="h-full rounded-xl px-3 text-sm font-medium"
            >
              Create account
            </TabsTrigger>
          </TabsList>
          <TabsContent
            value="sign-in"
            className="rounded-2xl border border-border/60 bg-background/60 p-4"
          >
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                onSubmit(new FormData(event.currentTarget));
              }}
            >
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="alex@example.com"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Password</label>
                <Input
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="At least 8 characters"
                />
              </div>
              <Button
                className="w-full rounded-xl"
                type="submit"
                disabled={isPending || loading}
              >
                {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                Sign in
              </Button>
            </form>
          </TabsContent>
          <TabsContent
            value="sign-up"
            className="rounded-2xl border border-border/60 bg-background/60 p-4"
          >
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                onSubmit(new FormData(event.currentTarget));
              }}
            >
              <div className="space-y-2">
                <label className="text-sm font-medium">Full name</label>
                <Input
                  name="fullName"
                  type="text"
                  autoComplete="name"
                  placeholder="Alex Morgan"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="alex@example.com"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Password</label>
                <Input
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Confirm password</label>
                <Input
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Repeat your password"
                />
              </div>
              <Button
                className="w-full rounded-xl"
                type="submit"
                disabled={isPending || loading}
              >
                {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                Create account
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
