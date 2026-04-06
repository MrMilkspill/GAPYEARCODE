"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { useAuth } from "@/components/auth/auth-provider";
import { AppHeader } from "@/components/layout/app-header";
import { Card, CardContent } from "@/components/ui/card";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { configurationError, displayName, isAuthenticated, loading, user } =
    useAuth();

  useEffect(() => {
    if (configurationError) {
      return;
    }

    if (loading || isAuthenticated) {
      return;
    }

    const next = pathname || "/dashboard";
    router.replace(`/login?next=${encodeURIComponent(next)}`);
  }, [configurationError, isAuthenticated, loading, pathname, router]);

  if (configurationError) {
    return (
      <div className="min-h-screen">
        <main className="page-shell py-16">
          <Card className="border-border/70 bg-card/95 shadow-sm">
            <CardContent className="space-y-3 p-8">
              <p className="text-lg font-medium">Authentication unavailable</p>
              <p className="text-sm text-muted-foreground">{configurationError}</p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

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
