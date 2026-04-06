"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";

import {
  getSupabaseClient,
  getSupabaseConfigurationError,
} from "@/lib/supabase/client";


type AuthContextValue = {
  configurationError: string | null;
  displayName: string;
  isAuthenticated: boolean;
  loading: boolean;
  session: Session | null;
  signOut: () => Promise<void>;
  user: User | null;
};


const AuthContext = createContext<AuthContextValue | null>(null);


function deriveDisplayName(user: User | null) {
  if (!user) {
    return "Applicant";
  }

  const metadataName =
    typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : null;

  if (typeof metadataName === "string" && metadataName.trim()) {
    return metadataName.trim();
  }

  return user.email?.split("@")[0] ?? "Applicant";
}


export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const configurationError = getSupabaseConfigurationError();

  useEffect(() => {
    if (configurationError) {
      setSession(null);
      setLoading(false);
      return;
    }

    let isMounted = true;
    const supabase = getSupabaseClient();

    void supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) {
        return;
      }

      setSession(data.session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, nextSession) => {
      if (!isMounted) {
        return;
      }

      setSession(nextSession);
      setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [configurationError]);

  const value = useMemo<AuthContextValue>(
    () => ({
      configurationError,
      displayName: deriveDisplayName(session?.user ?? null),
      isAuthenticated: Boolean(session?.user),
      loading,
      session,
      signOut: async () => {
        if (configurationError) {
          return;
        }

        const supabase = getSupabaseClient();
        await supabase.auth.signOut();
      },
      user: session?.user ?? null,
    }),
    [configurationError, loading, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}


export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }

  return context;
}
