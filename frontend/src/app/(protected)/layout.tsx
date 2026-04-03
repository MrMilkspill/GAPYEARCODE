"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { useAuth } from "@/components/auth/auth-provider";
import { AppHeader } from "@/components/layout/app-header";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { displayName, isAuthenticated, loading, user } = useAuth();

  useEffect(() => {
    if (loading || isAuthenticated) {
      return;
    }

    const next = pathname || "/dashboard";
    router.replace(`/login?next=${encodeURIComponent(next)}`);
  }, [isAuthenticated, loading, pathname, router]);

  if (loading || !isAuthenticated || !user?.email) {
    return (
      <div className="min-h-screen">
        <main className="page-shell py-16">
          <p className="text-sm text-muted-foreground">Loading your workspace...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <AppHeader user={{ displayName, email: user.email }} />
      <main className="page-shell py-8">{children}</main>
    </div>
  );
}
