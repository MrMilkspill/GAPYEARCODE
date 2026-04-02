"use client";

import { useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { registerSchema, signInSchema } from "@/lib/validation/auth";

type Mode = "sign-in" | "sign-up";

async function readJsonResponse<T>(response: Response): Promise<T | null> {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return null;
  }

  const text = await response.text();
  if (!text.trim()) {
    return null;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

export function AuthPanel() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";
  const [mode, setMode] = useState<Mode>("sign-in");
  const [isPending, startTransition] = useTransition();

  const onSubmit = (formData: FormData) => {
    startTransition(async () => {
      const email = String(formData.get("email") ?? "");
      const password = String(formData.get("password") ?? "");
      const name = String(formData.get("name") ?? "");

      if (mode === "sign-up") {
        const parsed = registerSchema.safeParse({ name, email, password });
        if (!parsed.success) {
          toast.error(parsed.error.issues[0]?.message ?? "Invalid sign up details.");
          return;
        }

        const registerResponse = await fetch("/api/auth/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(parsed.data),
        });

        const registerPayload = await readJsonResponse<{ error?: string }>(
          registerResponse,
        );

        if (!registerResponse.ok) {
          toast.error(registerPayload?.error ?? "Unable to create account.");
          return;
        }
      } else {
        const parsed = signInSchema.safeParse({ email, password });
        if (!parsed.success) {
          toast.error(parsed.error.issues[0]?.message ?? "Invalid sign in details.");
          return;
        }
      }

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl: next,
      });

      if (!result || result.error) {
        toast.error("Invalid email or password.");
        return;
      }

      toast.success(mode === "sign-up" ? "Account created." : "Signed in.");
      window.location.href = result.url ?? next;
    });
  };

  return (
    <Card className="border-border/70 bg-card/95 shadow-xl">
      <CardHeader className="space-y-4">
        <div className="inline-flex rounded-full border border-border/70 bg-muted/70 p-1">
          <button
            type="button"
            onClick={() => setMode("sign-in")}
            className={`rounded-full px-4 py-2 text-sm transition ${
              mode === "sign-in"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground"
            }`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => setMode("sign-up")}
            className={`rounded-full px-4 py-2 text-sm transition ${
              mode === "sign-up"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground"
            }`}
          >
            Create account
          </button>
        </div>
        <div>
          <CardTitle className="text-2xl">
            {mode === "sign-in" ? "Welcome back" : "Create your account"}
          </CardTitle>
          <p className="mt-2 text-sm text-muted-foreground">
            Save profiles, revisit results, and compare your trajectory over time.
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
          {mode === "sign-up" ? (
            <div className="space-y-2">
              <label className="text-sm font-medium">Full name</label>
              <Input name="name" placeholder="Alex Morgan" />
            </div>
          ) : null}
          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <Input name="email" type="email" placeholder="alex@example.com" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Password</label>
            <Input name="password" type="password" placeholder="Your password" />
          </div>
          <Button className="w-full" size="lg" type="submit" disabled={isPending}>
            {isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : null}
            {mode === "sign-in" ? "Sign in" : "Create account"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
