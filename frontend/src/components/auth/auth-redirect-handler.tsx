"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import {
  getSupabaseAuthRedirectHref,
  hasSupabaseAuthParams,
} from "@/lib/supabase/auth-params";


const AUTH_COMPLETION_PATHS = new Set(["/auth/callback", "/auth/confirm"]);


export function AuthRedirectHandler() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (AUTH_COMPLETION_PATHS.has(pathname)) {
      return;
    }

    const currentHref = window.location.href;

    if (!hasSupabaseAuthParams(currentHref)) {
      return;
    }

    router.replace(getSupabaseAuthRedirectHref(currentHref));
  }, [pathname, router]);

  return null;
}
