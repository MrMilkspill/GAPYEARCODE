"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";

export function SignOutButton({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const { signOut } = useAuth();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant={compact ? "ghost" : "outline"}
      size={compact ? "sm" : "default"}
      onClick={() =>
        startTransition(async () => {
          await signOut();
          router.replace("/");
        })
      }
      disabled={pending}
    >
      <LogOut className="size-4" />
      {pending ? "Signing out..." : "Sign out"}
    </Button>
  );
}
